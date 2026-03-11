using ForgeApi.Data;
using ForgeApi.DTOs.Organizations;
using ForgeApi.Exceptions;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IOrganizationService
{
    Task<OrganizationDetailResponse> CreateOrganizationAsync(CreateOrganizationRequest request, Guid userId);
    Task<OrganizationDetailResponse> GetOrganizationAsync(Guid orgId, Guid userId);
    Task<IEnumerable<OrganizationResponse>> GetUserOrganizationsAsync(Guid userId);
    Task<OrganizationDetailResponse> UpdateOrganizationAsync(Guid orgId, UpdateOrganizationRequest request, Guid userId);
    Task<OrganizationMemberResponse> AddMemberAsync(Guid orgId, AddMemberRequest request, Guid userId);
    Task RemoveMemberAsync(Guid orgId, Guid targetUserId, Guid requestingUserId);
    Task<IEnumerable<OrganizationMemberResponse>> GetMembersAsync(Guid orgId, Guid userId);
}

public class OrganizationService : IOrganizationService
{
    private readonly AppDbContext _context;
    private readonly IAuditService _audit;

    public OrganizationService(AppDbContext context, IAuditService audit)
    {
        _context = context;
        _audit = audit;
    }

    public async Task<OrganizationDetailResponse> CreateOrganizationAsync(CreateOrganizationRequest request, Guid userId)
    {
        var emailExists = await _context.Organizations.AnyAsync(o => o.Email == request.Email);
        if (emailExists)
            throw new ConflictException("An organization with this email already exists.");

        await using var transaction = await _context.Database.BeginTransactionAsync();

        var org = new Organization
        {
            Name = request.Name,
            Email = request.Email,
            Country = request.Country
        };

        _context.Organizations.Add(org);
        await _context.SaveChangesAsync();

        var member = new OrganizationMember
        {
            UserId = userId,
            OrganizationId = org.Id,
            Role = "owner"
        };

        _context.OrganizationMembers.Add(member);
        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        await _audit.LogAsync("organization.created", "Organization", org.Id.ToString(),
            userId, org.Id);

        return new OrganizationDetailResponse
        {
            Id = org.Id,
            Name = org.Name,
            Email = org.Email,
            Country = org.Country,
            MemberCount = 1,
            CreatedAt = org.CreatedAt,
            UpdatedAt = org.UpdatedAt
        };
    }

    public async Task<OrganizationDetailResponse> GetOrganizationAsync(Guid orgId, Guid userId)
    {
        await EnsureMembershipAsync(orgId, userId);

        var org = await _context.Organizations
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Id == orgId)
            ?? throw new NotFoundException("Organization not found.");

