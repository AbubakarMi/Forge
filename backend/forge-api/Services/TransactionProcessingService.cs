using ForgeApi.Configurations;
using ForgeApi.Data;
using ForgeApi.Exceptions;
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

        // Process pending transactions — optimized bulk approach
        var pendingTransactions = batch.Transactions
            .Where(t => t.Status == "pending")
            .ToList();

        // Pre-load all required banks to avoid N+1 queries
        var bankIds = pendingTransactions
            .Where(t => t.BankId.HasValue)
            .Select(t => t.BankId!.Value)
            .Distinct()
            .ToList();
        var banksMap = bankIds.Count > 0
            ? await _context.Banks.Where(b => bankIds.Contains(b.Id)).ToDictionaryAsync(b => b.Id)
            : new Dictionary<Guid, Models.Bank>();

        foreach (var transaction in pendingTransactions)
        {
            try
            {
                ProcessTransactionInMemory(transaction, banksMap);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing transaction {TransactionId} in batch {BatchId}.",
                    transaction.Id, batchId);
                transaction.Status = "failed";
                transaction.FailureReason = "Internal processing error.";
            }
        }

        // Single bulk save for all transaction updates
        await _context.SaveChangesAsync();

        // Recalculate final counts from DB
        var transactions = await _context.Transactions
            .Where(t => t.PayoutBatchId == batchId)
            .ToListAsync();

        var successCount = transactions.Count(t => t.Status == "completed");
        var failedCount = transactions.Count(t => t.Status == "failed");
        var pendingCount = transactions.Count(t => t.Status == "pending" || t.Status == "processing");

        // Reload batch to avoid concurrency issues with the entity we already modified
        var updatedBatch = await _context.PayoutBatches.FindAsync(batchId);
        if (updatedBatch != null)
        {
            updatedBatch.SuccessCount = successCount;
            updatedBatch.FailedCount = failedCount;
            updatedBatch.PendingCount = pendingCount;
            updatedBatch.Status = (failedCount == 0 && pendingCount == 0) ? "completed" : "partially_failed";
            updatedBatch.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        await _auditService.LogAsync("batch.completed", "PayoutBatch",
            batchId.ToString(), organizationId: batch.OrganizationId,
            details: $"Success: {successCount}, Failed: {failedCount}, Pending: {pendingCount}");

        if (updatedBatch != null)
        {
            if (updatedBatch.Status == "completed")
                await _notificationService.CreateNotificationAsync(batch.OrganizationId, "batch_completed", "Batch Completed", $"Batch '{batch.FileName}' processed successfully. {updatedBatch.SuccessCount} transactions completed.");
            else
                await _notificationService.CreateNotificationAsync(batch.OrganizationId, "batch_failed", "Batch Partially Failed", $"Batch '{batch.FileName}' completed with {updatedBatch.FailedCount} failures out of {batch.TotalRecords} transactions.");

            // Fire-and-forget webhook delivery
            _ = Task.Run(async () =>
            {
                try
                {
                    await _webhookService.SendWebhookAsync(batch.OrganizationId,
                        updatedBatch.Status == "completed" ? "batch.completed" : "batch.failed",
                        new { batchId = batch.Id, fileName = batch.FileName, totalRecords = batch.TotalRecords, successCount = updatedBatch.SuccessCount, failedCount = updatedBatch.FailedCount, status = updatedBatch.Status });
                }
                catch { /* webhook delivery is best-effort */ }
            });

            // Fire-and-forget email notification to org owner
            var owner = await _context.OrganizationMembers
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.OrganizationId == batch.OrganizationId && m.Role == "owner");

            if (owner != null)
            {
                if (updatedBatch.Status == "completed")
                    _ = _emailService.SendBatchCompletedAsync(owner.User.Email, batch.FileName, batch.TotalRecords, updatedBatch.SuccessCount, batch.TotalAmount);
                else
                    _ = _emailService.SendBatchFailedAsync(owner.User.Email, batch.FileName, batch.TotalRecords, updatedBatch.FailedCount, updatedBatch.SuccessCount);
            }
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

        // Update status to processing
        transaction.Status = "processing";
        await _context.SaveChangesAsync();

        try
        {
            // Validate bank exists and is active
            if (transaction.BankId.HasValue)
            {
                var bank = transaction.Bank;
                if (bank == null || !bank.IsActive)
                {
                    throw new AppValidationException($"Bank '{transaction.RawBankName}' is inactive or not recognized. Please verify the bank name.");
                }
            }
            else
            {
                throw new AppValidationException($"Could not identify bank for '{transaction.RawBankName}'. Please check the bank name spelling.");
            }

            // Validate account number (NUBAN)
            var bankCode = transaction.Bank?.Code;
            var accountErrors = _validationService.ValidateAccountNumber(transaction.AccountNumber, bankCode);
            if (accountErrors.Count > 0)
            {
                throw new AppValidationException("Account validation failed.", accountErrors);
            }

            // MVP: Mark as completed after validation passes
            transaction.Status = "completed";
            transaction.ProcessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("transaction.processed", "Transaction",
                transactionId.ToString(), organizationId: transaction.OrganizationId);

            // Fire-and-forget webhook for transaction completed
            _ = Task.Run(async () =>
            {
                try
                {
                    await _webhookService.SendWebhookAsync(transaction.OrganizationId, "transaction.completed",
                        new { transactionId = transaction.Id, amount = transaction.Amount, currency = transaction.Currency, recipientName = transaction.RecipientName, accountNumber = transaction.AccountNumber, status = transaction.Status });
                }
                catch { /* webhook delivery is best-effort */ }
            });
        }
        catch (AppValidationException ex)
        {
            transaction.Status = "failed";
            transaction.FailureReason = ex.Errors.Count > 0
                ? string.Join("; ", ex.Errors)
                : ex.Message;
            await _context.SaveChangesAsync();

            await _auditService.LogAsync("transaction.failed", "Transaction",
                transactionId.ToString(), organizationId: transaction.OrganizationId,
                details: transaction.FailureReason);

            // Fire-and-forget webhook for transaction failed
            _ = Task.Run(async () =>
            {
                try
                {
                    await _webhookService.SendWebhookAsync(transaction.OrganizationId, "transaction.failed",
                        new { transactionId = transaction.Id, amount = transaction.Amount, currency = transaction.Currency, recipientName = transaction.RecipientName, accountNumber = transaction.AccountNumber, status = transaction.Status, failureReason = transaction.FailureReason });
                }
                catch { /* webhook delivery is best-effort */ }
            });
        }
    }

    /// <summary>
    /// Fast in-memory transaction processing — no individual DB round-trips.
    /// All changes are tracked by EF Core and saved in a single bulk SaveChanges.
    /// </summary>
    private void ProcessTransactionInMemory(Models.Transaction transaction, Dictionary<Guid, Models.Bank> banksMap)
    {
        var errors = new List<string>();

        // Validate bank exists and is active
        if (transaction.BankId.HasValue)
        {
            if (banksMap.TryGetValue(transaction.BankId.Value, out var bank))
            {
                if (!bank.IsActive)
                    errors.Add($"Bank '{transaction.RawBankName}' is inactive. Please verify the bank name.");

                // Validate account number
                var accountErrors = _validationService.ValidateAccountNumber(transaction.AccountNumber, bank.Code);
                errors.AddRange(accountErrors);
            }
            else
            {
                errors.Add($"Bank '{transaction.RawBankName}' not found. Please verify the bank name.");
            }
        }
        else
        {
            errors.Add($"Could not identify bank for '{transaction.RawBankName}'. Please check the bank name spelling.");
        }

        if (errors.Count > 0)
        {
            transaction.Status = "failed";
            transaction.FailureReason = string.Join("; ", errors);
        }
        else
        {
            transaction.Status = "completed";
            transaction.ProcessedAt = DateTime.UtcNow;
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
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("transaction.retried", "Transaction",
            transactionId.ToString(), userId: userId, organizationId: transaction.OrganizationId,
            details: $"Retry #{transaction.RetryCount}");
    }
}
