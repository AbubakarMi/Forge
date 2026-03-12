using ForgeApi.DTOs;
using ForgeApi.DTOs.PayoutBatches;
using ForgeApi.Jobs;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/payout-batches")]
[Authorize]
public class PayoutBatchController : ControllerBase
{
    private readonly IPayoutBatchService _batchService;
    private readonly ICurrentOrganizationProvider _orgProvider;
    private readonly BatchProcessingQueue _batchQueue;

    public PayoutBatchController(
        IPayoutBatchService batchService,
        ICurrentOrganizationProvider orgProvider,
        BatchProcessingQueue batchQueue)
    {
        _batchService = batchService;
        _orgProvider = orgProvider;
        _batchQueue = batchQueue;
    }

    /// <summary>
    /// Upload a CSV file to create a new payout batch.
    /// </summary>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(ApiResponse<CreateBatchFromFileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse.Fail("File is required and must not be empty."));

        if (file.Length > 10 * 1024 * 1024) // 10 MB
            return BadRequest(ApiResponse.Fail("File size must not exceed 10 MB."));

        var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
        if (extension != ".csv")
            return BadRequest(ApiResponse.Fail("Only CSV files (.csv) are allowed."));

        using var stream = file.OpenReadStream();
        var result = await _batchService.CreateBatchFromFileAsync(
            stream,
            file.FileName,
            _orgProvider.OrganizationId,
            _orgProvider.UserId);

        // Enqueue batch for background processing
        await _batchQueue.EnqueueAsync(result.BatchId);

        return Ok(ApiResponse<CreateBatchFromFileResponse>.Ok(result, "Batch created successfully."));
    }

    /// <summary>
    /// List payout batches with optional filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<PayoutBatchResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBatches([FromQuery] BatchFilterRequest filters)
    {
        var (batches, totalCount) = await _batchService.GetBatchesAsync(
            _orgProvider.OrganizationId, filters);

        var totalPages = (int)Math.Ceiling((double)totalCount / filters.PageSize);

        var result = new
        {
            Data = batches,
            TotalCount = totalCount,
            TotalPages = totalPages,
            Page = filters.Page,
            PageSize = filters.PageSize
        };

        return Ok(ApiResponse<object>.Ok(result));
    }

    /// <summary>
    /// Get batch detail including transactions.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PayoutBatchDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBatchDetail(Guid id)
    {
        var result = await _batchService.GetBatchDetailAsync(id, _orgProvider.OrganizationId);
        return Ok(ApiResponse<PayoutBatchDetailResponse>.Ok(result));
    }

    /// <summary>
    /// Get batch summary with amount breakdowns.
    /// </summary>
    [HttpGet("{id:guid}/summary")]
    [ProducesResponseType(typeof(ApiResponse<PayoutBatchSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBatchSummary(Guid id)
    {
        var result = await _batchService.GetBatchSummaryAsync(id, _orgProvider.OrganizationId);
        return Ok(ApiResponse<PayoutBatchSummaryResponse>.Ok(result));
    }

    /// <summary>
    /// Retry failed transactions in a batch.
    /// </summary>
    [HttpPost("{id:guid}/retry")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RetryFailed(Guid id)
    {
        await _batchService.RetryFailedTransactionsAsync(
            id, _orgProvider.OrganizationId, _orgProvider.UserId);
        return Ok(ApiResponse.Ok(message: "Failed transactions queued for retry."));
    }

    /// <summary>
    /// Confirm duplicate-flagged transactions as not duplicates and re-queue them.
    /// </summary>
    [HttpPost("{id:guid}/confirm-duplicates")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmDuplicates(Guid id)
    {
        var count = await _batchService.ConfirmDuplicatesAsync(
            id, _orgProvider.OrganizationId, _orgProvider.UserId);

        // Re-enqueue batch for processing
        await _batchQueue.EnqueueAsync(id);

        return Ok(ApiResponse<object>.Ok(
            new { confirmedCount = count },
            $"{count} duplicate-flagged transaction(s) confirmed and re-queued."));
    }

    /// <summary>
    /// Cancel a pending batch.
    /// </summary>
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelBatch(Guid id)
    {
        await _batchService.CancelBatchAsync(
            id, _orgProvider.OrganizationId, _orgProvider.UserId);
        return Ok(ApiResponse.Ok(message: "Batch cancelled successfully."));
    }
}
