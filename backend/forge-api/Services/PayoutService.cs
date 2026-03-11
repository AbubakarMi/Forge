using ForgeApi.Data;
using ForgeApi.DTOs.Payouts;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IPayoutService
{
    Task<PayoutResponse> CreatePayoutAsync(Guid userId, CreatePayoutRequest request);
    Task<IEnumerable<PayoutResponse>> GetPayoutsAsync(Guid userId);
}

public class PayoutService : IPayoutService
{
    private readonly AppDbContext _context;

    public PayoutService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PayoutResponse> CreatePayoutAsync(Guid userId, CreatePayoutRequest request)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == request.TransactionId && t.UserId == userId);

        if (transaction is null)
            throw new KeyNotFoundException("Transaction not found or does not belong to this user.");

        var payout = new Payout
        {
            TransactionId = transaction.Id,
            BankAccount = request.BankAccount,
            Status = "pending",
            ProcessedAt = null
        };

        _context.Payouts.Add(payout);
        await _context.SaveChangesAsync();

        return new PayoutResponse
        {
            Id = payout.Id,
            TransactionId = payout.TransactionId,
            BankAccount = payout.BankAccount,
            Status = payout.Status,
            ProcessedAt = payout.ProcessedAt
        };
    }

    public async Task<IEnumerable<PayoutResponse>> GetPayoutsAsync(Guid userId)
    {
        return await _context.Payouts
            .Include(p => p.Transaction)
            .Where(p => p.Transaction.UserId == userId)
            .OrderByDescending(p => p.Transaction.CreatedAt)
            .Select(p => new PayoutResponse
            {
                Id = p.Id,
                TransactionId = p.TransactionId,
                BankAccount = p.BankAccount,
                Status = p.Status,
                ProcessedAt = p.ProcessedAt
            })
            .ToListAsync();
    }
}
