namespace ForgeApi.Services.PaymentProviders;

/// <summary>
/// Result of a transfer/payout attempt.
/// </summary>
public class PaymentResult
{
    public bool Success { get; set; }
    public string? ProviderReference { get; set; }
    public string? ProviderStatus { get; set; }
    public string? ErrorMessage { get; set; }
    public decimal? Fee { get; set; }
    public string? Currency { get; set; }
}

/// <summary>
/// Result of a transfer status check.
/// </summary>
public class TransferStatusResult
{
    public string Status { get; set; } = string.Empty; // success, failed, pending, reversed
    public string? ProviderReference { get; set; }
    public string? Reason { get; set; }
    public DateTime? CompletedAt { get; set; }
}

/// <summary>
/// Result of an account name enquiry (resolve account).
/// </summary>
public class AccountVerificationResult
{
    public bool IsValid { get; set; }
    public string? AccountName { get; set; }
    public string? BankName { get; set; }
    public string? BankCode { get; set; }
}

/// <summary>
/// Recipient details for creating a transfer recipient at the provider.
/// </summary>
public class RecipientDetails
{
    public string Name { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string BankCode { get; set; } = string.Empty;
    public string Currency { get; set; } = "NGN";
}

/// <summary>
/// Abstraction over payment providers (Paystack, Flutterwave, etc.).
/// Each provider implements this interface.
/// </summary>
public interface IPaymentProvider
{
    string Name { get; }

    /// <summary>
    /// Verify an account number resolves to a real account at the given bank.
    /// </summary>
    Task<AccountVerificationResult> VerifyAccountAsync(string accountNumber, string bankCode);

    /// <summary>
    /// Initiate a single transfer/payout to a recipient.
    /// </summary>
    Task<PaymentResult> InitiateTransferAsync(
        string recipientName,
        string accountNumber,
        string bankCode,
        decimal amount,
        string currency,
        string reference,
        string? narration = null);

    /// <summary>
    /// Check the status of a previously initiated transfer.
    /// </summary>
    Task<TransferStatusResult> GetTransferStatusAsync(string providerReference);
}
