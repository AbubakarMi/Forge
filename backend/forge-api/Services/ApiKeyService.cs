using ForgeApi.Data;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IApiKeyService
{
    Task<ApiKey> CreateKeyAsync(Guid userId);
    Task<IEnumerable<ApiKey>> GetKeysAsync(Guid userId);
    Task<bool> RevokeKeyAsync(Guid userId, Guid keyId);
}

public class ApiKeyService : IApiKeyService
{
    private readonly AppDbContext _context;

    public ApiKeyService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiKey> CreateKeyAsync(Guid userId)
    {
        var rawKey = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
                            .ToLowerInvariant();

        var apiKey = new ApiKey
        {
            UserId = userId,
            Key = $"forge_{rawKey}",
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

        _context.ApiKeys.Add(apiKey);
        await _context.SaveChangesAsync();

        return apiKey;
    }

    public async Task<IEnumerable<ApiKey>> GetKeysAsync(Guid userId)
    {
        return await _context.ApiKeys
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> RevokeKeyAsync(Guid userId, Guid keyId)
    {
        var apiKey = await _context.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == keyId && k.UserId == userId);

        if (apiKey is null)
            return false;

        apiKey.IsRevoked = true;
        await _context.SaveChangesAsync();

        return true;
    }
}
