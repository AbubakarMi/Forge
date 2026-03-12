using ForgeApi.Configurations;
using ForgeApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ForgeApi.Services;

public interface ITransactionValidationService
{
    List<string> ValidateAmount(decimal amount);
    Task<List<string>> ValidateBatchAmountAsync(decimal totalAmount, Guid organizationId);
    Task<bool> IsDuplicateAsync(string accountNumber, Guid? bankId, decimal amount, Guid organizationId);
    (List<string> Errors, List<string> Warnings) ValidateAccountNumber(string accountNumber, string? bankCode = null);
}

public class TransactionValidationService : ITransactionValidationService
{
    private readonly AppDbContext _context;
    private readonly TransactionLimits _limits;

    public TransactionValidationService(AppDbContext context, IOptions<TransactionLimits> limits)
    {
        _context = context;
        _limits = limits.Value;
    }

    public List<string> ValidateAmount(decimal amount)
    {
        var errors = new List<string>();

        if (amount <= 0)
            errors.Add("Amount must be greater than zero.");
        else if (amount < _limits.MinTransactionAmount)
            errors.Add($"Amount {amount:N2} is below minimum ({_limits.MinTransactionAmount:N2} NGN).");
        else if (amount > _limits.MaxTransactionAmount)
            errors.Add($"Amount {amount:N2} exceeds maximum per transaction ({_limits.MaxTransactionAmount:N2} NGN).");

        return errors;
    }

    public async Task<List<string>> ValidateBatchAmountAsync(decimal totalAmount, Guid organizationId)
    {
        var errors = new List<string>();

        if (totalAmount > _limits.MaxBatchAmount)
        {
            errors.Add($"Batch total {totalAmount:N2} exceeds maximum batch amount ({_limits.MaxBatchAmount:N2} NGN).");
            return errors;
        }

        // Check daily org limit
        var todayStart = DateTime.UtcNow.Date;
        var todayTotal = await _context.Transactions
            .Where(t => t.OrganizationId == organizationId
                     && t.CreatedAt >= todayStart
                     && t.Status != "failed")
            .SumAsync(t => t.Amount);

        if (todayTotal + totalAmount > _limits.MaxDailyOrgAmount)
        {
            errors.Add($"Adding {totalAmount:N2} would exceed daily organization limit ({_limits.MaxDailyOrgAmount:N2} NGN). Today's total: {todayTotal:N2}.");
        }

        return errors;
    }

    public async Task<bool> IsDuplicateAsync(string accountNumber, Guid? bankId, decimal amount, Guid organizationId)
    {
        var windowStart = DateTime.UtcNow.AddMinutes(-_limits.DuplicateWindowMinutes);

        return await _context.Transactions
            .AnyAsync(t => t.OrganizationId == organizationId
                        && t.AccountNumber == accountNumber
                        && t.BankId == bankId
                        && t.Amount == amount
                        && t.CreatedAt >= windowStart
                        && t.Status != "failed");
    }

    /// <summary>
    /// Validates Nigerian bank account numbers using NUBAN format.
    /// NUBAN: 10 digits, where the 10th digit is a check digit.
    /// </summary>
    public (List<string> Errors, List<string> Warnings) ValidateAccountNumber(string accountNumber, string? bankCode = null)
    {
        var errors = new List<string>();
        var warnings = new List<string>();

        if (string.IsNullOrWhiteSpace(accountNumber))
        {
            errors.Add("Account number is required.");
            return (errors, warnings);
        }

        // Remove spaces and dashes
        var cleaned = accountNumber.Replace(" ", "").Replace("-", "");

        if (cleaned.Length != 10)
        {
            errors.Add($"Account number must be exactly 10 digits (got {cleaned.Length}).");
            return (errors, warnings);
        }

        if (!cleaned.All(char.IsDigit))
        {
            errors.Add("Account number must contain only digits.");
            return (errors, warnings);
        }

        // NUBAN check digit validation (if bank code is available)
        // Only validate for standard commercial/merchant banks with 3-digit codes.
        // Skip for PSBs/fintechs (6-digit codes, 99xxxx), MFBs (09xxxx), mobile money (1x, 5x)
        var skipNuban = string.IsNullOrEmpty(bankCode)
            || bankCode.Length > 3
            || bankCode.StartsWith("1")
            || bankCode.StartsWith("09")
            || bankCode.StartsWith("5")
            || bankCode.StartsWith("99");

        if (!skipNuban)
        {
            if (!ValidateNubanCheckDigit(bankCode!, cleaned))
            {
                // NUBAN mismatch is a warning, not a hard error.
                // The actual bank API will do the final validation.
                warnings.Add($"Account number {cleaned} may not match bank code {bankCode}. Please verify the account number.");
            }
        }

        return (errors, warnings);
    }

    /// <summary>
    /// NUBAN (Nigeria Uniform Bank Account Number) check digit algorithm.
    /// Seed: bank_code[0..2] + account_number[0..8]
    /// Weights: 3,7,3,3,7,3,3,7,3,3,7,3
    /// Check digit = (10 - (weighted_sum % 10)) % 10
    /// Must equal account_number[9]
    /// </summary>
    private static bool ValidateNubanCheckDigit(string bankCode, string accountNumber)
    {
        try
        {
            // Take last 3 digits of bank code
            var code = bankCode.Length > 3 ? bankCode[^3..] : bankCode.PadLeft(3, '0');

            // Build 12-digit seed: 3 bank code digits + 9 account digits
            var seed = code + accountNumber[..9];

            if (seed.Length != 12 || !seed.All(char.IsDigit))
                return true; // Can't validate, assume valid

            int[] weights = { 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3 };
            var sum = 0;

            for (var i = 0; i < 12; i++)
            {
                sum += (seed[i] - '0') * weights[i];
            }

            var checkDigit = (10 - (sum % 10)) % 10;
            var actualCheckDigit = accountNumber[9] - '0';

            return checkDigit == actualCheckDigit;
        }
        catch
        {
            return true; // If validation fails, don't block — log and continue
        }
    }
}
