using ForgeApi.Data;
using ForgeApi.DTOs.Banks;
using ForgeApi.Exceptions;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IBankService
{
    Task<IEnumerable<BankListResponse>> GetAllBanksAsync(bool includeInactive = false);
    Task<BankDetailResponse> GetBankByIdAsync(Guid bankId);
    Task<BankDetailResponse?> GetBankByCodeAsync(string code);
    Task<IEnumerable<BankListResponse>> SearchBanksAsync(string query);
    Task<BankDetailResponse> CreateBankAsync(CreateBankRequest request);
    Task<BankAliasResponse> AddAliasAsync(Guid bankId, AddBankAliasRequest request);
    Task<Bank?> FindBankByAliasAsync(string aliasText);
}

public class BankService : IBankService
{
    private readonly AppDbContext _context;

    public BankService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BankListResponse>> GetAllBanksAsync(bool includeInactive = false)
    {
        var query = _context.Banks.AsQueryable();
        if (!includeInactive)
            query = query.Where(b => b.IsActive);

        return await query
            .Include(b => b.Aliases)
            .OrderBy(b => b.Name)
            .Select(b => new BankListResponse
            {
                Id = b.Id,
                Name = b.Name,
                Code = b.Code,
                Country = b.Country,
                IsActive = b.IsActive,
                AliasCount = b.Aliases.Count
            })
            .ToListAsync();
    }

    public async Task<BankDetailResponse> GetBankByIdAsync(Guid bankId)
    {
        var bank = await _context.Banks
            .Include(b => b.Aliases)
            .FirstOrDefaultAsync(b => b.Id == bankId)
            ?? throw new NotFoundException("Bank not found.");

        return MapToDetail(bank);
    }

    public async Task<BankDetailResponse?> GetBankByCodeAsync(string code)
    {
        var bank = await _context.Banks
            .Include(b => b.Aliases)
            .FirstOrDefaultAsync(b => b.Code == code);

        return bank is null ? null : MapToDetail(bank);
    }

    public async Task<IEnumerable<BankListResponse>> SearchBanksAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return await GetAllBanksAsync();

        var normalizedQuery = query.Trim().ToLower();

        return await _context.Banks
            .Include(b => b.Aliases)
            .Where(b => b.IsActive && (
                EF.Functions.ILike(b.Name, $"%{normalizedQuery}%") ||
                EF.Functions.ILike(b.Code, $"%{normalizedQuery}%") ||
                b.Aliases.Any(a => EF.Functions.ILike(a.Alias, $"%{normalizedQuery}%"))
            ))
            .OrderBy(b => b.Name)
            .Select(b => new BankListResponse
            {
                Id = b.Id,
                Name = b.Name,
                Code = b.Code,
                Country = b.Country,
                IsActive = b.IsActive,
                AliasCount = b.Aliases.Count
            })
            .Take(50)
            .ToListAsync();
    }

    public async Task<BankDetailResponse> CreateBankAsync(CreateBankRequest request)
    {
        var nameExists = await _context.Banks.AnyAsync(b => b.Name == request.Name);
        if (nameExists)
            throw new ConflictException($"A bank with name '{request.Name}' already exists.");

        var codeExists = await _context.Banks.AnyAsync(b => b.Code == request.Code);
        if (codeExists)
            throw new ConflictException($"A bank with code '{request.Code}' already exists.");

        var bank = new Bank
        {
            Name = request.Name,
            Code = request.Code,
            Country = request.Country
        };

        _context.Banks.Add(bank);
        await _context.SaveChangesAsync();

        return MapToDetail(bank);
    }

    public async Task<BankAliasResponse> AddAliasAsync(Guid bankId, AddBankAliasRequest request)
    {
        var bank = await _context.Banks.FindAsync(bankId)
            ?? throw new NotFoundException("Bank not found.");

        var aliasExists = await _context.BankAliases
            .AnyAsync(a => EF.Functions.ILike(a.Alias, request.Alias));
        if (aliasExists)
            throw new ConflictException($"Alias '{request.Alias}' already exists.");

        var alias = new BankAlias
        {
            BankId = bankId,
            Alias = request.Alias
        };

        _context.BankAliases.Add(alias);
        await _context.SaveChangesAsync();

        return new BankAliasResponse
        {
            Id = alias.Id,
            Alias = alias.Alias,
            CreatedAt = alias.CreatedAt
        };
    }

    public async Task<Bank?> FindBankByAliasAsync(string aliasText)
    {
        if (string.IsNullOrWhiteSpace(aliasText))
            return null;

        var normalized = aliasText.Trim().ToLower();

        // Exact match on name
        var bank = await _context.Banks
            .FirstOrDefaultAsync(b => b.IsActive && EF.Functions.ILike(b.Name, normalized));

        if (bank != null) return bank;

        // Exact match on code
        bank = await _context.Banks
            .FirstOrDefaultAsync(b => b.IsActive && EF.Functions.ILike(b.Code, normalized));

        if (bank != null) return bank;

        // Match via alias
        var alias = await _context.BankAliases
            .Include(a => a.Bank)
            .FirstOrDefaultAsync(a => EF.Functions.ILike(a.Alias, normalized));

        return alias?.Bank;
    }

    private static BankDetailResponse MapToDetail(Bank bank)
    {
        return new BankDetailResponse
        {
            Id = bank.Id,
            Name = bank.Name,
            Code = bank.Code,
            Country = bank.Country,
            IsActive = bank.IsActive,
            CreatedAt = bank.CreatedAt,
            Aliases = bank.Aliases?.Select(a => new BankAliasResponse
            {
                Id = a.Id,
                Alias = a.Alias,
                CreatedAt = a.CreatedAt
            }).ToList() ?? new()
        };
    }
}
