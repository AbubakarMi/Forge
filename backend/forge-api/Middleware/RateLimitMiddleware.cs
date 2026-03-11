using System.Collections.Concurrent;
using System.Text.Json;
using ForgeApi.DTOs;

namespace ForgeApi.Middleware;

public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;

    // Sliding window counters: key → list of request timestamps
    private static readonly ConcurrentDictionary<string, SlidingWindow> Windows = new();

    private const int ApiKeyLimitPerMinute = 100;
    private const int ApiKeyLimitPerHour = 1000;
    private const int IpLimitPerMinute = 20;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public RateLimitMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Only rate limit API paths
        if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Determine the rate limit key and limits
        string rateLimitKey;
        int minuteLimit;
        int hourLimit;

        var apiKeyHeader = context.Request.Headers["X-API-Key"].FirstOrDefault();
        if (!string.IsNullOrEmpty(apiKeyHeader))
        {
            // API key-based limiting
            rateLimitKey = $"apikey:{apiKeyHeader[..Math.Min(16, apiKeyHeader.Length)]}";
            minuteLimit = ApiKeyLimitPerMinute;
            hourLimit = ApiKeyLimitPerHour;
        }
        else
        {
            // IP-based limiting for unauthenticated requests
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            rateLimitKey = $"ip:{ip}";
            minuteLimit = IpLimitPerMinute;
            hourLimit = minuteLimit * 10; // 200/hour for IP
        }

        var window = Windows.GetOrAdd(rateLimitKey, _ => new SlidingWindow());
        var now = DateTime.UtcNow;

        window.CleanExpired(now);

        var requestsLastMinute = window.CountSince(now.AddMinutes(-1));
        var requestsLastHour = window.CountSince(now.AddHours(-1));

        if (requestsLastMinute >= minuteLimit || requestsLastHour >= hourLimit)
        {
            var retryAfter = requestsLastMinute >= minuteLimit ? 60 : 3600;
            var remaining = Math.Max(0, minuteLimit - requestsLastMinute);

            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.ContentType = "application/json";
            context.Response.Headers["Retry-After"] = retryAfter.ToString();
            context.Response.Headers["X-RateLimit-Limit"] = minuteLimit.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = "0";
            context.Response.Headers["X-RateLimit-Reset"] = DateTimeOffset.UtcNow.AddSeconds(retryAfter).ToUnixTimeSeconds().ToString();

            var response = ApiResponse.Fail("Rate limit exceeded. Please try again later.");
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
            return;
        }

        // Record this request
        window.Add(now);

        // Add rate limit headers to response
        var remainingRequests = Math.Max(0, minuteLimit - requestsLastMinute - 1);
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-RateLimit-Limit"] = minuteLimit.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = remainingRequests.ToString();
            context.Response.Headers["X-RateLimit-Reset"] = DateTimeOffset.UtcNow.AddMinutes(1).ToUnixTimeSeconds().ToString();
            return Task.CompletedTask;
        });

        await _next(context);
    }

    private class SlidingWindow
    {
        private readonly object _lock = new();
        private readonly List<DateTime> _timestamps = new();

        public void Add(DateTime timestamp)
        {
            lock (_lock)
            {
                _timestamps.Add(timestamp);
            }
        }

        public int CountSince(DateTime since)
        {
            lock (_lock)
            {
                return _timestamps.Count(t => t >= since);
            }
        }

        public void CleanExpired(DateTime now)
        {
            lock (_lock)
            {
                _timestamps.RemoveAll(t => t < now.AddHours(-1));
            }
        }
    }
}
