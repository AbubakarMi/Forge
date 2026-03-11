using System.Text.Json.Serialization;

namespace ForgeApi.DTOs.Normalization;

public class NormalizationResult
{
    [JsonPropertyName("normalized_bank")]
    public string? NormalizedBank { get; set; }

    [JsonPropertyName("bank_code")]
    public string? BankCode { get; set; }

    [JsonPropertyName("confidence")]
    public decimal Confidence { get; set; }

    [JsonPropertyName("original_input")]
    public string OriginalInput { get; set; } = string.Empty;

    [JsonPropertyName("match_type")]
    public string MatchType { get; set; } = string.Empty;

    [JsonPropertyName("best_guess")]
    public string? BestGuess { get; set; }

    [JsonPropertyName("best_guess_code")]
    public string? BestGuessCode { get; set; }
}

public class NormalizeBankRequest
{
    public string BankName { get; set; } = string.Empty;
}

public class NormalizeBatchBankRequest
{
    public List<string> BankNames { get; set; } = new();
}

public class NormalizeBatchResponse
{
    [JsonPropertyName("results")]
    public List<NormalizationResult> Results { get; set; } = new();
}
