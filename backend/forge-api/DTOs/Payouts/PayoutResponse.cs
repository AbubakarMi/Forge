namespace ForgeApi.DTOs.Payouts;

public class PayoutResponse
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public string BankAccount { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ProcessedAt { get; set; }
}
