using System.ComponentModel.DataAnnotations;

namespace ForgeApi.DTOs.Banks;

public class BankListResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int AliasCount { get; set; }
}

public class BankDetailResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<BankAliasResponse> Aliases { get; set; } = new();
}

public class BankAliasResponse
{
    public Guid Id { get; set; }
    public string Alias { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateBankRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;
}

public class AddBankAliasRequest
{
    [Required]
    [MaxLength(200)]
    public string Alias { get; set; } = string.Empty;
}
