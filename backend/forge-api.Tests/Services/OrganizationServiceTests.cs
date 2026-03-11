using FluentAssertions;
using ForgeApi.DTOs.Organizations;
using ForgeApi.Exceptions;
using ForgeApi.Models;
using ForgeApi.Services;
using ForgeApi.Tests.Helpers;
using Moq;

namespace ForgeApi.Tests.Services;

public class OrganizationServiceTests
{
    private readonly Mock<IAuditService> _auditMock = new();
    private OrganizationService CreateService(ForgeApi.Data.AppDbContext ctx) =>
        new(ctx, _auditMock.Object);

    [Fact]
    public async Task CreateOrg_ValidData_ReturnsOrganization()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var svc = CreateService(ctx);
        var userId = Guid.NewGuid();
        var request = new CreateOrganizationRequest
        {
            Name = "Acme Corp",
            Email = "acme@example.com",
            Country = "Nigeria"
        };

        // Act
        var result = await svc.CreateOrganizationAsync(request, userId);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Acme Corp");
        result.Email.Should().Be("acme@example.com");
        result.Country.Should().Be("Nigeria");
        result.MemberCount.Should().Be(1);

        // Verify owner membership was created
        var members = ctx.OrganizationMembers.Where(m => m.OrganizationId == result.Id).ToList();
        members.Should().HaveCount(1);
        members[0].Role.Should().Be("owner");
        members[0].UserId.Should().Be(userId);
    }

    [Fact]
    public async Task CreateOrg_DuplicateEmail_ThrowsConflict()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var svc = CreateService(ctx);
        var userId = Guid.NewGuid();

        ctx.Organizations.Add(new Organization
        {
            Name = "Existing Org",
            Email = "duplicate@example.com",
            Country = "Nigeria"
        });
        await ctx.SaveChangesAsync();

        var request = new CreateOrganizationRequest
        {
            Name = "New Org",
            Email = "duplicate@example.com",
            Country = "Nigeria"
        };

        // Act & Assert
        await svc.Invoking(s => s.CreateOrganizationAsync(request, userId))
            .Should().ThrowAsync<ConflictException>()
            .WithMessage("*email*");
    }

    [Fact]
    public async Task AddMember_ValidUser_AddsSuccessfully()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var svc = CreateService(ctx);

        var ownerId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        ctx.Users.Add(new User { Id = ownerId, Email = "owner@test.com", PasswordHash = "hash" });
        ctx.Users.Add(new User { Id = targetUserId, Email = "member@test.com", PasswordHash = "hash" });
        ctx.Organizations.Add(new Organization { Id = orgId, Name = "Test Org", Email = "org@test.com", Country = "NG" });
        ctx.OrganizationMembers.Add(new OrganizationMember
        {
            UserId = ownerId,
            OrganizationId = orgId,
            Role = "owner"
        });
        await ctx.SaveChangesAsync();

        var request = new AddMemberRequest { Email = "member@test.com", Role = "member" };

        // Act
        var result = await svc.AddMemberAsync(orgId, request, ownerId);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(targetUserId);
        result.Role.Should().Be("member");
        result.Email.Should().Be("member@test.com");
    }

    [Fact]
    public async Task AddMember_AlreadyMember_ThrowsConflict()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var svc = CreateService(ctx);

        var ownerId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        ctx.Users.Add(new User { Id = ownerId, Email = "owner@test.com", PasswordHash = "hash" });
        ctx.Users.Add(new User { Id = targetUserId, Email = "member@test.com", PasswordHash = "hash" });
        ctx.Organizations.Add(new Organization { Id = orgId, Name = "Test Org", Email = "org@test.com", Country = "NG" });
        ctx.OrganizationMembers.Add(new OrganizationMember { UserId = ownerId, OrganizationId = orgId, Role = "owner" });
        ctx.OrganizationMembers.Add(new OrganizationMember { UserId = targetUserId, OrganizationId = orgId, Role = "member" });
        await ctx.SaveChangesAsync();

        var request = new AddMemberRequest { Email = "member@test.com", Role = "admin" };

        // Act & Assert
        await svc.Invoking(s => s.AddMemberAsync(orgId, request, ownerId))
            .Should().ThrowAsync<ConflictException>()
            .WithMessage("*already a member*");
    }

    [Fact]
    public async Task RemoveMember_Owner_ThrowsForbidden()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var svc = CreateService(ctx);

        var ownerId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        ctx.Users.Add(new User { Id = ownerId, Email = "owner@test.com", PasswordHash = "hash" });
        ctx.Organizations.Add(new Organization { Id = orgId, Name = "Test Org", Email = "org@test.com", Country = "NG" });
        ctx.OrganizationMembers.Add(new OrganizationMember { UserId = ownerId, OrganizationId = orgId, Role = "owner" });
        await ctx.SaveChangesAsync();

        // Act & Assert
        await svc.Invoking(s => s.RemoveMemberAsync(orgId, ownerId, ownerId))
            .Should().ThrowAsync<ForbiddenException>()
            .WithMessage("*owner*");
    }

    [Fact]
    public async Task GetUserOrganizations_ReturnsOnlyUserOrgs()
    {
        // Arrange
        await using var ctx = TestDbContextFactory.Create();
        var svc = CreateService(ctx);

        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var org1Id = Guid.NewGuid();
        var org2Id = Guid.NewGuid();
        var org3Id = Guid.NewGuid();

        ctx.Organizations.AddRange(
            new Organization { Id = org1Id, Name = "Org 1", Email = "o1@test.com", Country = "NG" },
            new Organization { Id = org2Id, Name = "Org 2", Email = "o2@test.com", Country = "NG" },
            new Organization { Id = org3Id, Name = "Org 3", Email = "o3@test.com", Country = "NG" }
        );
        ctx.OrganizationMembers.AddRange(
            new OrganizationMember { UserId = userId, OrganizationId = org1Id, Role = "owner" },
            new OrganizationMember { UserId = userId, OrganizationId = org2Id, Role = "member" },
            new OrganizationMember { UserId = otherUserId, OrganizationId = org3Id, Role = "owner" }
        );
        await ctx.SaveChangesAsync();

        // Act
        var result = (await svc.GetUserOrganizationsAsync(userId)).ToList();

        // Assert
        result.Should().HaveCount(2);
        result.Select(o => o.Name).Should().Contain("Org 1").And.Contain("Org 2");
        result.Select(o => o.Name).Should().NotContain("Org 3");
    }
}
