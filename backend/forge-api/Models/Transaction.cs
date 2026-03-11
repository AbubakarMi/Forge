namespace ForgeApi.Models;

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PayoutBatchId { get; set; }
    public Guid OrganizationId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public Guid? BankId { get; set; }
    public string RawBankName { get; set; } = string.Empty;
    public string? NormalizedBankName { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "NGN";
    public string Status { get; set; } = "pending";
    public string? FailureReason { get; set; }
    public decimal? NormalizationConfidence { get; set; }
    public int RetryCount { get; set; } = 0;
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public PayoutBatch PayoutBatch { get; set; } = null!;
    public Organization Organization { get; set; } = null!;
    public Bank? Bank { get; set; }
}
