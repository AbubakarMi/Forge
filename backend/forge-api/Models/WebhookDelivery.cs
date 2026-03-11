namespace ForgeApi.Models;

public class WebhookDelivery
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WebhookEndpointId { get; set; }
    public string Event { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty; // JSON
    public int? StatusCode { get; set; }
    public string? Response { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public int Attempts { get; set; } = 0;
    public DateTime? NextRetryAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public WebhookEndpoint WebhookEndpoint { get; set; } = null!;
}
