namespace ForgeApi.Utils;

public static class DataMasking
{
    /// <summary>Mask account number: "1234567890" → "******7890"</summary>
    public static string MaskAccountNumber(string? accountNumber)
    {
        if (string.IsNullOrEmpty(accountNumber) || accountNumber.Length <= 4)
            return accountNumber ?? string.Empty;
        return new string('*', accountNumber.Length - 4) + accountNumber[^4..];
    }

    /// <summary>Mask email: "user@email.com" → "u***@email.com"</summary>
    public static string MaskEmail(string? email)
    {
        if (string.IsNullOrEmpty(email) || !email.Contains('@'))
            return email ?? string.Empty;
        var parts = email.Split('@');
        var local = parts[0];
        if (local.Length <= 1)
            return email;
        return local[0] + new string('*', Math.Min(local.Length - 1, 3)) + "@" + parts[1];
    }

    /// <summary>Mask name: "Abubakar Mohammed" → "A****** M*******"</summary>
    public static string MaskName(string? name)
    {
        if (string.IsNullOrEmpty(name))
            return string.Empty;
        var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return string.Join(" ", parts.Select(p =>
            p.Length <= 1 ? p : p[0] + new string('*', p.Length - 1)));
    }
}
