using ForgeApi.Configurations;
using ForgeApi.Data;
using ForgeApi.Exceptions;
using ForgeApi.Services.PaymentProviders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ForgeApi.Services;

public interface ITransactionProcessingService
{
    Task ProcessBatchAsync(Guid batchId);
    Task ProcessTransactionAsync(Guid transactionId);
    Task RetryTransactionAsync(Guid transactionId, Guid userId);
}

public class TransactionProcessingService : ITransactionProcessingService
{
    private readonly AppDbContext _context;
    private readonly IBankService _bankService;
    private readonly ITransactionValidationService _validationService;
    private readonly IPaymentProvider _paymentProvider;
    private readonly IWalletService _walletService;
    private readonly IAuditService _auditService;
    private readonly INotificationService _notificationService;
    private readonly IWebhookService _webhookService;
    private readonly IEmailService _emailService;
    private readonly TransactionLimits _limits;
    private readonly ILogger<TransactionProcessingService> _logger;

    public TransactionProcessingService(
        AppDbContext context,
        IBankService bankService,
        ITransactionValidationService validationService,
        IPaymentProvider paymentProvider,
        IWalletService walletService,
        IAuditService auditService,
        INotificationService notificationService,
        IWebhookService webhookService,
        IEmailService emailService,
        IOptions<TransactionLimits> limits,
        ILogger<TransactionProcessingService> logger)
    {
        _context = context;
        _bankService = bankService;
        _validationService = validationService;
        _paymentProvider = paymentProvider;
        _walletService = walletService;
        _auditService = auditService;
        _notificationService = notificationService;
        _webhookService = webhookService;
        _emailService = emailService;
        _limits = limits.Value;
        _logger = logger;
    }

    public async Task ProcessBatchAsync(Guid batchId)
    {
        var batch = await _context.PayoutBatches
            .Include(b => b.Transactions)
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException("Payout batch not found.");

        if (batch.Status != "pending")
            throw new AppValidationException("Batch can only be processed when in 'pending' status.");

        // Optimistic concurrency: update status to processing
        batch.Status = "processing";
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            _logger.LogWarning("Batch {BatchId} was already picked up by another processor.", batchId);
            return;
        }

        await _auditService.LogAsync("batch.processing_started", "PayoutBatch",
            batchId.ToString(), organizationId: batch.OrganizationId);

        // ── Wallet: debit for the total pending amount ──────────────────
        var pendingTransactions = batch.Transactions
            .Where(t => t.Status == "pending")
            .ToList();

        var totalPendingAmount = pendingTransactions.Sum(t => t.Amount);

        try
        {
            await _walletService.DebitAsync(
                batch.OrganizationId,
                totalPendingAmount,
                $"BATCH-{batchId:N}"[..24],
                $"Payout batch: {batch.BatchName ?? batch.FileName} ({pendingTransactions.Count} transactions)",
                batchId);
        }
        catch (AppValidationException ex)
        {
            // Insufficient balance — fail the entire batch
            _logger.LogWarning("Insufficient wallet balance for batch {BatchId}: {Message}", batchId, ex.Message);
            batch.Status = "failed";
            batch.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _notificationService.CreateNotificationAsync(
                batch.OrganizationId, "batch_failed", "Batch Failed — Insufficient Balance",
                $"Batch '{batch.BatchName ?? batch.FileName}' could not be processed. {ex.Message}");

            await _auditService.LogAsync("batch.failed_insufficient_balance", "PayoutBatch",
                batchId.ToString(), organizationId: batch.OrganizationId, details: ex.Message);
            return;
        }

        // ── Pre-load banks ──────────────────────────────────────────────
        var bankIds = pendingTransactions
            .Where(t => t.BankId.HasValue)
            .Select(t => t.BankId!.Value)
            .Distinct()
            .ToList();
        var banksMap = bankIds.Count > 0
            ? await _context.Banks.Where(b => bankIds.Contains(b.Id)).ToDictionaryAsync(b => b.Id)
            : new Dictionary<Guid, Models.Bank>();

        // ── Process each transaction via payment provider ────────────────
        var totalRefunded = 0m;

        foreach (var transaction in pendingTransactions)
        {
            try
            {
                await ProcessSingleTransactionAsync(transaction, banksMap);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing transaction {TransactionId} in batch {BatchId}.",
                    transaction.Id, batchId);
                transaction.Status = "failed";
                transaction.FailureReason = "Internal processing error.";
            }

            // Refund wallet for failed transactions
            if (transaction.Status == "failed")
            {
                totalRefunded += transaction.Amount;
            }

