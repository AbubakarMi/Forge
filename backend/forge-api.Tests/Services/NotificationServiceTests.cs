using FluentAssertions;
using ForgeApi.Models;
using ForgeApi.Services;
using ForgeApi.Tests.Helpers;
using Microsoft.Extensions.Logging;
using Moq;

namespace ForgeApi.Tests.Services;

public class NotificationServiceTests
{
    private static NotificationService CreateService(ForgeApi.Data.AppDbContext ctx) =>
        new(ctx, Mock.Of<ILogger<NotificationService>>());

    [Fact]
    public async Task CreateNotification_Valid_Saves()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var orgId = Guid.NewGuid();

        // Seed org to satisfy FK (InMemory doesn't enforce FKs, but good practice)
        ctx.Organizations.Add(new Organization { Id = orgId, Name = "Org", Email = "o@t.com", Country = "NG" });
        await ctx.SaveChangesAsync();

        var svc = CreateService(ctx);

        // Act
        await svc.CreateNotificationAsync(orgId, "batch.completed", "Batch Done", "Your batch has been processed.");

        // Assert
        var notifications = ctx.Notifications.Where(n => n.OrganizationId == orgId).ToList();
        notifications.Should().HaveCount(1);
        notifications[0].Type.Should().Be("batch.completed");
        notifications[0].Title.Should().Be("Batch Done");
        notifications[0].Message.Should().Be("Your batch has been processed.");
        notifications[0].IsRead.Should().BeFalse();
    }

    [Fact]
    public async Task GetUnreadCount_ReturnsCorrect()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var orgId = Guid.NewGuid();

        ctx.Notifications.AddRange(
            new Notification { OrganizationId = orgId, Type = "info", Title = "A", Message = "m1", IsRead = false },
            new Notification { OrganizationId = orgId, Type = "info", Title = "B", Message = "m2", IsRead = false },
            new Notification { OrganizationId = orgId, Type = "info", Title = "C", Message = "m3", IsRead = true },
            new Notification { OrganizationId = Guid.NewGuid(), Type = "info", Title = "D", Message = "m4", IsRead = false }
        );
        await ctx.SaveChangesAsync();

        var svc = CreateService(ctx);

        // Act
        var count = await svc.GetUnreadCountAsync(orgId);

        // Assert
        count.Should().Be(2);
    }

    [Fact]
    public async Task MarkAsRead_UpdatesFlag()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var orgId = Guid.NewGuid();
        var notification = new Notification
        {
            OrganizationId = orgId,
            Type = "info",
            Title = "Test",
            Message = "Message",
            IsRead = false
        };
        ctx.Notifications.Add(notification);
        await ctx.SaveChangesAsync();

        var svc = CreateService(ctx);

        // Act
        await svc.MarkAsReadAsync(notification.Id, orgId);

        // Assert
        var updated = ctx.Notifications.First(n => n.Id == notification.Id);
        updated.IsRead.Should().BeTrue();
    }

    [Fact(Skip = "Requires PostgreSQL — ExecuteUpdateAsync not fully supported by InMemory provider")]
    public async Task MarkAllAsRead_UpdatesAll()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var orgId = Guid.NewGuid();

        ctx.Notifications.AddRange(
            new Notification { OrganizationId = orgId, Type = "info", Title = "A", Message = "m1", IsRead = false },
            new Notification { OrganizationId = orgId, Type = "info", Title = "B", Message = "m2", IsRead = false },
            new Notification { OrganizationId = orgId, Type = "info", Title = "C", Message = "m3", IsRead = false }
        );
        await ctx.SaveChangesAsync();

        var svc = CreateService(ctx);

        // Act
        await svc.MarkAllAsReadAsync(orgId);

        // Assert
        var unreadCount = ctx.Notifications.Count(n => n.OrganizationId == orgId && !n.IsRead);
        unreadCount.Should().Be(0);
    }
}
