using System.ComponentModel.DataAnnotations;

namespace ForgeApi.DTOs.V1;

public class V1PaymentItem
{
    [Required] public string RecipientName { get; set; } = string.Empty;
    [Required] public string BankName { get; set; } = string.Empty;
    [Required] public string AccountNumber { get; set; } = string.Empty;
    [Required] [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
}

public class V1CreateBatchRequest
{
    [Required] [MinLength(1)] public List<V1PaymentItem> Payments { get; set; } = new();
    public string? Reference { get; set; }
}

public class V1CreatePayoutRequest
{
    [Required] public string RecipientName { get; set; } = string.Empty;
    [Required] public string BankName { get; set; } = string.Empty;
    [Required] public string AccountNumber { get; set; } = string.Empty;
    [Required] [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
}

public class V1BatchResponse
{
    public Guid Id { get; set; }
    public int TotalRecords { get; set; }
    public int ValidRecords { get; set; }
    public int InvalidRecords { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<V1ValidationError>? Errors { get; set; }
}

public class V1ValidationError
{
    public int Row { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class V1TransactionResponse
{
    public Guid Id { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string? NormalizedBankName { get; set; }
    public string AccountNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class V1BankResponse
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

public class V1NormalizeResponse
{
    public string? NormalizedName { get; set; }
    public string? BankCode { get; set; }
    public decimal Confidence { get; set; }
    public string OriginalInput { get; set; } = string.Empty;
    public string MatchType { get; set; } = string.Empty;
}
