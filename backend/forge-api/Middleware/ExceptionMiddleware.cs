using System.Net;
using System.Text.Json;
using ForgeApi.DTOs;
using ForgeApi.Exceptions;

namespace ForgeApi.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, response) = exception switch
        {
            NotFoundException ex =>
                (HttpStatusCode.NotFound, ApiResponse.Fail(ex.Message)),

            AppValidationException ex =>
                (HttpStatusCode.BadRequest, ApiResponse.Fail(ex.Message, ex.Errors)),

            UnauthorizedAccessException ex =>
                (HttpStatusCode.Unauthorized, ApiResponse.Fail(ex.Message)),

            ForbiddenException ex =>
                (HttpStatusCode.Forbidden, ApiResponse.Fail(ex.Message)),

            ConflictException ex =>
                (HttpStatusCode.Conflict, ApiResponse.Fail(ex.Message)),

            _ =>
                (HttpStatusCode.InternalServerError, ApiResponse.Fail("An unexpected error occurred."))
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
