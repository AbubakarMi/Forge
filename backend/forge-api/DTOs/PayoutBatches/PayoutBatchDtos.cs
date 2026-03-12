namespace ForgeApi.DTOs.PayoutBatches;

public class CreateBatchFromFileResponse
{
    public Guid BatchId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public int TotalRecords { get; set; }
    public int ValidRecords { get; set; }
    public int InvalidRecords { get; set; }
    public decimal TotalAmount { get; set; }
    public List<BatchValidationError> Errors { get; set; } = new();
}

public class ConfirmBatchRequest
{
    public string BatchName { get; set; } = string.Empty;
    public string PaymentType { get; set; } = "immediate"; // immediate, scheduled, recurring
    public DateTime? ScheduledAt { get; set; }
    public string? RecurringInterval { get; set; } // monthly, biweekly, weekly
}

public class AddRecipientsToBatchResponse
{
    public int AddedCount { get; set; }
    public int FailedCount { get; set; }
    public decimal AddedAmount { get; set; }
    public List<BatchValidationError> Errors { get; set; } = new();
}

public class PayoutBatchResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? BatchName { get; set; }
    public int TotalRecords { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int PendingCount { get; set; }
    public string PaymentType { get; set; } = "immediate";
    public DateTime? ScheduledAt { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurringInterval { get; set; }
    public DateTime? NextRunAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class PayoutBatchDetailResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? BatchName { get; set; }
    public int TotalRecords { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int PendingCount { get; set; }
    public string PaymentType { get; set; } = "immediate";
    public DateTime? ScheduledAt { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurringInterval { get; set; }
    public DateTime? NextRunAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<TransactionResponse> Transactions { get; set; } = new();
}

public class TransactionResponse
{
    public Guid Id { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string RawBankName { get; set; } = string.Empty;
    public string? NormalizedBankName { get; set; }
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

public class PayoutBatchSummaryResponse
{
    public int TotalRecords { get; set; }
    public decimal TotalAmount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int PendingCount { get; set; }
    public decimal SuccessRate { get; set; }
    public decimal SuccessAmount { get; set; }
    public decimal FailedAmount { get; set; }
    public decimal PendingAmount { get; set; }
}

public class BatchValidationError
{
    public int RowNumber { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class BatchFilterRequest
{
    public string? Status { get; set; }
    public string? FileName { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
