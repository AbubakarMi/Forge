using System.Text;
using ForgeApi.Configurations;
using ForgeApi.Jobs;
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
builder.Services.Configure<TransactionLimits>(
    builder.Configuration.GetSection("TransactionLimits"));

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
              .AllowAnyMethod()
              .AllowCredentials();
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
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<ITransactionValidationService, TransactionValidationService>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IBankService, BankService>();
builder.Services.AddScoped<ICsvParserService, CsvParserService>();
builder.Services.AddScoped<IPayoutBatchService, PayoutBatchService>();
builder.Services.AddHttpClient<IBankNormalizationClient, BankNormalizationClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration.GetValue<string>("AiService:BaseUrl") ?? "http://localhost:8000");
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddScoped<CurrentOrganizationProvider>();
builder.Services.AddScoped<ICurrentOrganizationProvider>(sp => sp.GetRequiredService<CurrentOrganizationProvider>());
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITransactionProcessingService, TransactionProcessingService>();
builder.Services.AddHttpClient<IWebhookService, WebhookService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddSingleton<BatchProcessingQueue>();
builder.Services.AddHostedService<BatchProcessingJob>();

builder.Services.AddControllers();

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Seed Database ────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ForgeApi.Data.AppDbContext>();
    await ForgeApi.Data.Seeds.BankSeeder.SeedAsync(db);
}

// ── Middleware Pipeline ───────────────────────────────────────────────────────
// Order matters: exception handler first, then rate limiting, then auth
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Forge API v1"));
}

app.UseCors();

// Rate limiting before auth — protect against brute force
app.UseMiddleware<RateLimitMiddleware>();

// Idempotency check before processing
app.UseMiddleware<IdempotencyMiddleware>();

app.UseMiddleware<ApiKeyMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// Resolve org context after auth — makes org ID and role available to services
app.UseMiddleware<OrganizationContextMiddleware>();

app.MapControllers();

app.Run();
