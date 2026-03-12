using System.Security.Cryptography;
using ForgeApi.Configurations;
using Microsoft.Extensions.Options;

namespace ForgeApi.Services;

public interface IEncryptionService
{
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
}

public class EncryptionService : IEncryptionService
{
    private readonly byte[] _key;

    public EncryptionService(IOptions<EncryptionSettings> settings)
    {
        _key = Convert.FromBase64String(settings.Value.Key);
        if (_key.Length != 32)
            throw new ArgumentException("Encryption key must be 256 bits (32 bytes).");
    }

    public string Encrypt(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext)) return plaintext;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();
        var plaintextBytes = System.Text.Encoding.UTF8.GetBytes(plaintext);
        var cipherBytes = encryptor.TransformFinalBlock(plaintextBytes, 0, plaintextBytes.Length);

        // Prepend IV to ciphertext
        var result = new byte[aes.IV.Length + cipherBytes.Length];
        Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
        Buffer.BlockCopy(cipherBytes, 0, result, aes.IV.Length, cipherBytes.Length);

        return Convert.ToBase64String(result);
    }

    public string Decrypt(string ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext)) return ciphertext;

        var fullCipher = Convert.FromBase64String(ciphertext);

        using var aes = Aes.Create();
        aes.Key = _key;

        // Extract IV (first 16 bytes)
        var iv = new byte[16];
        Buffer.BlockCopy(fullCipher, 0, iv, 0, 16);
        aes.IV = iv;

        var cipherBytes = new byte[fullCipher.Length - 16];
        Buffer.BlockCopy(fullCipher, 16, cipherBytes, 0, cipherBytes.Length);

        using var decryptor = aes.CreateDecryptor();
        var plaintextBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);
        return System.Text.Encoding.UTF8.GetString(plaintextBytes);
    }
}
