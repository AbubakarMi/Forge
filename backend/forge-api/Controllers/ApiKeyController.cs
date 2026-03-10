using System.Security.Claims;
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
    [ProducesResponseType(typeof(ApiKey), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiKey>> Create()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var apiKey = await _apiKeyService.CreateKeyAsync(userId);
        return CreatedAtAction(nameof(Create), new { id = apiKey.Id }, apiKey);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ApiKey>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<ApiKey>>> GetAll()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var keys = await _apiKeyService.GetKeysAsync(userId);
        return Ok(keys);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var success = await _apiKeyService.RevokeKeyAsync(userId, id);
        if (!success) return NotFound(new { error = "API key not found." });

        return NoContent();
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
