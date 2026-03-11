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
    private readonly TransactionLimits _limits;
    private readonly ILogger<TransactionProcessingService> _logger;

    public TransactionProcessingService(
        AppDbContext context,
        IBankService bankService,
        ITransactionValidationService validationService,
        IAuditService auditService,
        IOptions<TransactionLimits> limits,
        ILogger<TransactionProcessingService> logger)
    {
        _context = context;
        _bankService = bankService;
        _validationService = validationService;
        _auditService = auditService;
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

        // Process each pending transaction individually
        var pendingTransactions = batch.Transactions
            .Where(t => t.Status == "pending")
            .ToList();

        foreach (var transaction in pendingTransactions)
        {
            try
            {
                await ProcessTransactionAsync(transaction.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing transaction {TransactionId} in batch {BatchId}.",
                    transaction.Id, batchId);
            }
        }

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
                    throw new AppValidationException("Bank is not active or does not exist.");
                }
            }
            else
            {
                throw new AppValidationException("No bank assigned to this transaction.");
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
