using System.Security.Claims;
using ForgeApi.DTOs.Payouts;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/payouts")]
[Authorize]
public class PayoutController : ControllerBase
{
    private readonly IPayoutService _payoutService;

    public PayoutController(IPayoutService payoutService)
    {
        _payoutService = payoutService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(PayoutResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PayoutResponse>> Create([FromBody] CreatePayoutRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var payout = await _payoutService.CreatePayoutAsync(userId, request);
            return CreatedAtAction(nameof(Create), new { id = payout.Id }, payout);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PayoutResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<PayoutResponse>>> GetAll()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var payouts = await _payoutService.GetPayoutsAsync(userId);
        return Ok(payouts);
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
