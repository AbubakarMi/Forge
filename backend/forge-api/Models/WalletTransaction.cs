namespace ForgeApi.Models;

public class WalletTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WalletId { get; set; }

    /// <summary>
    /// credit = money in, debit = money out, refund = failed payout returned, fee = platform fee
    /// </summary>
    public string Type { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }

    /// <summary>
    /// Optional link to the payout batch that triggered this wallet movement.
    /// </summary>
    public Guid? PayoutBatchId { get; set; }

    /// <summary>
    /// Optional link to the specific transaction (for refunds).
    /// </summary>
    public Guid? TransactionId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Wallet Wallet { get; set; } = null!;
}
