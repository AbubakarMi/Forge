using ForgeApi.DTOs;
using ForgeApi.DTOs.V1;
using ForgeApi.DTOs.Transactions;
using ForgeApi.DTOs.PayoutBatches;
using ForgeApi.Jobs;
using ForgeApi.Services;
using ForgeApi.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers.V1;

[ApiController]
[Route("api/v1")]
[Authorize]
public class DeveloperApiController : ControllerBase
{
    private readonly IPayoutBatchService _batchService;
    private readonly ITransactionService _transactionService;
    private readonly IBankService _bankService;
    private readonly IBankNormalizationClient _normalizationClient;
    private readonly ICurrentOrganizationProvider _orgProvider;
    private readonly ITransactionProcessingService _processingService;
    private readonly BatchProcessingQueue _batchQueue;

    public DeveloperApiController(
        IPayoutBatchService batchService,
        ITransactionService transactionService,
        IBankService bankService,
        IBankNormalizationClient normalizationClient,
        ICurrentOrganizationProvider orgProvider,
        ITransactionProcessingService processingService,
        BatchProcessingQueue batchQueue)
    {
        _batchService = batchService;
        _transactionService = transactionService;
        _bankService = bankService;
        _normalizationClient = normalizationClient;
        _orgProvider = orgProvider;
        _processingService = processingService;
        _batchQueue = batchQueue;
    }

    /// <summary>
    /// Create a payout batch from JSON payment items.
    /// </summary>
    [HttpPost("payout-batches")]
    public async Task<IActionResult> CreateBatch([FromBody] V1CreateBatchRequest request)
    {
        var csvContent = "RecipientName,BankName,AccountNumber,Amount\n" +
            string.Join("\n", request.Payments.Select(p =>
                $"{EscapeCsv(p.RecipientName)},{EscapeCsv(p.BankName)},{p.AccountNumber},{p.Amount}"));

        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(csvContent));
        var result = await _batchService.CreateBatchFromFileAsync(
            stream,
            $"api-batch-{DateTime.UtcNow:yyyyMMddHHmmss}.csv",
            _orgProvider.OrganizationId,
            _orgProvider.UserId);

        await _batchQueue.EnqueueAsync(result.BatchId);

        var response = new V1BatchResponse
        {
            Id = result.BatchId,
            TotalRecords = result.TotalRecords,
            ValidRecords = result.ValidRecords,
            InvalidRecords = result.InvalidRecords,
            TotalAmount = result.TotalAmount,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            Errors = result.Errors.Select(e => new V1ValidationError
            {
                Row = e.RowNumber,
                Field = e.Field,
                Message = e.Message
            }).ToList()
        };

