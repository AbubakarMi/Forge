namespace ForgeApi.DTOs.ApiKeys;

public class ApiKeyCreatedResponse
{
    public Guid Id { get; set; }
    public string KeyPrefix { get; set; } = string.Empty;
    public string FullKey { get; set; } = string.Empty;
    public string Permissions { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ApiKeyListResponse
{
    public Guid Id { get; set; }
    public string KeyPrefix { get; set; } = string.Empty;
    public string Permissions { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public bool IsRevoked { get; set; }
}

public class CreateApiKeyRequest
{
    public string Permissions { get; set; } = "read";
}
