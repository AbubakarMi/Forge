namespace ForgeApi.DTOs.ApiKeys;

/// <summary>
/// Returned ONLY on creation — the only time the full key is visible.
/// </summary>
public class ApiKeyCreatedResponse
{
    public Guid Id { get; set; }
    public string KeyPrefix { get; set; } = string.Empty;
    public string FullKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Returned on list — never includes the key or hash.
/// </summary>
public class ApiKeyListResponse
{
    public Guid Id { get; set; }
    public string KeyPrefix { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public bool IsRevoked { get; set; }
}
