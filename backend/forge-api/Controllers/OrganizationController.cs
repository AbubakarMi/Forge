using System.Security.Claims;
using ForgeApi.DTOs;
using ForgeApi.DTOs.Organizations;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/organizations")]
[Authorize]
public class OrganizationController : ControllerBase
{
    private readonly IOrganizationService _orgService;

    public OrganizationController(IOrganizationService orgService)
    {
        _orgService = orgService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<OrganizationDetailResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateOrganizationRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        var org = await _orgService.CreateOrganizationAsync(request, userId);
        return StatusCode(201, ApiResponse<OrganizationDetailResponse>.Ok(org, "Organization created."));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<OrganizationResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        var orgs = await _orgService.GetUserOrganizationsAsync(userId);
        return Ok(ApiResponse<IEnumerable<OrganizationResponse>>.Ok(orgs));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<OrganizationDetailResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        var org = await _orgService.GetOrganizationAsync(id, userId);
        return Ok(ApiResponse<OrganizationDetailResponse>.Ok(org));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<OrganizationDetailResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOrganizationRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        var org = await _orgService.UpdateOrganizationAsync(id, request, userId);
        return Ok(ApiResponse<OrganizationDetailResponse>.Ok(org, "Organization updated."));
    }

    [HttpGet("{id:guid}/members")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<OrganizationMemberResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMembers(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        var members = await _orgService.GetMembersAsync(id, userId);
        return Ok(ApiResponse<IEnumerable<OrganizationMemberResponse>>.Ok(members));
    }

    [HttpPost("{id:guid}/members")]
    [ProducesResponseType(typeof(ApiResponse<OrganizationMemberResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        var member = await _orgService.AddMemberAsync(id, request, userId);
        return StatusCode(201, ApiResponse<OrganizationMemberResponse>.Ok(member, "Member added."));
    }

    [HttpDelete("{id:guid}/members/{targetUserId:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveMember(Guid id, Guid targetUserId)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        await _orgService.RemoveMemberAsync(id, targetUserId, userId);
        return Ok(ApiResponse.Ok(message: "Member removed."));
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
