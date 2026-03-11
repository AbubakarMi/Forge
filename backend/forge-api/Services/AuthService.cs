using ForgeApi.Data;
using ForgeApi.DTOs.Auth;
using ForgeApi.Exceptions;
using ForgeApi.Models;
using ForgeApi.Utils;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IAuthService
{
    Task<(AuthResponse Auth, string RefreshToken)> RegisterAsync(RegisterRequest request, string ipAddress);
    Task<(AuthResponse Auth, string RefreshToken)> LoginAsync(LoginRequest request, string ipAddress);
    Task<(AuthResponse Auth, string RefreshToken)> RefreshTokenAsync(string refreshToken, string ipAddress);
    Task RevokeTokenAsync(string refreshToken, string ipAddress);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtTokenGenerator _tokenGenerator;
    private const int RefreshTokenExpiryDays = 7;

    public AuthService(AppDbContext context, JwtTokenGenerator tokenGenerator)
    {
        _context = context;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<(AuthResponse Auth, string RefreshToken)> RegisterAsync(RegisterRequest request, string ipAddress)
    {
        var exists = await _context.Users
            .AnyAsync(u => u.Email == request.Email);

        if (exists)
            throw new ConflictException("A user with this email already exists.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = HashHelper.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return await GenerateTokenPair(user, ipAddress);
    }

    public async Task<(AuthResponse Auth, string RefreshToken)> LoginAsync(LoginRequest request, string ipAddress)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null || !HashHelper.VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        return await GenerateTokenPair(user, ipAddress);
    }

    public async Task<(AuthResponse Auth, string RefreshToken)> RefreshTokenAsync(string refreshToken, string ipAddress)
    {
        var tokenHash = JwtTokenGenerator.HashRefreshToken(refreshToken);

        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (storedToken is null)
            throw new UnauthorizedAccessException("Invalid refresh token.");

        if (storedToken.IsRevoked)
        {
            // Token reuse detected — revoke entire family (potential compromise)
            await RevokeTokenFamilyAsync(storedToken.UserId, ipAddress);
            throw new UnauthorizedAccessException("Token reuse detected. All sessions revoked for security.");
        }

        if (storedToken.IsExpired)
            throw new UnauthorizedAccessException("Refresh token expired. Please log in again.");

        // Rotate: revoke old, issue new
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.RevokedByIp = ipAddress;

        var result = await GenerateTokenPair(storedToken.User, ipAddress);

        // Link old to new
        var newTokenHash = JwtTokenGenerator.HashRefreshToken(result.RefreshToken);
        var newStoredToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == newTokenHash);
        if (newStoredToken != null)
            storedToken.ReplacedByTokenId = newStoredToken.Id;

        await _context.SaveChangesAsync();

        return result;
    }

    public async Task RevokeTokenAsync(string refreshToken, string ipAddress)
    {
        var tokenHash = JwtTokenGenerator.HashRefreshToken(refreshToken);

        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (storedToken is null || !storedToken.IsActive)
            return; // Silently ignore — don't reveal token existence

        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.RevokedByIp = ipAddress;
        await _context.SaveChangesAsync();
    }

    private async Task<(AuthResponse Auth, string RefreshToken)> GenerateTokenPair(User user, string ipAddress)
    {
        var (accessToken, expiresAt) = _tokenGenerator.GenerateAccessToken(user);
        var rawRefreshToken = JwtTokenGenerator.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = JwtTokenGenerator.HashRefreshToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpiryDays),
            CreatedByIp = ipAddress
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        var authResponse = new AuthResponse
        {
            Token = accessToken,
            Email = user.Email,
            TokenExpiresAt = expiresAt
        };

        return (authResponse, rawRefreshToken);
    }

    private async Task RevokeTokenFamilyAsync(Guid userId, string ipAddress)
    {
        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedByIp = ipAddress;
        }

        await _context.SaveChangesAsync();
    }
}
