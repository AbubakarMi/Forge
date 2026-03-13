using ForgeApi.Data;
using ForgeApi.DTOs.Wallet;
using ForgeApi.Exceptions;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IWalletService
{
    Task<Wallet> GetOrCreateWalletAsync(Guid orgId);
    Task<WalletBalanceResponse> GetBalanceAsync(Guid orgId);
    Task<WalletTransaction> CreditAsync(Guid orgId, decimal amount, string reference, string description, Guid? batchId = null);
    Task<WalletTransaction> DebitAsync(Guid orgId, decimal amount, string reference, string description, Guid? batchId = null);
    Task<WalletTransaction> RefundAsync(Guid orgId, decimal amount, string reference, string description, Guid? batchId = null, Guid? transactionId = null);
    Task<bool> HasSufficientBalanceAsync(Guid orgId, decimal amount);
    Task<(List<WalletTransactionResponse> Items, int TotalCount)> GetHistoryAsync(Guid orgId, WalletHistoryFilter filter);
}

public class WalletService : IWalletService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;
    private readonly ILogger<WalletService> _logger;

    public WalletService(AppDbContext context, IAuditService audit, ILogger<WalletService> logger)
    {
        _context = context;
        _audit = audit;
        _logger = logger;
    }

    public async Task<Wallet> GetOrCreateWalletAsync(Guid orgId)
    {
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.OrganizationId == orgId);
        if (wallet != null) return wallet;

        wallet = new Wallet { OrganizationId = orgId };
        _context.Wallets.Add(wallet);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created wallet for organization {OrgId}", orgId);
        return wallet;
    }

    public async Task<WalletBalanceResponse> GetBalanceAsync(Guid orgId)
    {
        var wallet = await GetOrCreateWalletAsync(orgId);
        return new WalletBalanceResponse
        {
            Balance = wallet.Balance,
            Currency = wallet.Currency,
            IsActive = wallet.IsActive,
            UpdatedAt = wallet.UpdatedAt
        };
    }

    public async Task<WalletTransaction> CreditAsync(
        Guid orgId, decimal amount, string reference, string description, Guid? batchId = null)
    {
        if (amount <= 0) throw new AppValidationException("Credit amount must be positive.");

        var wallet = await GetOrCreateWalletAsync(orgId);
        var balanceBefore = wallet.Balance;

        wallet.Balance += amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var walletTx = new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = "credit",
            Amount = amount,
            Reference = reference,
            Description = description,
            BalanceBefore = balanceBefore,
            BalanceAfter = wallet.Balance,
            PayoutBatchId = batchId
        };

        _context.WalletTransactions.Add(walletTx);
        await _context.SaveChangesAsync();

        await _audit.LogAsync("wallet.credit", "Wallet", wallet.Id.ToString(),
            organizationId: orgId,
            details: $"Credited {amount:N2} {wallet.Currency}. Ref: {reference}. Balance: {wallet.Balance:N2}");

        return walletTx;
    }

    public async Task<WalletTransaction> DebitAsync(
        Guid orgId, decimal amount, string reference, string description, Guid? batchId = null)
    {
        if (amount <= 0) throw new AppValidationException("Debit amount must be positive.");

        var wallet = await GetOrCreateWalletAsync(orgId);

        if (wallet.Balance < amount)
            throw new AppValidationException(
                $"Insufficient wallet balance. Available: {wallet.Balance:N2} {wallet.Currency}, Required: {amount:N2} {wallet.Currency}.");

        var balanceBefore = wallet.Balance;

        wallet.Balance -= amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var walletTx = new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = "debit",
            Amount = amount,
            Reference = reference,
            Description = description,
            BalanceBefore = balanceBefore,
            BalanceAfter = wallet.Balance,
            PayoutBatchId = batchId
        };

        _context.WalletTransactions.Add(walletTx);
        await _context.SaveChangesAsync();

        await _audit.LogAsync("wallet.debit", "Wallet", wallet.Id.ToString(),
            organizationId: orgId,
            details: $"Debited {amount:N2} {wallet.Currency}. Ref: {reference}. Balance: {wallet.Balance:N2}");

        return walletTx;
    }

    public async Task<WalletTransaction> RefundAsync(
        Guid orgId, decimal amount, string reference, string description,
        Guid? batchId = null, Guid? transactionId = null)
    {
        if (amount <= 0) throw new AppValidationException("Refund amount must be positive.");

        var wallet = await GetOrCreateWalletAsync(orgId);
        var balanceBefore = wallet.Balance;

        wallet.Balance += amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        var walletTx = new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = "refund",
            Amount = amount,
            Reference = reference,
            Description = description,
            BalanceBefore = balanceBefore,
            BalanceAfter = wallet.Balance,
            PayoutBatchId = batchId,
            TransactionId = transactionId
        };

        _context.WalletTransactions.Add(walletTx);
        await _context.SaveChangesAsync();

        await _audit.LogAsync("wallet.refund", "Wallet", wallet.Id.ToString(),
            organizationId: orgId,
            details: $"Refunded {amount:N2} {wallet.Currency}. Ref: {reference}. Balance: {wallet.Balance:N2}");

        return walletTx;
    }

    public async Task<bool> HasSufficientBalanceAsync(Guid orgId, decimal amount)
    {
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.OrganizationId == orgId);
        return wallet != null && wallet.Balance >= amount;
    }

    public async Task<(List<WalletTransactionResponse> Items, int TotalCount)> GetHistoryAsync(
        Guid orgId, WalletHistoryFilter filter)
    {
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.OrganizationId == orgId);
        if (wallet == null) return (new List<WalletTransactionResponse>(), 0);

        var query = _context.WalletTransactions
            .Where(wt => wt.WalletId == wallet.Id);

        if (!string.IsNullOrWhiteSpace(filter.Type))
            query = query.Where(wt => wt.Type == filter.Type);

        if (filter.From.HasValue)
            query = query.Where(wt => wt.CreatedAt >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(wt => wt.CreatedAt <= filter.To.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(wt => wt.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(wt => new WalletTransactionResponse
            {
                Id = wt.Id,
                Type = wt.Type,
                Amount = wt.Amount,
                Reference = wt.Reference,
                Description = wt.Description,
                BalanceBefore = wt.BalanceBefore,
                BalanceAfter = wt.BalanceAfter,
                PayoutBatchId = wt.PayoutBatchId,
                TransactionId = wt.TransactionId,
                CreatedAt = wt.CreatedAt
            })
            .ToListAsync();

        return (items, totalCount);
    }
}
