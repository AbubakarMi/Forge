using ForgeApi.Data;
using ForgeApi.DTOs.Transactions;
using ForgeApi.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface ITransactionService
{
    Task<(IEnumerable<TransactionResponse> Transactions, int TotalCount)> GetTransactionsAsync(
        Guid organizationId, TransactionFilterRequest filters);
    Task<TransactionDetailResponse> GetTransactionByIdAsync(Guid transactionId, Guid organizationId);
    Task<TransactionStatsResponse> GetTransactionStatsAsync(Guid organizationId);
}

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _context;

    public TransactionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<TransactionResponse> Transactions, int TotalCount)> GetTransactionsAsync(
        Guid organizationId, TransactionFilterRequest filters)
    {
        var query = _context.Transactions
            .Include(t => t.Bank)
            .Where(t => t.OrganizationId == organizationId);

        // Apply filters
        if (!string.IsNullOrWhiteSpace(filters.Status))
            query = query.Where(t => t.Status == filters.Status);

        if (filters.BatchId.HasValue)
            query = query.Where(t => t.PayoutBatchId == filters.BatchId.Value);

        if (filters.DateFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= filters.DateFrom.Value);

        if (filters.DateTo.HasValue)
            query = query.Where(t => t.CreatedAt <= filters.DateTo.Value);

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var search = filters.Search.Trim().ToLower();
            query = query.Where(t =>
                t.RecipientName.ToLower().Contains(search) ||
                t.RawBankName.ToLower().Contains(search) ||
                t.AccountNumber.Contains(search));
        }

        var totalCount = await query.CountAsync();

        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .Select(t => new TransactionResponse
            {
                Id = t.Id,
                PayoutBatchId = t.PayoutBatchId,
                RecipientName = t.RecipientName,
                RawBankName = t.RawBankName,
                NormalizedBankName = t.NormalizedBankName,
                BankCode = t.Bank != null ? t.Bank.Code : null,
                AccountNumber = t.AccountNumber,
                Amount = t.Amount,
                Currency = t.Currency,
                Status = t.Status,
                FailureReason = t.FailureReason,
                NormalizationConfidence = t.NormalizationConfidence,
                RetryCount = t.RetryCount,
                ProcessedAt = t.ProcessedAt,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return (transactions, totalCount);
    }

    public async Task<TransactionDetailResponse> GetTransactionByIdAsync(Guid transactionId, Guid organizationId)
    {
        var transaction = await _context.Transactions
            .Include(t => t.Bank)
            .Include(t => t.PayoutBatch)
            .FirstOrDefaultAsync(t => t.Id == transactionId)
            ?? throw new NotFoundException("Transaction not found.");

        if (transaction.OrganizationId != organizationId)
            throw new ForbiddenException("You do not have access to this transaction.");

        return new TransactionDetailResponse
        {
            Id = transaction.Id,
            PayoutBatchId = transaction.PayoutBatchId,
            RecipientName = transaction.RecipientName,
            RawBankName = transaction.RawBankName,
            NormalizedBankName = transaction.NormalizedBankName,
            BankCode = transaction.Bank?.Code,
            AccountNumber = transaction.AccountNumber,
            Amount = transaction.Amount,
            Currency = transaction.Currency,
            Status = transaction.Status,
            FailureReason = transaction.FailureReason,
            NormalizationConfidence = transaction.NormalizationConfidence,
            RetryCount = transaction.RetryCount,
            ProcessedAt = transaction.ProcessedAt,
            CreatedAt = transaction.CreatedAt,
            BankName = transaction.Bank?.Name,
            BatchFileName = transaction.PayoutBatch?.FileName ?? string.Empty
        };
    }

    public async Task<TransactionStatsResponse> GetTransactionStatsAsync(Guid organizationId)
    {
        var transactions = await _context.Transactions
            .Where(t => t.OrganizationId == organizationId)
            .GroupBy(t => t.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count(),
                Amount = g.Sum(t => t.Amount)
            })
            .ToListAsync();

        var totalTransactions = transactions.Sum(t => t.Count);
        var completedCount = transactions.FirstOrDefault(t => t.Status == "completed")?.Count ?? 0;
        var failedCount = transactions.FirstOrDefault(t => t.Status == "failed")?.Count ?? 0;
        var pendingCount = transactions.FirstOrDefault(t => t.Status == "pending")?.Count ?? 0;
        var processingCount = transactions.FirstOrDefault(t => t.Status == "processing")?.Count ?? 0;
        var totalAmount = transactions.Sum(t => t.Amount);
        var completedAmount = transactions.FirstOrDefault(t => t.Status == "completed")?.Amount ?? 0;

        var successRate = totalTransactions > 0
            ? Math.Round((decimal)completedCount / totalTransactions * 100, 2)
            : 0m;

        return new TransactionStatsResponse
        {
            TotalTransactions = totalTransactions,
            CompletedCount = completedCount,
            FailedCount = failedCount,
            PendingCount = pendingCount,
            ProcessingCount = processingCount,
            TotalAmount = totalAmount,
            CompletedAmount = completedAmount,
            SuccessRate = successRate
        };
    }
}
