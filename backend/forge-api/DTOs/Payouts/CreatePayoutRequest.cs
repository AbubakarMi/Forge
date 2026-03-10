using System.ComponentModel.DataAnnotations;

namespace ForgeApi.DTOs.Payouts;

public class CreatePayoutRequest
{
    [Required]
    public Guid TransactionId { get; set; }

    [Required]
    public string BankAccount { get; set; } = string.Empty;
}
