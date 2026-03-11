using ForgeApi.DTOs;
using ForgeApi.DTOs.Banks;
using ForgeApi.DTOs.Normalization;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/banks")]
[Authorize]
public class BankController : ControllerBase
{
    private readonly IBankService _bankService;
    private readonly IBankNormalizationClient _normalizationClient;

    public BankController(IBankService bankService, IBankNormalizationClient normalizationClient)
    {
        _bankService = bankService;
        _normalizationClient = normalizationClient;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<BankListResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var banks = await _bankService.GetAllBanksAsync();
        return Ok(ApiResponse<IEnumerable<BankListResponse>>.Ok(banks));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BankDetailResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id)
    {
        var bank = await _bankService.GetBankByIdAsync(id);
        return Ok(ApiResponse<BankDetailResponse>.Ok(bank));
    }

    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<BankListResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string query)
    {
        var banks = await _bankService.SearchBanksAsync(query);
        return Ok(ApiResponse<IEnumerable<BankListResponse>>.Ok(banks));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BankDetailResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateBankRequest request)
    {
        var bank = await _bankService.CreateBankAsync(request);
        return StatusCode(201, ApiResponse<BankDetailResponse>.Ok(bank, "Bank created."));
    }

    [HttpPost("{id:guid}/aliases")]
    [ProducesResponseType(typeof(ApiResponse<BankAliasResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddAlias(Guid id, [FromBody] AddBankAliasRequest request)
    {
        var alias = await _bankService.AddAliasAsync(id, request);
        return StatusCode(201, ApiResponse<BankAliasResponse>.Ok(alias, "Alias added."));
    }

    [HttpPost("normalize")]
    [ProducesResponseType(typeof(ApiResponse<NormalizationResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Normalize([FromBody] NormalizeBankRequest request)
    {
        var result = await _normalizationClient.NormalizeBankNameAsync(request.BankName);
        return Ok(ApiResponse<NormalizationResult>.Ok(result));
    }

    [HttpPost("normalize-batch")]
    [ProducesResponseType(typeof(ApiResponse<List<NormalizationResult>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> NormalizeBatch([FromBody] NormalizeBatchBankRequest request)
    {
        var results = await _normalizationClient.NormalizeBankNamesAsync(request.BankNames);
        return Ok(ApiResponse<List<NormalizationResult>>.Ok(results));
    }
}
