using ForgeApi.DTOs;
using ForgeApi.DTOs.Auth;
using ForgeApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private const string RefreshTokenCookie = "forge_refresh_token";

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var ip = GetIpAddress();
        var (auth, refreshToken) = await _authService.RegisterAsync(request, ip);
        SetRefreshTokenCookie(refreshToken);
        return StatusCode(201, ApiResponse<AuthResponse>.Ok(auth, "Registration successful."));
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ip = GetIpAddress();
        var (auth, refreshToken) = await _authService.LoginAsync(request, ip);
        SetRefreshTokenCookie(refreshToken);
        return Ok(ApiResponse<AuthResponse>.Ok(auth, "Login successful."));
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies[RefreshTokenCookie];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(ApiResponse.Fail("No refresh token provided."));

        var ip = GetIpAddress();
        var (auth, newRefreshToken) = await _authService.RefreshTokenAsync(refreshToken, ip);
        SetRefreshTokenCookie(newRefreshToken);
        return Ok(ApiResponse<AuthResponse>.Ok(auth, "Token refreshed."));
    }

    [HttpPost("revoke")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Revoke()
    {
        var refreshToken = Request.Cookies[RefreshTokenCookie];
        if (!string.IsNullOrEmpty(refreshToken))
        {
            var ip = GetIpAddress();
            await _authService.RevokeTokenAsync(refreshToken, ip);
        }

        Response.Cookies.Delete(RefreshTokenCookie);
        return Ok(ApiResponse.Ok(message: "Token revoked."));
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7),
            Path = "/api/auth"
        };

        Response.Cookies.Append(RefreshTokenCookie, refreshToken, cookieOptions);
    }

    private string GetIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
