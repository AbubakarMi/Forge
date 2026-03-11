using ForgeApi.Data;
using ForgeApi.Exceptions;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface INotificationService
{
    Task CreateNotificationAsync(Guid organizationId, string type, string title, string message, Guid? userId = null);
    Task<(IEnumerable<Notification> Items, int TotalCount)> GetNotificationsAsync(Guid orgId, bool unreadOnly = false, int page = 1, int pageSize = 20);
    Task MarkAsReadAsync(Guid notificationId, Guid orgId);
    Task MarkAllAsReadAsync(Guid orgId);
    Task<int> GetUnreadCountAsync(Guid orgId);
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task CreateNotificationAsync(Guid organizationId, string type, string title, string message, Guid? userId = null)
    {
        try
        {
            var notification = new Notification
            {
                OrganizationId = organizationId,
                UserId = userId,
                Type = type,
                Title = title,
                Message = message
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create notification of type {Type} for organization {OrgId}.", type, organizationId);
        }
    }

    public async Task<(IEnumerable<Notification> Items, int TotalCount)> GetNotificationsAsync(Guid orgId, bool unreadOnly = false, int page = 1, int pageSize = 20)
    {
        var query = _context.Notifications
            .Where(n => n.OrganizationId == orgId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task MarkAsReadAsync(Guid notificationId, Guid orgId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.OrganizationId == orgId)
            ?? throw new NotFoundException("Notification not found.");

        notification.IsRead = true;
        await _context.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(Guid orgId)
    {
        await _context.Notifications
            .Where(n => n.OrganizationId == orgId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task<int> GetUnreadCountAsync(Guid orgId)
    {
        return await _context.Notifications
            .CountAsync(n => n.OrganizationId == orgId && !n.IsRead);
    }
}
