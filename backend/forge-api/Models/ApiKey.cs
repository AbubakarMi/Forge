namespace ForgeApi.Models;

public class ApiKey
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string KeyHash { get; set; } = string.Empty;
    public string KeyPrefix { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }
    public string? LastUsedFromIp { get; set; }
    public bool IsRevoked { get; set; } = false;

    public User User { get; set; } = null!;
}
