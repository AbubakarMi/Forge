using System.Text;
using ForgeApi.Configurations;
using ForgeApi.Middleware;
using ForgeApi.Services;
using ForgeApi.Utils;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration ────────────────────────────────────────────────────────────
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

// ── Database ─────────────────────────────────────────────────────────────────
builder.Services.AddDatabaseConfig(builder.Configuration);

// ── Authentication / JWT ─────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!;
var keyBytes = Encoding.UTF8.GetBytes(jwtSettings.Secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSettings.Issuer,
        ValidAudience            = jwtSettings.Audience,
        IssuerSigningKey         = new SymmetricSecurityKey(keyBytes),
        ClockSkew                = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title   = "Forge API",
        Version = "v1",
        Description = "ForgeAPI — payment infrastructure MVP"
    });

    var jwtScheme = new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter your JWT token (without 'Bearer ' prefix).",
        Reference    = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id   = JwtBearerDefaults.AuthenticationScheme
        }
    };

    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, jwtScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtScheme, Array.Empty<string>() }
    });
});

// ── Application Services ──────────────────────────────────────────────────────
builder.Services.AddScoped<JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IApiKeyService, ApiKeyService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IPayoutService, PayoutService>();

builder.Services.AddControllers();

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Forge API v1"));
}

app.UseHttpsRedirection();
app.UseCors();

app.UseMiddleware<ApiKeyMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
