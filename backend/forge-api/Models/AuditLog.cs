namespace ForgeApi.Models;

public class AuditLog
{
    public long Id { get; set; }
    public Guid? UserId { get; set; }
    public Guid? OrganizationId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
