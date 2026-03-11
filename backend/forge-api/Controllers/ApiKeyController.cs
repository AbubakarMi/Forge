using ForgeApi.DTOs;
using ForgeApi.DTOs.ApiKeys;
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
    private readonly ICurrentOrganizationProvider _orgProvider;

    public ApiKeyController(IApiKeyService apiKeyService, ICurrentOrganizationProvider orgProvider)
    {
        _apiKeyService = apiKeyService;
        _orgProvider = orgProvider;
    }

    /// <summary>
    /// Creates a new API key. The full key is returned ONLY in this response.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ApiKeyCreatedResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateApiKeyRequest request)
    {
        var result = await _apiKeyService.CreateKeyAsync(
            _orgProvider.UserId,
            _orgProvider.OrganizationId,
            request.Permissions);
        return StatusCode(201, ApiResponse<ApiKeyCreatedResponse>.Ok(result, "API key created. Store it securely — it will not be shown again."));
    }

    /// <summary>
    /// Lists API keys — returns prefix only, never the full key.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ApiKeyListResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll()
    {
        var keys = await _apiKeyService.GetKeysAsync(_orgProvider.OrganizationId);
        return Ok(ApiResponse<IEnumerable<ApiKeyListResponse>>.Ok(keys));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Revoke(Guid id)
    {
        var success = await _apiKeyService.RevokeKeyAsync(_orgProvider.OrganizationId, id);
        if (!success) return NotFound(ApiResponse.Fail("API key not found."));

        return Ok(ApiResponse.Ok(message: "API key revoked."));
    }
}
