using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using ForgeApi.Configurations;
using Microsoft.Extensions.Options;

namespace ForgeApi.Services.PaymentProviders;

public class PaystackProvider : IPaymentProvider
{
    private readonly HttpClient _http;
    private readonly ILogger<PaystackProvider> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public string Name => "paystack";

    public PaystackProvider(HttpClient http, IOptions<PaystackSettings> settings, ILogger<PaystackProvider> logger)
    {
        _http = http;
        _logger = logger;
        _http.BaseAddress = new Uri(settings.Value.BaseUrl.TrimEnd('/') + "/");
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", settings.Value.SecretKey);
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    /// <summary>
    /// Resolve account number → account name via Paystack's "Resolve Account Number" API.
    /// GET /bank/resolve?account_number=XXX&bank_code=XXX
    /// </summary>
    public async Task<AccountVerificationResult> VerifyAccountAsync(string accountNumber, string bankCode)
    {
        try
        {
            var response = await _http.GetAsync($"bank/resolve?account_number={accountNumber}&bank_code={bankCode}");
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Paystack account resolve failed: {Status} {Body}", response.StatusCode, body);
                return new AccountVerificationResult { IsValid = false };
            }

            var result = JsonSerializer.Deserialize<PaystackResponse<PaystackResolveData>>(body, JsonOptions);
            if (result?.Status != true || result.Data == null)
                return new AccountVerificationResult { IsValid = false };

            return new AccountVerificationResult
            {
                IsValid = true,
                AccountName = result.Data.AccountName,
                BankCode = bankCode
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying account {Account} at bank {Bank}", accountNumber, bankCode);
            return new AccountVerificationResult { IsValid = false };
        }
    }

    /// <summary>
    /// Initiate a transfer via Paystack:
    /// 1. Create transfer recipient
    /// 2. Initiate transfer
    /// </summary>
    public async Task<PaymentResult> InitiateTransferAsync(
        string recipientName,
        string accountNumber,
        string bankCode,
        decimal amount,
        string currency,
        string reference,
        string? narration = null)
    {
        try
        {
            // Step 1: Create transfer recipient
            var recipientCode = await CreateTransferRecipientAsync(recipientName, accountNumber, bankCode, currency);
            if (recipientCode == null)
            {
                return new PaymentResult
                {
                    Success = false,
                    ErrorMessage = "Failed to create transfer recipient at payment provider."
                };
            }

            // Step 2: Initiate transfer
            // Paystack expects amount in kobo (smallest currency unit)
            var amountInKobo = (long)(amount * 100);

            var payload = new
            {
                source = "balance",
                amount = amountInKobo,
                recipient = recipientCode,
                reason = narration ?? $"Payout to {recipientName}",
                reference,
                currency
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload, JsonOptions),
                Encoding.UTF8,
                "application/json");

            var response = await _http.PostAsync("transfer", content);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Paystack transfer failed: {Status} {Body}", response.StatusCode, body);
                var errorResult = JsonSerializer.Deserialize<PaystackResponse<object>>(body, JsonOptions);
                return new PaymentResult
                {
                    Success = false,
                    ErrorMessage = errorResult?.Message ?? "Transfer initiation failed."
                };
            }

            var result = JsonSerializer.Deserialize<PaystackResponse<PaystackTransferData>>(body, JsonOptions);
            if (result?.Data == null)
            {
                return new PaymentResult
                {
                    Success = false,
                    ErrorMessage = "Unexpected response from payment provider."
                };
            }

            // Paystack transfer status: "success", "pending", "failed", "reversed"
            var isSuccess = result.Data.Status is "success" or "pending";

            return new PaymentResult
            {
                Success = isSuccess,
                ProviderReference = result.Data.TransferCode,
                ProviderStatus = result.Data.Status,
                Fee = result.Data.Fee.HasValue ? result.Data.Fee.Value / 100m : null,
                Currency = result.Data.Currency,
                ErrorMessage = isSuccess ? null : result.Data.Reason
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating transfer for {Reference}", reference);
            return new PaymentResult
            {
                Success = false,
                ErrorMessage = "Payment provider communication error."
            };
        }
    }

    /// <summary>
    /// Check status of a transfer via Paystack.
    /// GET /transfer/verify/{reference}
    /// </summary>
    public async Task<TransferStatusResult> GetTransferStatusAsync(string providerReference)
    {
        try
        {
            var response = await _http.GetAsync($"transfer/verify/{providerReference}");
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Paystack transfer status check failed: {Status} {Body}", response.StatusCode, body);
                return new TransferStatusResult { Status = "unknown", Reason = "Could not verify transfer status." };
            }

            var result = JsonSerializer.Deserialize<PaystackResponse<PaystackTransferData>>(body, JsonOptions);
            if (result?.Data == null)
                return new TransferStatusResult { Status = "unknown" };

            var mappedStatus = result.Data.Status switch
            {
                "success" => "success",
                "failed" => "failed",
                "reversed" => "reversed",
                _ => "pending"
            };

            return new TransferStatusResult
            {
                Status = mappedStatus,
                ProviderReference = result.Data.TransferCode,
                Reason = result.Data.Reason,
                CompletedAt = result.Data.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking transfer status for {Reference}", providerReference);
            return new TransferStatusResult { Status = "unknown", Reason = "Provider communication error." };
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private async Task<string?> CreateTransferRecipientAsync(
        string name, string accountNumber, string bankCode, string currency)
    {
        var payload = new
        {
            type = "nuban",
            name,
            account_number = accountNumber,
            bank_code = bankCode,
            currency
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            Encoding.UTF8,
            "application/json");

        var response = await _http.PostAsync("transferrecipient", content);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Paystack create recipient failed: {Status} {Body}", response.StatusCode, body);
            return null;
        }

        var result = JsonSerializer.Deserialize<PaystackResponse<PaystackRecipientData>>(body, JsonOptions);
        return result?.Data?.RecipientCode;
    }

    // ── Paystack response DTOs ───────────────────────────────────────────────

    private class PaystackResponse<T>
    {
        public bool Status { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
    }

    private class PaystackResolveData
    {
        public string? AccountNumber { get; set; }
        public string? AccountName { get; set; }
        public int? BankId { get; set; }
    }

    private class PaystackRecipientData
    {
        public string? RecipientCode { get; set; }
        public string? Type { get; set; }
        public string? Name { get; set; }
    }

    private class PaystackTransferData
    {
        public string? TransferCode { get; set; }
        public string? Reference { get; set; }
        public string? Status { get; set; }
        public string? Reason { get; set; }
        public long? Amount { get; set; }
        public long? Fee { get; set; }
        public string? Currency { get; set; }
        public string? RecipientCode { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
