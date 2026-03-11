using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using ForgeApi.Data;
using ForgeApi.Services;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Middleware;

public class OrganizationContextMiddleware
{
    private readonly RequestDelegate _next;

    public OrganizationContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext,
        CurrentOrganizationProvider orgProvider)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                           ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (Guid.TryParse(userIdClaim, out var userId))
            {
                orgProvider.UserId = userId;

                // Check for org ID in header (org switching) or fall back to JWT claim
                var orgIdStr = context.Request.Headers["X-Organization-Id"].FirstOrDefault()
                            ?? context.User.FindFirstValue("org_id");

                if (Guid.TryParse(orgIdStr, out var orgId))
                {
                    // Validate the user is still an active member of this org
                    var membership = await dbContext.OrganizationMembers
                        .FirstOrDefaultAsync(om => om.UserId == userId && om.OrganizationId == orgId);

                    if (membership != null)
                    {
                        orgProvider.OrganizationId = orgId;
                        orgProvider.Role = membership.Role;
                        orgProvider.IsAuthenticated = true;
                    }
                }

                // If no org context yet, use the user's first org
                if (orgProvider.OrganizationId == Guid.Empty)
                {
                    var firstMembership = await dbContext.OrganizationMembers
                        .Where(om => om.UserId == userId)
                        .OrderBy(om => om.JoinedAt)
                        .FirstOrDefaultAsync();

                    if (firstMembership != null)
                    {
                        orgProvider.OrganizationId = firstMembership.OrganizationId;
                        orgProvider.Role = firstMembership.Role;
                        orgProvider.IsAuthenticated = true;
                    }
                }
            }
        }

        await _next(context);
    }
}
