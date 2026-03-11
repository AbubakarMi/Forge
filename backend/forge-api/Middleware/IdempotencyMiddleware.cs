using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ForgeApi.Data;
using ForgeApi.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Middleware;

public class IdempotencyMiddleware
{
    private readonly RequestDelegate _next;
    private const string IdempotencyHeader = "Idempotency-Key";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public IdempotencyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        // Only apply to state-changing methods
        if (context.Request.Method is not ("POST" or "PUT" or "PATCH"))
        {
            await _next(context);
            return;
        }

        // If no idempotency key, pass through
        if (!context.Request.Headers.TryGetValue(IdempotencyHeader, out var keyValue))
        {
            await _next(context);
            return;
        }

        var idempotencyKey = keyValue.ToString();
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            await _next(context);
            return;
        }

        // Read request body for hashing
        context.Request.EnableBuffering();
        var bodyBytes = await ReadBodyAsync(context.Request);
        var requestHash = HashRequestBody(bodyBytes, context.Request.Path.Value ?? "");
        context.Request.Body.Position = 0;

        // Check if key already exists
        var existing = await dbContext.Set<ForgeApi.Models.IdempotencyRecord>()
            .FirstOrDefaultAsync(r => r.Key == idempotencyKey);

        if (existing != null)
        {
            if (existing.ExpiresAt < DateTime.UtcNow)
            {
                // Expired — remove and process fresh
                dbContext.Remove(existing);
                await dbContext.SaveChangesAsync();
            }
            else if (existing.RequestHash != requestHash)
            {
                // Same key, different request — reject
                context.Response.StatusCode = 422;
                context.Response.ContentType = "application/json";
                var error = ApiResponse.Fail("Idempotency key already used with a different request.");
                await context.Response.WriteAsync(JsonSerializer.Serialize(error, JsonOptions));
                return;
            }
            else
            {
                // Return cached response
                context.Response.StatusCode = existing.ResponseStatusCode;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(existing.ResponseBody);
                return;
            }
        }

        // Capture the response
        var originalBody = context.Response.Body;
        using var memoryStream = new MemoryStream();
        context.Response.Body = memoryStream;

        await _next(context);

        memoryStream.Position = 0;
        var responseBody = await new StreamReader(memoryStream).ReadToEndAsync();

        // Store the response for future idempotent lookups
        var record = new ForgeApi.Models.IdempotencyRecord
        {
            Key = idempotencyKey,
            RequestPath = context.Request.Path.Value ?? "",
            RequestHash = requestHash,
            ResponseStatusCode = context.Response.StatusCode,
            ResponseBody = responseBody,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        dbContext.Set<ForgeApi.Models.IdempotencyRecord>().Add(record);

        try
        {
            await dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Race condition — another request with same key arrived simultaneously
            // Response already written, just continue
        }

        // Write the response to the original stream
        memoryStream.Position = 0;
        await memoryStream.CopyToAsync(originalBody);
        context.Response.Body = originalBody;
    }

    private static async Task<byte[]> ReadBodyAsync(HttpRequest request)
    {
        using var ms = new MemoryStream();
        await request.Body.CopyToAsync(ms);
        return ms.ToArray();
    }

    private static string HashRequestBody(byte[] body, string path)
    {
        var combined = Encoding.UTF8.GetBytes(path).Concat(body).ToArray();
        var hash = SHA256.HashData(combined);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
