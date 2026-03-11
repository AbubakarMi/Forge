namespace ForgeApi.Models;

public class WebhookEndpoint
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Events { get; set; } = string.Empty; // comma-separated: batch.completed,batch.failed,transaction.completed,transaction.failed
    public string Secret { get; set; } = string.Empty; // HMAC signing secret (stored as plaintext for signing — NOT a credential)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization Organization { get; set; } = null!;
    public ICollection<WebhookDelivery> Deliveries { get; set; } = new List<WebhookDelivery>();
}
