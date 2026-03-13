using ForgeApi.DTOs;
using ForgeApi.DTOs.Wallet;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IWalletService _walletService;
    private readonly ICurrentOrganizationProvider _orgProvider;

    public WalletController(IWalletService walletService, ICurrentOrganizationProvider orgProvider)
    {
        _walletService = walletService;
        _orgProvider = orgProvider;
    }

    /// <summary>
    /// Get current wallet balance.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<WalletBalanceResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBalance()
    {
        var result = await _walletService.GetBalanceAsync(_orgProvider.OrganizationId);
        return Ok(ApiResponse<WalletBalanceResponse>.Ok(result));
    }

    /// <summary>
    /// Get wallet transaction history with optional filters.
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory([FromQuery] WalletHistoryFilter filter)
    {
        var (items, totalCount) = await _walletService.GetHistoryAsync(_orgProvider.OrganizationId, filter);

        var totalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize);

        return Ok(ApiResponse<object>.Ok(new
        {
            Data = items,
            TotalCount = totalCount,
            TotalPages = totalPages,
            Page = filter.Page,
            PageSize = filter.PageSize
        }));
    }

    /// <summary>
    /// Fund wallet (simulate — in production, this would go through a payment gateway).
    /// </summary>
    [HttpPost("fund")]
    [ProducesResponseType(typeof(ApiResponse<WalletTransactionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Fund([FromBody] FundWalletRequest request)
    {
        if (request.Amount <= 0)
            return BadRequest(ApiResponse.Fail("Amount must be greater than zero."));

        if (request.Amount > 100_000_000)
            return BadRequest(ApiResponse.Fail("Maximum single funding amount is ₦100,000,000."));

        var reference = $"FUND-{Guid.NewGuid():N}"[..24];
        var walletTx = await _walletService.CreditAsync(
            _orgProvider.OrganizationId,
            request.Amount,
            reference,
            $"Wallet funding of {request.Amount:N2} NGN");

        return Ok(ApiResponse<WalletTransactionResponse>.Ok(
            new WalletTransactionResponse
            {
                Id = walletTx.Id,
                Type = walletTx.Type,
                Amount = walletTx.Amount,
                Reference = walletTx.Reference,
                Description = walletTx.Description,
                BalanceBefore = walletTx.BalanceBefore,
                BalanceAfter = walletTx.BalanceAfter,
                CreatedAt = walletTx.CreatedAt
            },
            "Wallet funded successfully."));
    }
}
