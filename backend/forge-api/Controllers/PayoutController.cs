using ForgeApi.DTOs;
using ForgeApi.DTOs.Transactions;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/payouts")]
[Authorize]
public class PayoutController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private readonly ICurrentOrganizationProvider _orgProvider;

    public PayoutController(ITransactionService transactionService, ICurrentOrganizationProvider orgProvider)
    {
        _transactionService = transactionService;
        _orgProvider = orgProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] TransactionFilterRequest filters)
    {
        var (transactions, totalCount) = await _transactionService.GetTransactionsAsync(_orgProvider.OrganizationId, filters);
        var result = new { data = transactions, page = filters.Page, pageSize = filters.PageSize, totalCount, totalPages = (int)Math.Ceiling((double)totalCount / filters.PageSize) };
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var transaction = await _transactionService.GetTransactionByIdAsync(id, _orgProvider.OrganizationId);
        return Ok(ApiResponse<TransactionDetailResponse>.Ok(transaction));
    }
}