        return new OrganizationDetailResponse
        {
            Id = org.Id,
            Name = org.Name,
            Email = org.Email,
            Country = org.Country,
            MemberCount = org.Members.Count,
            CreatedAt = org.CreatedAt,
            UpdatedAt = org.UpdatedAt
        };
    }

    public async Task<IEnumerable<OrganizationResponse>> GetUserOrganizationsAsync(Guid userId)
    {
        return await _context.OrganizationMembers
            .Where(om => om.UserId == userId)
            .Include(om => om.Organization)
            .Select(om => new OrganizationResponse
            {
                Id = om.Organization.Id,
                Name = om.Organization.Name,
                Email = om.Organization.Email,
                Country = om.Organization.Country,
                Role = om.Role,
                CreatedAt = om.Organization.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<OrganizationDetailResponse> UpdateOrganizationAsync(
        Guid orgId, UpdateOrganizationRequest request, Guid userId)
    {
        await EnsureRoleAsync(orgId, userId, "owner", "admin");

        var org = await _context.Organizations
            .Include(o => o.Members)
            .FirstOrDefaultAsync(o => o.Id == orgId)
            ?? throw new NotFoundException("Organization not found.");

        // Check email uniqueness if changed
        if (org.Email != request.Email)
        {
            var emailExists = await _context.Organizations
                .AnyAsync(o => o.Email == request.Email && o.Id != orgId);
            if (emailExists)
                throw new ConflictException("An organization with this email already exists.");
        }

        org.Name = request.Name;
        org.Email = request.Email;
        org.Country = request.Country;
        org.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _audit.LogAsync("organization.updated", "Organization", org.Id.ToString(),
            userId, org.Id);

        return new OrganizationDetailResponse
        {
            Id = org.Id,
            Name = org.Name,
            Email = org.Email,
            Country = org.Country,
            MemberCount = org.Members.Count,
            CreatedAt = org.CreatedAt,
            UpdatedAt = org.UpdatedAt
        };
    }

    public async Task<OrganizationMemberResponse> AddMemberAsync(
        Guid orgId, AddMemberRequest request, Guid userId)
    {
        await EnsureRoleAsync(orgId, userId, "owner", "admin");

        var targetUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email)
            ?? throw new NotFoundException($"No user found with email '{request.Email}'.");

        var alreadyMember = await _context.OrganizationMembers
            .AnyAsync(om => om.OrganizationId == orgId && om.UserId == targetUser.Id);
        if (alreadyMember)
            throw new ConflictException("User is already a member of this organization.");

        var member = new OrganizationMember
        {
            UserId = targetUser.Id,
            OrganizationId = orgId,
            Role = request.Role
        };

        _context.OrganizationMembers.Add(member);
        await _context.SaveChangesAsync();

        await _audit.LogAsync("member.added", "OrganizationMember", member.Id.ToString(),
            userId, orgId, details: $"Added {request.Email} as {request.Role}");

        return new OrganizationMemberResponse
        {
            Id = member.Id,
            UserId = targetUser.Id,
            Email = targetUser.Email,
            Role = member.Role,
            JoinedAt = member.JoinedAt
        };
    }

    public async Task RemoveMemberAsync(Guid orgId, Guid targetUserId, Guid requestingUserId)
    {
        await EnsureRoleAsync(orgId, requestingUserId, "owner", "admin");

        var member = await _context.OrganizationMembers
            .Include(om => om.User)
            .FirstOrDefaultAsync(om => om.OrganizationId == orgId && om.UserId == targetUserId)
            ?? throw new NotFoundException("Member not found in this organization.");

        if (member.Role == "owner")
            throw new ForbiddenException("Cannot remove the organization owner.");

        // Admins cannot remove other admins
        if (member.Role == "admin")
        {
            var requestingMember = await _context.OrganizationMembers
                .FirstOrDefaultAsync(om => om.OrganizationId == orgId && om.UserId == requestingUserId);
            if (requestingMember?.Role != "owner")
                throw new ForbiddenException("Only the owner can remove admins.");
        }

        _context.OrganizationMembers.Remove(member);
        await _context.SaveChangesAsync();

        await _audit.LogAsync("member.removed", "OrganizationMember", member.Id.ToString(),
            requestingUserId, orgId, details: $"Removed {member.User.Email}");
    }

    public async Task<IEnumerable<OrganizationMemberResponse>> GetMembersAsync(Guid orgId, Guid userId)
    {
        await EnsureMembershipAsync(orgId, userId);

        return await _context.OrganizationMembers
            .Where(om => om.OrganizationId == orgId)
            .Include(om => om.User)
            .OrderBy(om => om.Role == "owner" ? 0 : om.Role == "admin" ? 1 : 2)
            .ThenBy(om => om.JoinedAt)
            .Select(om => new OrganizationMemberResponse
            {
                Id = om.Id,
                UserId = om.UserId,
                Email = om.User.Email,
                Role = om.Role,
                JoinedAt = om.JoinedAt
            })
            .ToListAsync();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private async Task EnsureMembershipAsync(Guid orgId, Guid userId)
    {
        var isMember = await _context.OrganizationMembers
            .AnyAsync(om => om.OrganizationId == orgId && om.UserId == userId);

        if (!isMember)
            throw new ForbiddenException("You are not a member of this organization.");
    }

    private async Task EnsureRoleAsync(Guid orgId, Guid userId, params string[] allowedRoles)
    {
        var member = await _context.OrganizationMembers
            .FirstOrDefaultAsync(om => om.OrganizationId == orgId && om.UserId == userId);

        if (member is null)
            throw new ForbiddenException("You are not a member of this organization.");

        if (!allowedRoles.Contains(member.Role))
            throw new ForbiddenException($"This action requires one of the following roles: {string.Join(", ", allowedRoles)}.");
    }
}
