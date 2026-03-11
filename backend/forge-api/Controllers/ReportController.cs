using ForgeApi.DTOs;
using ForgeApi.DTOs.Reports;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ICurrentOrganizationProvider _orgProvider;

    public ReportController(
        IReportService reportService,
        ICurrentOrganizationProvider orgProvider)
    {
        _reportService = reportService;
        _orgProvider = orgProvider;
    }

    /// <summary>
    /// Export batch results as CSV.
    /// </summary>
    [HttpGet("batches/{id:guid}/export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportBatchResults(Guid id)
    {
        var csv = await _reportService.ExportBatchResultsAsync(id, _orgProvider.OrganizationId);
        return File(csv, "text/csv", $"batch-{id}-results.csv");
    }

    /// <summary>
    /// Export transactions as CSV with optional filters.
    /// </summary>
    [HttpGet("transactions/export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportTransactions(
        [FromQuery] string? status,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {
        var csv = await _reportService.ExportTransactionsAsync(
            _orgProvider.OrganizationId, status, dateFrom, dateTo);
        return File(csv, "text/csv", $"transactions-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>
    /// Get summary report with aggregated stats.
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<SummaryReport>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var report = await _reportService.GenerateSummaryReportAsync(
            _orgProvider.OrganizationId, from, to);
        return Ok(ApiResponse<SummaryReport>.Ok(report));
    }
}
