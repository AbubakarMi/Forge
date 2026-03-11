using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using ForgeApi.DTOs;
using ForgeApi.Services;
using System.Text.Json;

namespace ForgeApi.Middleware;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string ApiKeyHeader = "X-API-Key";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IApiKeyService apiKeyService)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Only apply to /api/ paths, skip /api/auth
        if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/auth", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // If no X-API-Key header, pass through to let JWT handle auth
        if (!context.Request.Headers.TryGetValue(ApiKeyHeader, out var apiKeyValue))
        {
            await _next(context);
            return;
        }

        var rawKey = apiKeyValue.ToString();

        var apiKey = await apiKeyService.ValidateKeyAsync(rawKey);

        if (apiKey is null)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            var response = ApiResponse.Fail("Invalid or revoked API key.");
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
            return;
        }

        // Track IP
        apiKey.LastUsedFromIp = context.Connection.RemoteIpAddress?.ToString();

        // Set claims so controllers can identify the user
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, apiKey.UserId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, apiKey.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, apiKey.User.Email)
        };

        var identity = new ClaimsIdentity(claims, "ApiKey");
        context.User = new ClaimsPrincipal(identity);

        await _next(context);
    }
}
