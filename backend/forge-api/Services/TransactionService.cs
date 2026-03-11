using ForgeApi.Data;
using ForgeApi.DTOs.Transactions;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface ITransactionService
{
    Task<IEnumerable<TransactionResponse>> GetTransactionsAsync(Guid organizationId);
}

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _context;

    public TransactionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TransactionResponse>> GetTransactionsAsync(Guid organizationId)
    {
        return await _context.Transactions
            .Where(t => t.OrganizationId == organizationId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TransactionResponse
            {
                Id = t.Id,
                Amount = t.Amount,
                Currency = t.Currency,
                Status = t.Status,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();
    }
}
