using ForgeApi.Data;
using ForgeApi.DTOs.Payouts;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IPayoutService
{
    Task<IEnumerable<PayoutResponse>> GetPayoutsAsync(Guid organizationId);
}

public class PayoutService : IPayoutService
{
    private readonly AppDbContext _context;

    public PayoutService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PayoutResponse>> GetPayoutsAsync(Guid organizationId)
    {
        return await _context.Payouts
            .Include(p => p.Transaction)
            .Where(p => p.Transaction.OrganizationId == organizationId)
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
