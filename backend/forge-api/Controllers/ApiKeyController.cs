using System.Security.Claims;
using ForgeApi.DTOs;
using ForgeApi.Models;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/apikeys")]
[Authorize]
public class ApiKeyController : ControllerBase
{
    private readonly IApiKeyService _apiKeyService;

    public ApiKeyController(IApiKeyService apiKeyService)
    {
        _apiKeyService = apiKeyService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ApiKey>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        var apiKey = await _apiKeyService.CreateKeyAsync(userId);
        return StatusCode(201, ApiResponse<ApiKey>.Ok(apiKey, "API key created."));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ApiKey>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        var keys = await _apiKeyService.GetKeysAsync(userId);
        return Ok(ApiResponse<IEnumerable<ApiKey>>.Ok(keys));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized(ApiResponse.Fail("Invalid token."));

        var success = await _apiKeyService.RevokeKeyAsync(userId, id);
        if (!success) return NotFound(ApiResponse.Fail("API key not found."));

        return Ok(ApiResponse.Ok(message: "API key revoked."));
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
