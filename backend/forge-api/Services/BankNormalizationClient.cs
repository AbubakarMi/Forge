using System.Text;
using System.Text.Json;
using ForgeApi.DTOs.Normalization;

namespace ForgeApi.Services;

public interface IBankNormalizationClient
{
    Task<NormalizationResult> NormalizeBankNameAsync(string bankName);
    Task<List<NormalizationResult>> NormalizeBankNamesAsync(List<string> bankNames);
}

public class BankNormalizationClient : IBankNormalizationClient
{
    private readonly HttpClient _httpClient;
    private readonly IBankService _bankService;
    private readonly ILogger<BankNormalizationClient> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public BankNormalizationClient(
        HttpClient httpClient,
        IBankService bankService,
        ILogger<BankNormalizationClient> logger)
    {
        _httpClient = httpClient;
        _bankService = bankService;
        _logger = logger;
    }

    public async Task<NormalizationResult> NormalizeBankNameAsync(string bankName)
    {
        try
        {
            var payload = JsonSerializer.Serialize(new { bank_name = bankName }, JsonOptions);
            var content = new StringContent(payload, Encoding.UTF8, "application/json");

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            var response = await _httpClient.PostAsync("/normalize-bank", content, cts.Token);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(cts.Token);
            return JsonSerializer.Deserialize<NormalizationResult>(json, JsonOptions)
                   ?? FallbackNormalize(bankName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI normalization service unavailable for '{BankName}', using fallback.", bankName);
            return FallbackNormalize(bankName);
        }
    }

    public async Task<List<NormalizationResult>> NormalizeBankNamesAsync(List<string> bankNames)
    {
        try
        {
            var payload = JsonSerializer.Serialize(new { bank_names = bankNames }, JsonOptions);
            var content = new StringContent(payload, Encoding.UTF8, "application/json");

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            var response = await _httpClient.PostAsync("/normalize-banks", content, cts.Token);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(cts.Token);
            var result = JsonSerializer.Deserialize<NormalizeBatchResponse>(json, JsonOptions);

            return result?.Results ?? bankNames.Select(FallbackNormalize).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI normalization service unavailable for batch of {Count}, using fallback.", bankNames.Count);
            return bankNames.Select(FallbackNormalize).ToList();
        }
    }

    /// <summary>
    /// Fallback: try to match against bank names and aliases in the database.
    /// Used when the AI service is down or unreachable.
    /// </summary>
    private NormalizationResult FallbackNormalize(string bankName)
    {
        // Synchronous wrapper — acceptable for fallback path
        var bank = _bankService.FindBankByAliasAsync(bankName)
            .ConfigureAwait(false).GetAwaiter().GetResult();

        if (bank != null)
        {
            return new NormalizationResult
            {
                NormalizedBank = bank.Name,
                BankCode = bank.Code,
                Confidence = 0.85m,
                OriginalInput = bankName,
                MatchType = "fallback_alias"
            };
        }

        return new NormalizationResult
        {
            NormalizedBank = null,
            BankCode = null,
            Confidence = 0m,
            OriginalInput = bankName,
            MatchType = "unmatched"
        };
    }
}
