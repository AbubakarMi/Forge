namespace ForgeApi.DTOs.Reports;

public class SummaryReport
{
    public int TotalBatches { get; set; }
    public int TotalTransactions { get; set; }
    public decimal TotalVolume { get; set; }
    public decimal SuccessRate { get; set; }
    public int CompletedCount { get; set; }
    public int FailedCount { get; set; }
    public int PendingCount { get; set; }
    public List<TopBankEntry> TopBanks { get; set; } = new();
    public List<DailyBreakdown> DailyBreakdown { get; set; } = new();
}

public class TopBankEntry
{
    public string BankName { get; set; } = string.Empty;
    public int TransactionCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal SuccessRate { get; set; }
}

public class DailyBreakdown
{
    public DateTime Date { get; set; }
    public int TransactionCount { get; set; }
    public decimal Amount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
}
