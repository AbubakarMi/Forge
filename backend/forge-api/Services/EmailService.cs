using System.Net;
using System.Net.Mail;
using ForgeApi.Configurations;
using ForgeApi.Utils;
using Microsoft.Extensions.Options;

namespace ForgeApi.Services;

public interface IEmailService
{
    Task SendRegistrationConfirmationAsync(string email, string name);
    Task SendBatchCompletedAsync(string email, string batchFileName, int totalRecords, int successCount, decimal totalAmount);
    Task SendBatchFailedAsync(string email, string batchFileName, int totalRecords, int failedCount, int successCount);
    Task SendFailedTransactionsAlertAsync(string email, int failedCount, Guid batchId, string batchFileName);
    Task SendWeeklySummaryAsync(string email, string orgName, int totalTransactions, decimal totalVolume, decimal successRate, int totalBatches);
}

public class EmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<SmtpSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendRegistrationConfirmationAsync(string email, string name)
    {
        var html = EmailTemplates.RegistrationConfirmation(name);
        await SendEmailAsync(email, "Welcome to Forge API", html);
    }

    public async Task SendBatchCompletedAsync(string email, string batchFileName, int totalRecords, int successCount, decimal totalAmount)
    {
        var html = EmailTemplates.BatchCompleted(batchFileName, totalRecords, successCount, totalAmount);
        await SendEmailAsync(email, $"Batch Completed — {batchFileName}", html);
    }

    public async Task SendBatchFailedAsync(string email, string batchFileName, int totalRecords, int failedCount, int successCount)
    {
        var html = EmailTemplates.BatchFailed(batchFileName, totalRecords, failedCount, successCount);
        await SendEmailAsync(email, $"Batch Processing Alert — {batchFileName}", html);
    }

    public async Task SendFailedTransactionsAlertAsync(string email, int failedCount, Guid batchId, string batchFileName)
    {
        var html = EmailTemplates.FailedTransactionsAlert(failedCount, batchId, batchFileName);
        await SendEmailAsync(email, $"Failed Transactions Alert — {batchFileName}", html);
    }

    public async Task SendWeeklySummaryAsync(string email, string orgName, int totalTransactions, decimal totalVolume, decimal successRate, int totalBatches)
    {
        var html = EmailTemplates.WeeklySummary(orgName, totalTransactions, totalVolume, successRate, totalBatches);
        await SendEmailAsync(email, $"Weekly Summary — {orgName}", html);
    }

    private async Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation("Email disabled. Would send to {To}: {Subject}", to, subject);
            return;
        }

        try
        {
            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.Username, _settings.Password),
                EnableSsl = _settings.UseSsl
            };

            var message = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail, _settings.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(to);

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}: {Subject}", to, subject);
        }
    }
}
