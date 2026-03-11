using ForgeApi.Data;
using ForgeApi.DTOs.ApiKeys;
using ForgeApi.Models;
using ForgeApi.Utils;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IApiKeyService
{
    Task<ApiKeyCreatedResponse> CreateKeyAsync(Guid userId);
    Task<IEnumerable<ApiKeyListResponse>> GetKeysAsync(Guid userId);
    Task<bool> RevokeKeyAsync(Guid userId, Guid keyId);
    Task<ApiKey?> ValidateKeyAsync(string rawKey);
}

public class ApiKeyService : IApiKeyService
{
    private readonly AppDbContext _context;

    public ApiKeyService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiKeyCreatedResponse> CreateKeyAsync(Guid userId)
    {
        var rawKey = ApiKeyHasher.GenerateRawKey();
        var hash = ApiKeyHasher.HashKey(rawKey);
        var prefix = ApiKeyHasher.GetPrefix(rawKey);

        var apiKey = new ApiKey
        {
            UserId = userId,
            KeyHash = hash,
            KeyPrefix = prefix,
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

        _context.ApiKeys.Add(apiKey);
        await _context.SaveChangesAsync();

        return new ApiKeyCreatedResponse
        {
            Id = apiKey.Id,
            KeyPrefix = prefix,
            FullKey = rawKey,
            CreatedAt = apiKey.CreatedAt
        };
    }

    public async Task<IEnumerable<ApiKeyListResponse>> GetKeysAsync(Guid userId)
    {
        return await _context.ApiKeys
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyListResponse
            {
                Id = k.Id,
                KeyPrefix = k.KeyPrefix,
                CreatedAt = k.CreatedAt,
                LastUsedAt = k.LastUsedAt,
                IsRevoked = k.IsRevoked
            })
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

    public async Task<ApiKey?> ValidateKeyAsync(string rawKey)
    {
        var hash = ApiKeyHasher.HashKey(rawKey);

        var apiKey = await _context.ApiKeys
            .Include(k => k.User)
            .FirstOrDefaultAsync(k => k.KeyHash == hash);

        if (apiKey is null || apiKey.IsRevoked)
            return null;

        // Update last used tracking
        apiKey.LastUsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return apiKey;
    }
}
