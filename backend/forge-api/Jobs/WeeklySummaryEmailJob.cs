using ForgeApi.Data;
using ForgeApi.Services;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Jobs;

public class WeeklySummaryEmailJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WeeklySummaryEmailJob> _logger;

    public WeeklySummaryEmailJob(IServiceScopeFactory scopeFactory, ILogger<WeeklySummaryEmailJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Wait until next Monday 8:00 AM UTC
            var now = DateTime.UtcNow;
            var daysUntilMonday = ((int)DayOfWeek.Monday - (int)now.DayOfWeek + 7) % 7;
            if (daysUntilMonday == 0 && now.Hour >= 8) daysUntilMonday = 7;
            var nextMonday = now.Date.AddDays(daysUntilMonday).AddHours(8);
            var delay = nextMonday - now;

            _logger.LogInformation("Weekly summary job will run at {NextRun}", nextMonday);
            await Task.Delay(delay, stoppingToken);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var weekStart = DateTime.UtcNow.AddDays(-7);

                // Get all orgs with activity in the past week
                var orgs = await db.Organizations.ToListAsync(stoppingToken);

                foreach (var org in orgs)
                {
                    var transactions = await db.Transactions
                        .Where(t => t.OrganizationId == org.Id && t.CreatedAt >= weekStart)
                        .ToListAsync(stoppingToken);

                    if (!transactions.Any()) continue;

                    var batches = await db.PayoutBatches
                        .Where(b => b.OrganizationId == org.Id && b.CreatedAt >= weekStart)
                        .CountAsync(stoppingToken);

                    var totalVolume = transactions.Sum(t => t.Amount);
                    var completed = transactions.Count(t => t.Status == "completed");
                    var successRate = transactions.Count > 0 ? (decimal)completed / transactions.Count * 100 : 0;

                    // Send to org owner
                    var owner = await db.OrganizationMembers
                        .Include(m => m.User)
                        .FirstOrDefaultAsync(m => m.OrganizationId == org.Id && m.Role == "owner", stoppingToken);

                    if (owner != null)
                    {
                        await emailService.SendWeeklySummaryAsync(
                            owner.User.Email, org.Name, transactions.Count,
                            totalVolume, successRate, batches);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Weekly summary email job failed.");
            }
        }
    }
}
