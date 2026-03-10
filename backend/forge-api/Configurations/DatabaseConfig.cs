using ForgeApi.Data;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Configurations;

public static class DatabaseConfig
{
    public static IServiceCollection AddDatabaseConfig(
        this IServiceCollection services,
        IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(config.GetConnectionString("DefaultConnection")));

        return services;
    }
}
