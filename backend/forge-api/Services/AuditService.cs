using ForgeApi.Data;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IAuditService
{
    Task LogAsync(string action, string entityType, string? entityId = null,
        Guid? userId = null, Guid? organizationId = null,
        string? ipAddress = null, string? userAgent = null, string? details = null);

    Task<(IEnumerable<AuditLog> Logs, int TotalCount)> GetAuditLogsAsync(
        Guid organizationId, string? action = null, Guid? userId = null,
        DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 50);
}

public class AuditService : IAuditService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(AppDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(string action, string entityType, string? entityId = null,
        Guid? userId = null, Guid? organizationId = null,
        string? ipAddress = null, string? userAgent = null, string? details = null)
    {
        try
        {
            var entry = new AuditLog
            {
                UserId = userId,
                OrganizationId = organizationId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Details = details,
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(entry);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Audit logging must never break the main request
            _logger.LogError(ex, "Failed to write audit log: {Action} {EntityType} {EntityId}",
                action, entityType, entityId);
        }
    }

    public async Task<(IEnumerable<AuditLog> Logs, int TotalCount)> GetAuditLogsAsync(
        Guid organizationId, string? action = null, Guid? userId = null,
        DateTime? from = null, DateTime? to = null, int page = 1, int pageSize = 50)
    {
        var query = _context.AuditLogs
            .Where(a => a.OrganizationId == organizationId);

        if (!string.IsNullOrEmpty(action))
            query = query.Where(a => a.Action == action);

        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId.Value);

        if (from.HasValue)
            query = query.Where(a => a.CreatedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(a => a.CreatedAt <= to.Value);

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (logs, totalCount);
    }
}
