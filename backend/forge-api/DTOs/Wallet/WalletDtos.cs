namespace ForgeApi.DTOs.Wallet;

public class WalletBalanceResponse
{
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "NGN";
    public bool IsActive { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WalletTransactionResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public Guid? PayoutBatchId { get; set; }
    public Guid? TransactionId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WalletHistoryFilter
{
    public string? Type { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class FundWalletRequest
{
    public decimal Amount { get; set; }
}