            // Save after each transaction to track progress
            await _context.SaveChangesAsync();
        }

        // ── Refund wallet for total failed amount ───────────────────────
        if (totalRefunded > 0)
        {
            try
            {
                await _walletService.RefundAsync(
                    batch.OrganizationId,
                    totalRefunded,
                    $"REFUND-{batchId:N}"[..24],
                    $"Refund for {pendingTransactions.Count(t => t.Status == "failed")} failed transaction(s) in batch {batch.BatchName ?? batch.FileName}",
                    batchId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refund wallet for batch {BatchId}. Amount: {Amount}",
                    batchId, totalRefunded);
            }
        }

        // ── Recalculate final counts ────────────────────────────────────
        var allTransactions = await _context.Transactions
            .Where(t => t.PayoutBatchId == batchId)
            .ToListAsync();

        var successCount = allTransactions.Count(t => t.Status == "completed");
        var failedCount = allTransactions.Count(t => t.Status == "failed");
        var pendingCount = allTransactions.Count(t => t.Status is "pending" or "processing");
        var totalFees = allTransactions.Where(t => t.Fee.HasValue).Sum(t => t.Fee!.Value);

        var updatedBatch = await _context.PayoutBatches.FindAsync(batchId);
        if (updatedBatch != null)
        {
            updatedBatch.SuccessCount = successCount;
            updatedBatch.FailedCount = failedCount;
            updatedBatch.PendingCount = pendingCount;
            updatedBatch.TotalAmount = allTransactions.Sum(t => t.Amount);
            updatedBatch.TotalRecords = allTransactions.Count;
            updatedBatch.Status = (failedCount == 0 && pendingCount == 0) ? "completed" : "partially_failed";
            updatedBatch.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        await _auditService.LogAsync("batch.completed", "PayoutBatch",
            batchId.ToString(), organizationId: batch.OrganizationId,
            details: $"Success: {successCount}, Failed: {failedCount}, Fees: {totalFees:N2}");

        // ── Notifications, webhooks, email ──────────────────────────────
        if (updatedBatch != null)
        {
            if (updatedBatch.Status == "completed")
                await _notificationService.CreateNotificationAsync(batch.OrganizationId, "batch_completed", "Batch Completed", $"Batch '{batch.BatchName ?? batch.FileName}' processed successfully. {successCount} transactions completed.");
            else
                await _notificationService.CreateNotificationAsync(batch.OrganizationId, "batch_failed", "Batch Partially Failed", $"Batch '{batch.BatchName ?? batch.FileName}' completed with {failedCount} failures out of {allTransactions.Count} transactions.");

            _ = Task.Run(async () =>
            {
                try
                {
                    await _webhookService.SendWebhookAsync(batch.OrganizationId,
                        updatedBatch.Status == "completed" ? "batch.completed" : "batch.failed",
                        new { batchId = batch.Id, fileName = batch.FileName, totalRecords = updatedBatch.TotalRecords, successCount, failedCount, totalFees, status = updatedBatch.Status });
                }
                catch { /* best-effort */ }
            });

            var owner = await _context.OrganizationMembers
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.OrganizationId == batch.OrganizationId && m.Role == "owner");

            if (owner != null)
            {
                if (updatedBatch.Status == "completed")
                    _ = _emailService.SendBatchCompletedAsync(owner.User.Email, batch.BatchName ?? batch.FileName, updatedBatch.TotalRecords, successCount, updatedBatch.TotalAmount);
                else
                    _ = _emailService.SendBatchFailedAsync(owner.User.Email, batch.BatchName ?? batch.FileName, updatedBatch.TotalRecords, failedCount, successCount);
            }
        }
    }

    /// <summary>
    /// Process a single transaction: validate → call payment provider → update status.
    /// </summary>
    private async Task ProcessSingleTransactionAsync(
        Models.Transaction transaction, Dictionary<Guid, Models.Bank> banksMap)
    {
        transaction.Status = "processing";

        // ── Validate bank ───────────────────────────────────────────────
        string? bankCode = null;
        if (transaction.BankId.HasValue)
        {
            if (banksMap.TryGetValue(transaction.BankId.Value, out var bank))
            {
                if (!bank.IsActive)
                {
                    transaction.Status = "failed";
                    transaction.FailureReason = $"Bank '{transaction.RawBankName}' is inactive.";
                    return;
                }
                bankCode = bank.Code;
            }
            else
            {
                transaction.Status = "failed";
                transaction.FailureReason = $"Bank '{transaction.RawBankName}' not found.";
                return;
            }
        }
        else
        {
            transaction.Status = "failed";
            transaction.FailureReason = $"Could not identify bank for '{transaction.RawBankName}'.";
            return;
        }

        // ── Validate account number ─────────────────────────────────────
        var acctErrors = _validationService.ValidateAccountNumber(transaction.AccountNumber, bankCode);
        if (acctErrors.Count > 0)
        {
            transaction.Status = "failed";
            transaction.FailureReason = string.Join("; ", acctErrors);
            return;
        }

        // ── Call payment provider ───────────────────────────────────────
        var reference = $"FRG-{transaction.Id:N}"[..24];

        var result = await _paymentProvider.InitiateTransferAsync(
            transaction.RecipientName,
            transaction.AccountNumber,
            bankCode,
            transaction.Amount,
            transaction.Currency,
            reference,
            $"Payout to {transaction.RecipientName}");

        transaction.ProviderReference = result.ProviderReference;
        transaction.ProviderStatus = result.ProviderStatus;
        transaction.Fee = result.Fee;

        if (result.Success)
        {
            // Provider accepted the transfer (may be pending or completed)
            if (result.ProviderStatus == "success")
            {
                transaction.Status = "completed";
                transaction.ProcessedAt = DateTime.UtcNow;
            }
            else
            {
                // Transfer accepted but pending (Paystack processes asynchronously)
                transaction.Status = "completed";
                transaction.ProcessedAt = DateTime.UtcNow;
            }
        }
        else
        {
            transaction.Status = "failed";
            transaction.FailureReason = result.ErrorMessage ?? "Payment provider rejected the transfer.";
        }
    }

    public async Task ProcessTransactionAsync(Guid transactionId)
    {
        var transaction = await _context.Transactions
            .Include(t => t.Bank)
            .FirstOrDefaultAsync(t => t.Id == transactionId)
            ?? throw new NotFoundException("Transaction not found.");

        if (transaction.Status != "pending")
            return;

        transaction.Status = "processing";
        await _context.SaveChangesAsync();

        try
        {
            if (!transaction.BankId.HasValue || transaction.Bank == null || !transaction.Bank.IsActive)
            {
                throw new AppValidationException($"Bank '{transaction.RawBankName}' is inactive or not recognized.");
            }

            var bankCode = transaction.Bank.Code;
            var accountErrors = _validationService.ValidateAccountNumber(transaction.AccountNumber, bankCode);
            if (accountErrors.Count > 0)
                throw new AppValidationException("Account validation failed.", accountErrors);

            var reference = $"FRG-{transaction.Id:N}"[..24];
            var result = await _paymentProvider.InitiateTransferAsync(
                transaction.RecipientName,
                transaction.AccountNumber,
                bankCode,
                transaction.Amount,
                transaction.Currency,
                reference);

            transaction.ProviderReference = result.ProviderReference;
            transaction.ProviderStatus = result.ProviderStatus;
            transaction.Fee = result.Fee;

            if (result.Success)
            {
                transaction.Status = "completed";
                transaction.ProcessedAt = DateTime.UtcNow;
            }
            else
            {
                throw new AppValidationException(result.ErrorMessage ?? "Transfer failed.");
            }

            await _context.SaveChangesAsync();

            await _auditService.LogAsync("transaction.processed", "Transaction",
                transactionId.ToString(), organizationId: transaction.OrganizationId);

            _ = Task.Run(async () =>
            {
                try
                {
                    await _webhookService.SendWebhookAsync(transaction.OrganizationId, "transaction.completed",
                        new { transactionId = transaction.Id, amount = transaction.Amount, currency = transaction.Currency, recipientName = transaction.RecipientName, providerReference = transaction.ProviderReference, status = transaction.Status });
                }
                catch { }
            });
        }
        catch (AppValidationException ex)
        {
            transaction.Status = "failed";
            transaction.FailureReason = ex.Errors.Count > 0 ? string.Join("; ", ex.Errors) : ex.Message;
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("transaction.failed", "Transaction",
                transactionId.ToString(), organizationId: transaction.OrganizationId,
                details: transaction.FailureReason);

            _ = Task.Run(async () =>
            {
                try
                {
                    await _webhookService.SendWebhookAsync(transaction.OrganizationId, "transaction.failed",
                        new { transactionId = transaction.Id, amount = transaction.Amount, failureReason = transaction.FailureReason, status = transaction.Status });
                }
                catch { }
            });
        }
    }

    public async Task RetryTransactionAsync(Guid transactionId, Guid userId)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId)
            ?? throw new NotFoundException("Transaction not found.");

        if (transaction.Status != "failed")
            throw new AppValidationException("Only failed transactions can be retried.");

        if (transaction.RetryCount >= _limits.MaxRetryCount)
            throw new AppValidationException(
                $"Maximum retry count ({_limits.MaxRetryCount}) exceeded for this transaction.");

        transaction.RetryCount++;
        transaction.Status = "pending";
        transaction.FailureReason = null;
        transaction.ProviderReference = null;
        transaction.ProviderStatus = null;
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("transaction.retried", "Transaction",
            transactionId.ToString(), userId: userId, organizationId: transaction.OrganizationId,
            details: $"Retry #{transaction.RetryCount}");
    }
}
