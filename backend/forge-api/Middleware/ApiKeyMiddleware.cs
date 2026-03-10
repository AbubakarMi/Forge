using System.Security.Claims;
using ForgeApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace ForgeApi.Middleware;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string ApiKeyHeader = "X-API-Key";

    public ApiKeyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
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

        var keyString = apiKeyValue.ToString();

        var apiKey = await dbContext.ApiKeys
            .Include(k => k.User)
            .FirstOrDefaultAsync(k => k.Key == keyString);

        if (apiKey is null || apiKey.IsRevoked)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"error\":\"Invalid or revoked API key.\"}");
            return;
        }

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
