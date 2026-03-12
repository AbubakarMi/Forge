using FluentAssertions;
using ForgeApi.Configurations;
using ForgeApi.Services;
using ForgeApi.Tests.Helpers;
using Microsoft.Extensions.Options;

namespace ForgeApi.Tests.Services;

public class TransactionValidationServiceTests
{
    private static TransactionValidationService CreateService(
        ForgeApi.Data.AppDbContext? ctx = null,
        TransactionLimits? limits = null)
    {
        ctx ??= TestDbContextFactory.Create();
        limits ??= new TransactionLimits
        {
            MinTransactionAmount = 100m,
            MaxTransactionAmount = 10_000_000m,
            MaxBatchAmount = 100_000_000m,
            MaxDailyOrgAmount = 500_000_000m,
            DuplicateWindowMinutes = 30,
            MaxRetryCount = 3
        };
        return new TransactionValidationService(ctx, Options.Create(limits));
    }

    // ── ValidateAmount ────────────────────────────────────────────────

    [Fact]
    public void ValidateAmount_BelowMin_ReturnsError()
    {
        var svc = CreateService();

        var errors = svc.ValidateAmount(50m);

        errors.Should().HaveCount(1);
        errors[0].Should().Contain("below minimum");
    }

    [Fact]
    public void ValidateAmount_AboveMax_ReturnsError()
    {
        var svc = CreateService();

        var errors = svc.ValidateAmount(20_000_000m);

        errors.Should().HaveCount(1);
        errors[0].Should().Contain("exceeds maximum");
    }

    [Fact]
    public void ValidateAmount_Valid_NoErrors()
    {
        var svc = CreateService();

        var errors = svc.ValidateAmount(5_000m);

        errors.Should().BeEmpty();
    }

    // ── ValidateAccountNumber ─────────────────────────────────────────

    [Fact]
    public void ValidateAccountNumber_InvalidLength_ReturnsError()
    {
        var svc = CreateService();

        var (errors, _) = svc.ValidateAccountNumber("12345");

        errors.Should().HaveCount(1);
        errors[0].Should().Contain("exactly 10 digits");
    }

    [Fact]
    public void ValidateAccountNumber_NonDigits_ReturnsError()
    {
        var svc = CreateService();

        var (errors, _) = svc.ValidateAccountNumber("12345ABCDE");

        errors.Should().HaveCount(1);
        errors[0].Should().Contain("only digits");
    }

    [Fact]
    public void ValidateAccountNumber_Valid_NoErrors()
    {
        var svc = CreateService();

        var (errors, _) = svc.ValidateAccountNumber("1234567890");

        errors.Should().BeEmpty();
    }
}