        return StatusCode(201, ApiResponse<V1BatchResponse>.Ok(response, "Batch created and queued for processing."));
    }

    /// <summary>
    /// Create a single payout (wrapped as a 1-item batch).
    /// </summary>
    [HttpPost("payouts")]
    public async Task<IActionResult> CreatePayout([FromBody] V1CreatePayoutRequest request)
    {
        var batchRequest = new V1CreateBatchRequest
        {
            Payments = new List<V1PaymentItem>
            {
                new V1PaymentItem
                {
                    RecipientName = request.RecipientName,
                    BankName = request.BankName,
                    AccountNumber = request.AccountNumber,
                    Amount = request.Amount
                }
            }
        };

        return await CreateBatch(batchRequest);
    }

    /// <summary>
    /// Get batch status by ID.
    /// </summary>
    [HttpGet("payout-batches/{id:guid}")]
    public async Task<IActionResult> GetBatch(Guid id)
    {
        var detail = await _batchService.GetBatchDetailAsync(id, _orgProvider.OrganizationId);

        var response = new V1BatchResponse
        {
            Id = detail.Id,
            TotalRecords = detail.TotalRecords,
            ValidRecords = detail.SuccessCount + detail.PendingCount,
            InvalidRecords = detail.FailedCount,
            TotalAmount = detail.TotalAmount,
            Status = detail.Status,
            CreatedAt = detail.CreatedAt
        };

        return Ok(ApiResponse<V1BatchResponse>.Ok(response));
    }

    /// <summary>
    /// Get transactions for a specific batch.
    /// </summary>
    [HttpGet("payout-batches/{id:guid}/transactions")]
    public async Task<IActionResult> GetBatchTransactions(Guid id)
    {
        var detail = await _batchService.GetBatchDetailAsync(id, _orgProvider.OrganizationId);

        var transactions = detail.Transactions.Select(t => new V1TransactionResponse
        {
            Id = t.Id,
            RecipientName = t.RecipientName,
            BankName = t.RawBankName,
            NormalizedBankName = t.NormalizedBankName,
            AccountNumber = DataMasking.MaskAccountNumber(t.AccountNumber),
            Amount = t.Amount,
            Currency = t.Currency,
            Status = t.Status,
            FailureReason = t.FailureReason,
            CreatedAt = t.CreatedAt,
            ProcessedAt = t.ProcessedAt
        }).ToList();

        return Ok(ApiResponse<List<V1TransactionResponse>>.Ok(transactions));
    }

    /// <summary>
    /// List transactions with optional filters.
    /// </summary>
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filters = new TransactionFilterRequest
        {
            Status = status,
            Page = page,
            PageSize = pageSize
        };

        var (transactions, totalCount) = await _transactionService.GetTransactionsAsync(
            _orgProvider.OrganizationId, filters);

        var response = transactions.Select(t => new V1TransactionResponse
        {
            Id = t.Id,
            RecipientName = t.RecipientName,
            BankName = t.RawBankName,
            NormalizedBankName = t.NormalizedBankName,
            AccountNumber = t.AccountNumber,
            Amount = t.Amount,
            Currency = t.Currency,
            Status = t.Status,
            FailureReason = t.FailureReason,
            CreatedAt = t.CreatedAt,
            ProcessedAt = t.ProcessedAt
        }).ToList();

        return Ok(ApiResponse<object>.Ok(new
        {
            transactions = response,
            totalCount,
            page,
            pageSize
        }));
    }

    /// <summary>
    /// Get a single transaction by ID.
    /// </summary>
    [HttpGet("transactions/{id:guid}")]
    public async Task<IActionResult> GetTransaction(Guid id)
    {
        var detail = await _transactionService.GetTransactionByIdAsync(id, _orgProvider.OrganizationId);

        var response = new V1TransactionResponse
        {
            Id = detail.Id,
            RecipientName = detail.RecipientName,
            BankName = detail.RawBankName,
            NormalizedBankName = detail.NormalizedBankName,
            AccountNumber = detail.AccountNumber,
            Amount = detail.Amount,
            Currency = detail.Currency,
            Status = detail.Status,
            FailureReason = detail.FailureReason,
            CreatedAt = detail.CreatedAt,
            ProcessedAt = detail.ProcessedAt
        };

        return Ok(ApiResponse<V1TransactionResponse>.Ok(response));
    }

    /// <summary>
    /// List all active banks.
    /// </summary>
    [HttpGet("banks")]
    public async Task<IActionResult> GetBanks()
    {
        var banks = await _bankService.GetAllBanksAsync();

        var response = banks.Select(b => new V1BankResponse
        {
            Name = b.Name,
            Code = b.Code,
            Country = b.Country
        }).ToList();

        return Ok(ApiResponse<List<V1BankResponse>>.Ok(response));
    }

    /// <summary>
    /// Normalize a bank name.
    /// </summary>
    [HttpGet("banks/normalize")]
    public async Task<IActionResult> NormalizeBankName([FromQuery] string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(ApiResponse.Fail("Query parameter 'name' is required."));

        var result = await _normalizationClient.NormalizeBankNameAsync(name);

        var response = new V1NormalizeResponse
        {
            NormalizedName = result.NormalizedBank,
            BankCode = result.BankCode,
            Confidence = result.Confidence,
            OriginalInput = result.OriginalInput,
            MatchType = result.MatchType
        };

        return Ok(ApiResponse<V1NormalizeResponse>.Ok(response));
    }

    private static string EscapeCsv(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
