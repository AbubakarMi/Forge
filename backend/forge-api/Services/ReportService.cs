using System.Text;
using ForgeApi.Data;
using ForgeApi.DTOs.Reports;
using ForgeApi.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IReportService
{
    Task<byte[]> ExportBatchResultsAsync(Guid batchId, Guid orgId);
    Task<byte[]> ExportTransactionsAsync(Guid orgId, string? status = null, DateTime? dateFrom = null, DateTime? dateTo = null);
    Task<SummaryReport> GenerateSummaryReportAsync(Guid orgId, DateTime? dateFrom = null, DateTime? dateTo = null);
}

public class ReportService : IReportService
{
    private readonly AppDbContext _db;
    private readonly ILogger<ReportService> _logger;

    public ReportService(AppDbContext db, ILogger<ReportService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<byte[]> ExportBatchResultsAsync(Guid batchId, Guid orgId)
    {
        var batch = await _db.PayoutBatches
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == batchId);

        if (batch is null)
            throw new NotFoundException($"Batch {batchId} not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException("You do not have access to this batch.");

        var transactions = await _db.Transactions
            .AsNoTracking()
            .Where(t => t.PayoutBatchId == batchId)
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();

        return GenerateCsv(transactions);
    }

    public async Task<byte[]> ExportTransactionsAsync(Guid orgId, string? status = null, DateTime? dateFrom = null, DateTime? dateTo = null)
    {
        var query = _db.Transactions
            .AsNoTracking()
            .Where(t => t.OrganizationId == orgId);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        if (dateFrom.HasValue)
            query = query.Where(t => t.CreatedAt >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(t => t.CreatedAt <= dateTo.Value);

        var transactions = await query
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();

        return GenerateCsv(transactions);
    }

    public async Task<SummaryReport> GenerateSummaryReportAsync(Guid orgId, DateTime? dateFrom = null, DateTime? dateTo = null)
    {
        var batchQuery = _db.PayoutBatches.AsNoTracking().Where(b => b.OrganizationId == orgId);
        var txQuery = _db.Transactions.AsNoTracking().Where(t => t.OrganizationId == orgId);

        if (dateFrom.HasValue)
        {
            batchQuery = batchQuery.Where(b => b.CreatedAt >= dateFrom.Value);
            txQuery = txQuery.Where(t => t.CreatedAt >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            batchQuery = batchQuery.Where(b => b.CreatedAt <= dateTo.Value);
            txQuery = txQuery.Where(t => t.CreatedAt <= dateTo.Value);
        }

        var totalBatches = await batchQuery.CountAsync();
        var transactions = await txQuery.ToListAsync();

        var totalTransactions = transactions.Count;
        var totalVolume = transactions.Sum(t => t.Amount);
        var completedCount = transactions.Count(t => t.Status == "completed");
        var failedCount = transactions.Count(t => t.Status == "failed");
        var pendingCount = transactions.Count(t => t.Status == "pending");
        var successRate = totalTransactions > 0
            ? Math.Round((decimal)completedCount / totalTransactions * 100, 2)
            : 0m;

        // Top 10 banks grouped by NormalizedBankName (fallback to RawBankName)
        var topBanks = transactions
            .GroupBy(t => t.NormalizedBankName ?? t.RawBankName)
            .Select(g => new TopBankEntry
            {
                BankName = g.Key,
                TransactionCount = g.Count(),
                TotalAmount = g.Sum(t => t.Amount),
                SuccessRate = g.Count() > 0
                    ? Math.Round((decimal)g.Count(t => t.Status == "completed") / g.Count() * 100, 2)
                    : 0m
            })
            .OrderByDescending(b => b.TransactionCount)
            .Take(10)
            .ToList();

        // Daily breakdown
        var dailyBreakdown = transactions
            .GroupBy(t => t.CreatedAt.Date)
            .Select(g => new DailyBreakdown
            {
                Date = g.Key,
                TransactionCount = g.Count(),
                Amount = g.Sum(t => t.Amount),
                SuccessCount = g.Count(t => t.Status == "completed"),
                FailedCount = g.Count(t => t.Status == "failed")
            })
            .OrderBy(d => d.Date)
            .ToList();

        return new SummaryReport
        {
            TotalBatches = totalBatches,
            TotalTransactions = totalTransactions,
            TotalVolume = totalVolume,
            SuccessRate = successRate,
            CompletedCount = completedCount,
            FailedCount = failedCount,
            PendingCount = pendingCount,
            TopBanks = topBanks,
            DailyBreakdown = dailyBreakdown
        };
    }

    private static byte[] GenerateCsv(List<Models.Transaction> transactions)
    {
        var sb = new StringBuilder();
        sb.AppendLine("RecipientName,BankName,NormalizedBank,AccountNumber,Amount,Currency,Status,FailureReason,ProcessedAt");

        foreach (var t in transactions)
        {
            sb.AppendLine(string.Join(",",
                EscapeCsv(t.RecipientName),
                EscapeCsv(t.RawBankName),
                EscapeCsv(t.NormalizedBankName ?? ""),
                EscapeCsv(t.AccountNumber),
                t.Amount,
                EscapeCsv(t.Currency),
                EscapeCsv(t.Status),
                EscapeCsv(t.FailureReason ?? ""),
                t.ProcessedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
