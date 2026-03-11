using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using ForgeApi.Data;
using ForgeApi.DTOs.Webhooks;
using ForgeApi.Exceptions;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IWebhookService
{
    Task<WebhookEndpointResponse> RegisterEndpointAsync(Guid orgId, RegisterWebhookRequest request);
    Task<IEnumerable<WebhookEndpointResponse>> GetEndpointsAsync(Guid orgId);
    Task RemoveEndpointAsync(Guid endpointId, Guid orgId);
    Task SendWebhookAsync(Guid orgId, string eventType, object payload);
    Task TestEndpointAsync(Guid endpointId, Guid orgId);
    Task<IEnumerable<WebhookDeliveryResponse>> GetDeliveriesAsync(Guid endpointId, Guid orgId);
    Task RetryDeliveryAsync(Guid deliveryId, Guid orgId);
}

public class WebhookService : IWebhookService
{
    private static readonly HashSet<string> AllowedEvents = new(StringComparer.OrdinalIgnoreCase)
    {
        "batch.completed", "batch.failed", "transaction.completed", "transaction.failed"
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly IAuditService _auditService;
    private readonly ILogger<WebhookService> _logger;

    public WebhookService(
        AppDbContext context,
        HttpClient httpClient,
        IAuditService auditService,
        ILogger<WebhookService> logger)
    {
        _context = context;
        _httpClient = httpClient;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<WebhookEndpointResponse> RegisterEndpointAsync(Guid orgId, RegisterWebhookRequest request)
    {
        // Validate URL
        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uri)
            || (uri.Scheme != "https" && uri.Scheme != "http"))
        {
            throw new AppValidationException("Invalid webhook URL. Must be an absolute HTTP(S) URL.");
        }

        // Validate events
        if (request.Events == null || request.Events.Count == 0)
            throw new AppValidationException("At least one event must be specified.");

        var invalidEvents = request.Events.Where(e => !AllowedEvents.Contains(e)).ToList();
        if (invalidEvents.Count > 0)
            throw new AppValidationException($"Invalid events: {string.Join(", ", invalidEvents)}. Allowed: {string.Join(", ", AllowedEvents)}");

        // Generate secret
        var secretBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(secretBytes);
        }
        var secret = Convert.ToBase64String(secretBytes);

        var endpoint = new WebhookEndpoint
        {
            OrganizationId = orgId,
            Url = request.Url,
            Events = string.Join(",", request.Events.Select(e => e.ToLowerInvariant())),
            Secret = secret,
            IsActive = true
        };

        _context.WebhookEndpoints.Add(endpoint);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("webhook.registered", "WebhookEndpoint",
            endpoint.Id.ToString(), organizationId: orgId,
            details: $"URL: {endpoint.Url}, Events: {endpoint.Events}");

