namespace ForgeApi.DTOs.Transactions;

public class TransactionResponse
{
    public Guid Id { get; set; }
    public Guid PayoutBatchId { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string RawBankName { get; set; } = string.Empty;
    public string? NormalizedBankName { get; set; }
    public string? BankCode { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
    public decimal? NormalizationConfidence { get; set; }
    public int RetryCount { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TransactionDetailResponse : TransactionResponse
{
    public string? BankName { get; set; }
    public string BatchFileName { get; set; } = string.Empty;
}

public class TransactionStatsResponse
{
    public int TotalTransactions { get; set; }
    public int CompletedCount { get; set; }
    public int FailedCount { get; set; }
    public int PendingCount { get; set; }
    public int ProcessingCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal CompletedAmount { get; set; }
    public decimal SuccessRate { get; set; }
}

public class TransactionFilterRequest
{
    public string? Status { get; set; }
    public Guid? BatchId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
