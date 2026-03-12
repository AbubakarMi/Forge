using System.Diagnostics;

namespace ForgeApi.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    private static readonly HashSet<string> SensitiveHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Authorization", "X-Api-Key", "Cookie", "Set-Cookie"
    };

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add correlation ID
        var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
                          ?? Guid.NewGuid().ToString("N")[..12];
        context.Response.Headers["X-Correlation-Id"] = correlationId;

        var sw = Stopwatch.StartNew();
        var method = context.Request.Method;
        var path = context.Request.Path;
        var userId = context.User?.FindFirst("sub")?.Value ?? "anonymous";

        try
        {
            await _next(context);
            sw.Stop();

            _logger.LogInformation(
                "HTTP {Method} {Path} → {StatusCode} in {ElapsedMs}ms | User={UserId} | CorrelationId={CorrelationId} | IP={IP}",
                method, path, context.Response.StatusCode, sw.ElapsedMilliseconds,
                userId, correlationId, context.Connection.RemoteIpAddress?.ToString() ?? "unknown");
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex,
                "HTTP {Method} {Path} → FAILED in {ElapsedMs}ms | User={UserId} | CorrelationId={CorrelationId}",
                method, path, sw.ElapsedMilliseconds, userId, correlationId);
            throw;
        }
    }
}
