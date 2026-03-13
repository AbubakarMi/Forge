namespace ForgeApi.Models;

public class Wallet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "NGN";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optimistic concurrency — prevents double-debit race conditions.
    /// </summary>
    public uint RowVersion { get; set; }

    public Organization Organization { get; set; } = null!;
    public ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
}
