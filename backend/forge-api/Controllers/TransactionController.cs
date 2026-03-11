using ForgeApi.DTOs;
using ForgeApi.DTOs.Transactions;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private readonly ICurrentOrganizationProvider _orgProvider;

    public TransactionController(
        ITransactionService transactionService,
        ICurrentOrganizationProvider orgProvider)
    {
        _transactionService = transactionService;
        _orgProvider = orgProvider;
    }

    /// <summary>
    /// List transactions with filters, paginated.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] TransactionFilterRequest filters)
    {
        var (transactions, totalCount) = await _transactionService.GetTransactionsAsync(
            _orgProvider.OrganizationId, filters);

        var result = new
        {
            data = transactions,
            page = filters.Page,
            pageSize = filters.PageSize,
            totalCount,
            totalPages = (int)Math.Ceiling((double)totalCount / filters.PageSize)
        };

        return Ok(ApiResponse<object>.Ok(result));
    }

    /// <summary>
    /// Get transaction detail by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TransactionDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var transaction = await _transactionService.GetTransactionByIdAsync(
            id, _orgProvider.OrganizationId);

        return Ok(ApiResponse<TransactionDetailResponse>.Ok(transaction));
    }

    /// <summary>
    /// Get organization transaction statistics.
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<TransactionStatsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _transactionService.GetTransactionStatsAsync(
            _orgProvider.OrganizationId);

        return Ok(ApiResponse<TransactionStatsResponse>.Ok(stats));
    }
}
