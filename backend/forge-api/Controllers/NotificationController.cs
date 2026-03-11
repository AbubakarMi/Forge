using ForgeApi.DTOs;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentOrganizationProvider _orgProvider;

    public NotificationController(INotificationService notificationService, ICurrentOrganizationProvider orgProvider)
    {
        _notificationService = notificationService;
        _orgProvider = orgProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] bool unreadOnly = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, totalCount) = await _notificationService.GetNotificationsAsync(
            _orgProvider.OrganizationId, unreadOnly, page, pageSize);

        return Ok(ApiResponse<object>.Ok(new
        {
            items,
            totalCount,
            page,
            pageSize
        }));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _notificationService.GetUnreadCountAsync(_orgProvider.OrganizationId);
        return Ok(ApiResponse<object>.Ok(new { count }));
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        await _notificationService.MarkAsReadAsync(id, _orgProvider.OrganizationId);
        return Ok(ApiResponse.Ok(message: "Notification marked as read."));
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync(_orgProvider.OrganizationId);
        return Ok(ApiResponse.Ok(message: "All notifications marked as read."));
    }
}
