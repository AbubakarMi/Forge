using ForgeApi.DTOs;
using ForgeApi.Services;
using ForgeApi.Services.PaymentProviders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize]
public class AccountVerificationController : ControllerBase
{
    private readonly IAccountVerificationService _verificationService;

    public AccountVerificationController(IAccountVerificationService verificationService)
    {
        _verificationService = verificationService;
    }

    /// <summary>
    /// Verify a bank account number and retrieve the account holder's name.
    /// </summary>
    [HttpGet("verify")]
    [ProducesResponseType(typeof(ApiResponse<AccountVerificationResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Verify([FromQuery] string accountNumber, [FromQuery] string bankCode)
    {
        if (string.IsNullOrWhiteSpace(accountNumber) || string.IsNullOrWhiteSpace(bankCode))
            return BadRequest(ApiResponse.Fail("Both accountNumber and bankCode are required."));

        var result = await _verificationService.VerifyAsync(accountNumber, bankCode);
        return Ok(ApiResponse<AccountVerificationResult>.Ok(result));
    }
}
