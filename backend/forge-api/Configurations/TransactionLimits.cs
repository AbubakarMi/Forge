namespace ForgeApi.Configurations;

public class TransactionLimits
{
    public decimal MinTransactionAmount { get; set; } = 100m;
    public decimal MaxTransactionAmount { get; set; } = 10_000_000m;
    public decimal MaxBatchAmount { get; set; } = 100_000_000m;
    public decimal MaxDailyOrgAmount { get; set; } = 500_000_000m;
    public int MaxBatchRecords { get; set; } = 10_000;
    public int DuplicateWindowMinutes { get; set; } = 30;
    public int MaxRetryCount { get; set; } = 3;
}
