using System.Text;
using FluentAssertions;
using ForgeApi.Services;

namespace ForgeApi.Tests.Services;

public class CsvParserServiceTests
{
    private readonly CsvParserService _svc = new();

    private static MemoryStream ToStream(string csv) =>
        new(Encoding.UTF8.GetBytes(csv));

    [Fact]
    public async Task ParseValidCsv_ReturnsCorrectRecords()
    {
        var csv = "Name,Bank,Account Number,Amount\n" +
                  "John Doe,GTBank,1234567890,50000\n" +
                  "Jane Smith,Access Bank,0987654321,75000.50\n";

        var result = await _svc.ParsePaymentFileAsync(ToStream(csv));

        result.Errors.Should().BeEmpty();
        result.ValidRecords.Should().HaveCount(2);
        result.ValidRecords[0].RecipientName.Should().Be("John Doe");
        result.ValidRecords[0].BankName.Should().Be("GTBank");
        result.ValidRecords[0].AccountNumber.Should().Be("1234567890");
        result.ValidRecords[0].Amount.Should().Be(50000m);
        result.ValidRecords[1].Amount.Should().Be(75000.50m);
    }

    [Fact]
    public async Task ParseCsv_MissingColumns_ReturnsErrors()
    {
        var csv = "Name,Amount\nJohn,5000\n";

        var result = await _svc.ParsePaymentFileAsync(ToStream(csv));

        result.Errors.Should().NotBeEmpty();
        result.Errors.Should().Contain(e => e.Field == "BankName");
        result.Errors.Should().Contain(e => e.Field == "AccountNumber");
    }

    [Fact]
    public async Task ParseCsv_InvalidAmount_ReturnsRowError()
    {
        var csv = "Name,Bank,Account Number,Amount\n" +
                  "John Doe,GTBank,1234567890,not-a-number\n";

        var result = await _svc.ParsePaymentFileAsync(ToStream(csv));

        result.Errors.Should().HaveCount(1);
        result.Errors[0].Field.Should().Be("Amount");
        result.Errors[0].RowNumber.Should().Be(2);
        result.Errors[0].Message.Should().Contain("not a valid number");
    }

    [Fact]
    public async Task ParseCsv_EmptyRows_Skipped()
    {
        var csv = "Name,Bank,Account Number,Amount\n" +
                  "\n" +
                  "John Doe,GTBank,1234567890,50000\n" +
                  "\n" +
                  "Jane Smith,Access Bank,0987654321,75000\n";

        var result = await _svc.ParsePaymentFileAsync(ToStream(csv));

        result.Errors.Should().BeEmpty();
        result.ValidRecords.Should().HaveCount(2);
    }

    [Fact]
    public async Task ParseCsv_ExceedsMaxRows_ReturnsError()
    {
        var sb = new StringBuilder("Name,Bank,Account Number,Amount\n");
        for (int i = 0; i < 10_001; i++)
        {
            sb.AppendLine($"Person{i},Bank{i},123456789{i % 10},{1000 + i}");
        }

        var result = await _svc.ParsePaymentFileAsync(ToStream(sb.ToString()));

        result.Errors.Should().Contain(e => e.Message.Contains("exceeds maximum"));
    }

    [Fact]
    public async Task ParseCsv_QuotedFields_Parsed()
    {
        var csv = "Name,Bank,Account Number,Amount\n" +
                  "\"Doe, John\",\"GT Bank\",1234567890,\"1,500.00\"\n";

        var result = await _svc.ParsePaymentFileAsync(ToStream(csv));

        result.Errors.Should().BeEmpty();
        result.ValidRecords.Should().HaveCount(1);
        result.ValidRecords[0].RecipientName.Should().Be("Doe, John");
        result.ValidRecords[0].BankName.Should().Be("GT Bank");
        result.ValidRecords[0].Amount.Should().Be(1500.00m);
    }
}
