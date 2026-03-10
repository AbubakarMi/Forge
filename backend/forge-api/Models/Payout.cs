namespace ForgeApi.Models;

public class Payout
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TransactionId { get; set; }
    public string BankAccount { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public DateTime? ProcessedAt { get; set; }

    public Transaction Transaction { get; set; } = null!;
}
