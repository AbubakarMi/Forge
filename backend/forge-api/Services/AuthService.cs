using ForgeApi.Data;
using ForgeApi.DTOs.Auth;
using ForgeApi.Models;
using ForgeApi.Utils;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtTokenGenerator _tokenGenerator;

    public AuthService(AppDbContext context, JwtTokenGenerator tokenGenerator)
    {
        _context = context;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var exists = await _context.Users
            .AnyAsync(u => u.Email == request.Email);

        if (exists)
            throw new InvalidOperationException("A user with this email already exists.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = HashHelper.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _tokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            Email = user.Email
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null || !HashHelper.VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var token = _tokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            Email = user.Email
        };
    }
}
