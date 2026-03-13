using ForgeApi.Services.PaymentProviders;

namespace ForgeApi.Services;

public interface IAccountVerificationService
{
    Task<AccountVerificationResult> VerifyAsync(string accountNumber, string bankCode);
    Task<List<AccountVerificationResult>> VerifyBatchAsync(
        List<(string AccountNumber, string BankCode)> accounts);
}

public class AccountVerificationService : IAccountVerificationService
{
    private readonly IPaymentProvider _provider;
    private readonly ILogger<AccountVerificationService> _logger;

    public AccountVerificationService(
        IPaymentProvider provider,
        ILogger<AccountVerificationService> logger)
    {
        _provider = provider;
        _logger = logger;
    }

    public async Task<AccountVerificationResult> VerifyAsync(string accountNumber, string bankCode)
    {
        return await _provider.VerifyAccountAsync(accountNumber, bankCode);
    }

    /// <summary>
    /// Verify multiple accounts. Runs sequentially to respect provider rate limits.
    /// </summary>
    public async Task<List<AccountVerificationResult>> VerifyBatchAsync(
        List<(string AccountNumber, string BankCode)> accounts)
    {
        var results = new List<AccountVerificationResult>();

        foreach (var (accountNumber, bankCode) in accounts)
        {
            try
            {
                var result = await _provider.VerifyAccountAsync(accountNumber, bankCode);
                results.Add(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to verify account {Account} at bank {Bank}",
                    accountNumber, bankCode);
                results.Add(new AccountVerificationResult { IsValid = false });
            }

            // Small delay to respect rate limits
            await Task.Delay(100);
        }

        return results;
    }
}
