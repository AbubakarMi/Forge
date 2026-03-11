using ForgeApi.Data;
using ForgeApi.DTOs.ApiKeys;
using ForgeApi.Models;
using ForgeApi.Utils;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IApiKeyService
{
    Task<ApiKeyCreatedResponse> CreateKeyAsync(Guid userId, Guid organizationId, string permissions = "read");
    Task<IEnumerable<ApiKeyListResponse>> GetKeysAsync(Guid organizationId);
    Task<bool> RevokeKeyAsync(Guid organizationId, Guid keyId);
    Task<ApiKey?> ValidateKeyAsync(string rawKey);
}

public class ApiKeyService : IApiKeyService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private static readonly HashSet<string> ValidPermissions = new(StringComparer.OrdinalIgnoreCase) { "read", "write", "admin" };

    public ApiKeyService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<ApiKeyCreatedResponse> CreateKeyAsync(Guid userId, Guid organizationId, string permissions = "read")
    {
        if (!ValidPermissions.Contains(permissions))
            throw new ArgumentException($"Invalid permissions value '{permissions}'. Must be one of: read, write, admin.");

        var rawKey = ApiKeyHasher.GenerateRawKey();
        var hash = ApiKeyHasher.HashKey(rawKey);
        var prefix = ApiKeyHasher.GetPrefix(rawKey);

        var apiKey = new ApiKey
        {
            UserId = userId,
            OrganizationId = organizationId,
            KeyHash = hash,
            KeyPrefix = prefix,
            Permissions = permissions,
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };

        _context.ApiKeys.Add(apiKey);
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(organizationId, "api_key_created", "API Key Created", $"A new API key ({prefix}...) was created with {permissions} permissions.");

        return new ApiKeyCreatedResponse
        {
            Id = apiKey.Id,
            KeyPrefix = prefix,
            FullKey = rawKey,
            Permissions = permissions,
            CreatedAt = apiKey.CreatedAt
        };
    }

    public async Task<IEnumerable<ApiKeyListResponse>> GetKeysAsync(Guid organizationId)
    {
        return await _context.ApiKeys
            .Where(k => k.OrganizationId == organizationId)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyListResponse
            {
                Id = k.Id,
                KeyPrefix = k.KeyPrefix,
                Permissions = k.Permissions,
                CreatedAt = k.CreatedAt,
                LastUsedAt = k.LastUsedAt,
                IsRevoked = k.IsRevoked
            })
            .ToListAsync();
    }

    public async Task<bool> RevokeKeyAsync(Guid organizationId, Guid keyId)
    {
        var apiKey = await _context.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == keyId && k.OrganizationId == organizationId);

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
