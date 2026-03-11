namespace ForgeApi.Models;

public class BankAlias
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BankId { get; set; }
    public string Alias { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Bank Bank { get; set; } = null!;
}
