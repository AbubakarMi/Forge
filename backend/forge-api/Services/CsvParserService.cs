using ForgeApi.DTOs.PayoutBatches;

namespace ForgeApi.Services;

public class ParseResult
{
    public List<PaymentRecord> ValidRecords { get; set; } = new();
    public List<BatchValidationError> Errors { get; set; } = new();
}

public class PaymentRecord
{
    public string RecipientName { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public interface ICsvParserService
{
    Task<ParseResult> ParsePaymentFileAsync(Stream fileStream);
}

public class CsvParserService : ICsvParserService
{
    private const int MaxRows = 10_000;

    // Maps normalized header names to canonical field names
    private static readonly Dictionary<string, string> HeaderAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["name"] = "RecipientName",
        ["recipientname"] = "RecipientName",
        ["recipient_name"] = "RecipientName",
        ["recipient name"] = "RecipientName",
        ["bank"] = "BankName",
        ["bankname"] = "BankName",
        ["bank_name"] = "BankName",
        ["bank name"] = "BankName",
        ["accountnumber"] = "AccountNumber",
        ["account_number"] = "AccountNumber",
        ["account number"] = "AccountNumber",
        ["account"] = "AccountNumber",
        ["amount"] = "Amount",
    };

    public async Task<ParseResult> ParsePaymentFileAsync(Stream fileStream)
    {
        var result = new ParseResult();

        using var reader = new StreamReader(fileStream);
        var headerLine = await reader.ReadLineAsync();

        if (string.IsNullOrWhiteSpace(headerLine))
        {
            result.Errors.Add(new BatchValidationError
            {
                RowNumber = 1,
                Field = "Header",
                Message = "CSV file is empty or missing header row."
            });
            return result;
        }

        var headers = ParseCsvLine(headerLine);
        var columnMap = MapColumns(headers);

        // Validate required columns are present
        var requiredFields = new[] { "RecipientName", "BankName", "AccountNumber", "Amount" };
        foreach (var field in requiredFields)
        {
            if (!columnMap.ContainsKey(field))
            {
                result.Errors.Add(new BatchValidationError
                {
                    RowNumber = 1,
                    Field = field,
                    Message = $"Required column '{field}' not found in header. Expected one of the recognized aliases."
                });
            }
        }

        if (result.Errors.Count > 0)
            return result;

        var rowNumber = 1; // header is row 1
        var dataRowCount = 0;

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            rowNumber++;

            // Skip empty rows
            if (string.IsNullOrWhiteSpace(line))
                continue;

            dataRowCount++;

            if (dataRowCount > MaxRows)
            {
                result.Errors.Add(new BatchValidationError
                {
                    RowNumber = rowNumber,
                    Field = "File",
                    Message = $"File exceeds maximum of {MaxRows:N0} rows."
                });
                break;
            }

            var fields = ParseCsvLine(line);
            var rowErrors = new List<BatchValidationError>();

            // Extract values
            var recipientName = GetFieldValue(fields, columnMap, "RecipientName");
            var bankName = GetFieldValue(fields, columnMap, "BankName");
            var accountNumber = GetFieldValue(fields, columnMap, "AccountNumber");
            var amountStr = GetFieldValue(fields, columnMap, "Amount");

            // Validate RecipientName
            if (string.IsNullOrWhiteSpace(recipientName))
            {
                rowErrors.Add(new BatchValidationError
                {
                    RowNumber = rowNumber,
                    Field = "RecipientName",
                    Message = "Recipient name is required."
                });
            }

            // Validate BankName
            if (string.IsNullOrWhiteSpace(bankName))
            {
                rowErrors.Add(new BatchValidationError
                {
                    RowNumber = rowNumber,
                    Field = "BankName",
                    Message = "Bank name is required."
                });
            }

            // Validate AccountNumber
            if (string.IsNullOrWhiteSpace(accountNumber))
            {
                rowErrors.Add(new BatchValidationError
                {
                    RowNumber = rowNumber,
                    Field = "AccountNumber",
                    Message = "Account number is required."
                });
            }

            // Validate Amount
            decimal amount = 0;
            if (string.IsNullOrWhiteSpace(amountStr))
            {
                rowErrors.Add(new BatchValidationError
                {
                    RowNumber = rowNumber,
                    Field = "Amount",
                    Message = "Amount is required."
                });
            }
            else if (!decimal.TryParse(amountStr.Replace(",", "").Trim(), out amount))
            {
                rowErrors.Add(new BatchValidationError
                {
                    RowNumber = rowNumber,
                    Field = "Amount",
                    Message = $"Amount '{amountStr}' is not a valid number."
                });
            }

            if (rowErrors.Count > 0)
            {
                result.Errors.AddRange(rowErrors);
            }
            else
            {
                result.ValidRecords.Add(new PaymentRecord
                {
                    RecipientName = recipientName!.Trim(),
                    BankName = bankName!.Trim(),
                    AccountNumber = accountNumber!.Trim(),
                    Amount = amount
                });
            }
        }

        if (dataRowCount == 0)
        {
            result.Errors.Add(new BatchValidationError
            {
                RowNumber = 2,
                Field = "File",
                Message = "CSV file contains no data rows."
            });
        }

        return result;
    }

    private static Dictionary<string, int> MapColumns(string[] headers)
    {
        var map = new Dictionary<string, int>();

        for (var i = 0; i < headers.Length; i++)
        {
            var header = headers[i].Trim();
            if (HeaderAliases.TryGetValue(header, out var canonical))
            {
                // First match wins (don't overwrite)
                if (!map.ContainsKey(canonical))
                    map[canonical] = i;
            }
        }

        return map;
    }

    private static string? GetFieldValue(string[] fields, Dictionary<string, int> columnMap, string fieldName)
    {
        if (!columnMap.TryGetValue(fieldName, out var index))
            return null;

        return index < fields.Length ? fields[index] : null;
    }

    /// <summary>
    /// Simple CSV line parser that handles quoted fields (including commas and quotes within quotes).
    /// </summary>
    private static string[] ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuotes = false;
        var i = 0;

        while (i < line.Length)
        {
            var c = line[i];

            if (inQuotes)
            {
                if (c == '"')
                {
                    // Check for escaped quote ("")
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current.Append('"');
                        i += 2;
                        continue;
                    }
                    else
                    {
                        inQuotes = false;
                        i++;
                        continue;
                    }
                }
                else
                {
                    current.Append(c);
                    i++;
                }
            }
            else
            {
                if (c == '"')
                {
                    inQuotes = true;
                    i++;
                }
                else if (c == ',')
                {
                    fields.Add(current.ToString());
                    current.Clear();
                    i++;
                }
                else
                {
                    current.Append(c);
                    i++;
                }
            }
        }

        fields.Add(current.ToString());
        return fields.ToArray();
    }
}
