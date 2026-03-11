using FluentAssertions;
using ForgeApi.Models;
using ForgeApi.Services;
using ForgeApi.Tests.Helpers;

namespace ForgeApi.Tests.Services;

public class BankServiceTests
{
    private static async Task<ForgeApi.Data.AppDbContext> SeedBanksAsync()
    {
        var ctx = TestDbContextFactory.Create();

        var gtBank = new Bank { Name = "Guaranty Trust Bank", Code = "058", Country = "Nigeria", IsActive = true };
        var accessBank = new Bank { Name = "Access Bank", Code = "044", Country = "Nigeria", IsActive = true };
        var inactiveBank = new Bank { Name = "Old Bank", Code = "999", Country = "Nigeria", IsActive = false };

        ctx.Banks.AddRange(gtBank, accessBank, inactiveBank);

        ctx.BankAliases.Add(new BankAlias { BankId = gtBank.Id, Alias = "GTBank" });
        ctx.BankAliases.Add(new BankAlias { BankId = accessBank.Id, Alias = "Diamond Bank" });

        await ctx.SaveChangesAsync();
        return ctx;
    }

    [Fact(Skip = "Requires PostgreSQL — EF.Functions.ILike not supported by InMemory provider")]
    public async Task SearchBanks_ByName_ReturnsMatches()
    {
        await using var ctx = await SeedBanksAsync();
        var svc = new BankService(ctx);

        var results = (await svc.SearchBanksAsync("Guaranty")).ToList();

        results.Should().HaveCount(1);
        results[0].Name.Should().Be("Guaranty Trust Bank");
    }

    [Fact(Skip = "Requires PostgreSQL — EF.Functions.ILike not supported by InMemory provider")]
    public async Task SearchBanks_NoMatch_ReturnsEmpty()
    {
        await using var ctx = await SeedBanksAsync();
        var svc = new BankService(ctx);

        var results = (await svc.SearchBanksAsync("Nonexistent")).ToList();

        results.Should().BeEmpty();
    }

    [Fact]
    public async Task GetBankByCode_Valid_ReturnsBank()
    {
        await using var ctx = await SeedBanksAsync();
        var svc = new BankService(ctx);

        var result = await svc.GetBankByCodeAsync("058");

        result.Should().NotBeNull();
        result!.Name.Should().Be("Guaranty Trust Bank");
        result.Code.Should().Be("058");
    }

    [Fact(Skip = "Requires PostgreSQL — EF.Functions.ILike not supported by InMemory provider")]
    public async Task FindBankByAlias_ExactMatch_ReturnsBank()
    {
        await using var ctx = await SeedBanksAsync();
        var svc = new BankService(ctx);

        var result = await svc.FindBankByAliasAsync("GTBank");

        result.Should().NotBeNull();
        result!.Name.Should().Be("Guaranty Trust Bank");
    }

    [Fact]
    public async Task GetBankByCode_NotFound_ReturnsNull()
    {
        await using var ctx = await SeedBanksAsync();
        var svc = new BankService(ctx);

        var result = await svc.GetBankByCodeAsync("000");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAllBanks_ExcludesInactive_ByDefault()
    {
        await using var ctx = await SeedBanksAsync();
        var svc = new BankService(ctx);

        var results = (await svc.GetAllBanksAsync()).ToList();

        results.Should().HaveCount(2);
        results.Should().NotContain(b => b.Name == "Old Bank");
    }

    [Fact]
    public async Task GetAllBanks_IncludesInactive_WhenRequested()
    {
        await using var ctx = await SeedBanksAsync();
        var svc = new BankService(ctx);

        var results = (await svc.GetAllBanksAsync(includeInactive: true)).ToList();

        results.Should().HaveCount(3);
    }
}
