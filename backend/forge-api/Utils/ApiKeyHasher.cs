using System.Security.Cryptography;
using System.Text;

namespace ForgeApi.Utils;

public static class ApiKeyHasher
{
    public static string HashKey(string rawKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public static string GenerateRawKey()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(32);
        return $"forge_{Convert.ToHexString(randomBytes).ToLowerInvariant()}";
    }

    public static string GetPrefix(string rawKey)
    {
        // "forge_ab12cd34..." → "forge_ab12****"
        return rawKey.Length >= 14
            ? $"{rawKey[..14]}****"
            : rawKey;
    }
}
