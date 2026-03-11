namespace ForgeApi.DTOs.Webhooks;

public class RegisterWebhookRequest
{
    public string Url { get; set; } = string.Empty;
    public List<string> Events { get; set; } = new();
}

public class WebhookEndpointResponse
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public List<string> Events { get; set; } = new();
    public string Secret { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WebhookDeliveryResponse
{
    public Guid Id { get; set; }
    public string Event { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public int? StatusCode { get; set; }
    public string? Response { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public int Attempts { get; set; }
    public DateTime CreatedAt { get; set; }
}
