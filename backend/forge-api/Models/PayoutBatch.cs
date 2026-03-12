namespace ForgeApi.Models;

public class PayoutBatch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? BatchName { get; set; }
    public int TotalRecords { get; set; }
    public decimal TotalAmount { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public int PendingCount { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Optimistic concurrency token — prevents race conditions on batch counter updates.
    /// </summary>
    public uint RowVersion { get; set; }

    public Organization Organization { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