        return MapToResponse(endpoint);
    }

    public async Task<IEnumerable<WebhookEndpointResponse>> GetEndpointsAsync(Guid orgId)
    {
        var endpoints = await _context.WebhookEndpoints
            .Where(w => w.OrganizationId == orgId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return endpoints.Select(MapToResponse);
    }

    public async Task RemoveEndpointAsync(Guid endpointId, Guid orgId)
    {
        var endpoint = await _context.WebhookEndpoints
            .FirstOrDefaultAsync(w => w.Id == endpointId)
            ?? throw new NotFoundException("Webhook endpoint not found.");

        if (endpoint.OrganizationId != orgId)
            throw new ForbiddenException("You do not have access to this webhook endpoint.");

        _context.WebhookEndpoints.Remove(endpoint);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("webhook.removed", "WebhookEndpoint",
            endpointId.ToString(), organizationId: orgId,
            details: $"URL: {endpoint.Url}");
    }

    public async Task SendWebhookAsync(Guid orgId, string eventType, object payload)
    {
        try
        {
            var endpoints = await _context.WebhookEndpoints
                .Where(w => w.OrganizationId == orgId && w.IsActive)
                .ToListAsync();

            var matchingEndpoints = endpoints
                .Where(w => w.Events.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Any(e => e.Trim().Equals(eventType, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            if (matchingEndpoints.Count == 0) return;

            var rawJson = JsonSerializer.Serialize(payload, JsonOptions);
            var maskedJson = MaskSensitiveData(rawJson);

            foreach (var endpoint in matchingEndpoints)
            {
                await DeliverWebhookAsync(endpoint, eventType, maskedJson);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending webhooks for org {OrgId}, event {Event}.", orgId, eventType);
            // Fire-and-forget: never throw
        }
    }

    public async Task TestEndpointAsync(Guid endpointId, Guid orgId)
    {
        var endpoint = await _context.WebhookEndpoints
            .FirstOrDefaultAsync(w => w.Id == endpointId)
            ?? throw new NotFoundException("Webhook endpoint not found.");

        if (endpoint.OrganizationId != orgId)
            throw new ForbiddenException("You do not have access to this webhook endpoint.");

        var testPayload = JsonSerializer.Serialize(new
        {
            @event = "test",
            message = "This is a test webhook delivery from Forge API.",
            timestamp = DateTime.UtcNow
        }, JsonOptions);

        await DeliverWebhookAsync(endpoint, "test", testPayload);
    }

    public async Task<IEnumerable<WebhookDeliveryResponse>> GetDeliveriesAsync(Guid endpointId, Guid orgId)
    {
        var endpoint = await _context.WebhookEndpoints
            .FirstOrDefaultAsync(w => w.Id == endpointId)
            ?? throw new NotFoundException("Webhook endpoint not found.");

        if (endpoint.OrganizationId != orgId)
            throw new ForbiddenException("You do not have access to this webhook endpoint.");

        var deliveries = await _context.WebhookDeliveries
            .Where(d => d.WebhookEndpointId == endpointId)
            .OrderByDescending(d => d.CreatedAt)
            .Take(100)
            .ToListAsync();

        return deliveries.Select(d => new WebhookDeliveryResponse
        {
            Id = d.Id,
            Event = d.Event,
            Payload = d.Payload,
            StatusCode = d.StatusCode,
            Response = d.Response,
            DeliveredAt = d.DeliveredAt,
            Attempts = d.Attempts,
            CreatedAt = d.CreatedAt
        });
    }

    public async Task RetryDeliveryAsync(Guid deliveryId, Guid orgId)
    {
        var delivery = await _context.WebhookDeliveries
            .Include(d => d.WebhookEndpoint)
            .FirstOrDefaultAsync(d => d.Id == deliveryId)
            ?? throw new NotFoundException("Webhook delivery not found.");

        if (delivery.WebhookEndpoint.OrganizationId != orgId)
            throw new ForbiddenException("You do not have access to this webhook delivery.");

        if (delivery.Attempts >= 5)
            throw new AppValidationException("Maximum retry attempts (5) reached for this delivery.");

        await DeliverWebhookAsync(delivery.WebhookEndpoint, delivery.Event, delivery.Payload, delivery);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private async Task DeliverWebhookAsync(WebhookEndpoint endpoint, string eventType, string payload, WebhookDelivery? existingDelivery = null)
    {
        var delivery = existingDelivery ?? new WebhookDelivery
        {
            WebhookEndpointId = endpoint.Id,
            Event = eventType,
            Payload = payload
        };

        delivery.Attempts++;

        try
        {
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var signature = ComputeSignature(endpoint.Secret, timestamp, payload);

            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint.Url);
            request.Content = new StringContent(payload, Encoding.UTF8, "application/json");
            request.Headers.Add("X-Forge-Signature", signature);
            request.Headers.Add("X-Forge-Event", eventType);
            request.Headers.Add("X-Forge-Delivery-Id", delivery.Id.ToString());
            request.Headers.Add("X-Forge-Timestamp", timestamp);

            using var response = await _httpClient.SendAsync(request);

            delivery.StatusCode = (int)response.StatusCode;
            delivery.Response = await response.Content.ReadAsStringAsync();
            if (delivery.Response?.Length > 2000)
                delivery.Response = delivery.Response[..2000];
            delivery.DeliveredAt = DateTime.UtcNow;

            if (!response.IsSuccessStatusCode)
            {
                delivery.NextRetryAt = delivery.Attempts < 5
                    ? DateTime.UtcNow.AddMinutes(Math.Pow(2, delivery.Attempts))
                    : null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Webhook delivery failed for endpoint {EndpointId}, event {Event}.",
                endpoint.Id, eventType);

            delivery.Response = ex.Message;
            delivery.NextRetryAt = delivery.Attempts < 5
                ? DateTime.UtcNow.AddMinutes(Math.Pow(2, delivery.Attempts))
                : null;
        }

        if (existingDelivery == null)
            _context.WebhookDeliveries.Add(delivery);

        await _context.SaveChangesAsync();
    }

    private static string ComputeSignature(string secret, string timestamp, string payload)
    {
        var signaturePayload = $"{timestamp}.{payload}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signaturePayload));
        return $"sha256={Convert.ToHexString(hash).ToLowerInvariant()}";
    }

    private static string MaskSensitiveData(string json)
    {
        // Mask account numbers: show only last 4 characters
        return Regex.Replace(json, @"(""accountNumber""\s*:\s*"")(\d+)("")",
            m =>
            {
                var number = m.Groups[2].Value;
                if (number.Length <= 4) return m.Value;
                var masked = new string('*', number.Length - 4) + number[^4..];
                return $"{m.Groups[1].Value}{masked}{m.Groups[3].Value}";
            },
            RegexOptions.IgnoreCase);
    }

    private static WebhookEndpointResponse MapToResponse(WebhookEndpoint endpoint)
    {
        return new WebhookEndpointResponse
        {
            Id = endpoint.Id,
            Url = endpoint.Url,
            Events = endpoint.Events.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(e => e.Trim()).ToList(),
            Secret = endpoint.Secret,
            IsActive = endpoint.IsActive,
            CreatedAt = endpoint.CreatedAt
        };
    }
}
