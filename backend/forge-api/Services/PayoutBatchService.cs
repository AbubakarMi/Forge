using ForgeApi.Configurations;
using ForgeApi.Data;
using ForgeApi.DTOs.PayoutBatches;
using ForgeApi.Exceptions;
using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ForgeApi.Services;

public interface IPayoutBatchService
{
    Task<CreateBatchFromFileResponse> CreateBatchFromFileAsync(Stream file, string fileName, Guid orgId, Guid userId);
    Task ConfirmBatchAsync(Guid batchId, ConfirmBatchRequest request, Guid orgId, Guid userId);
    Task<UpdateTransactionResponse> UpdateTransactionAsync(Guid batchId, Guid transactionId, UpdateTransactionRequest request, Guid orgId);
    Task<ReuploadFailedResponse> ReuploadFailedAsync(Guid batchId, Stream file, string fileName, Guid orgId, Guid userId);
    Task<AddRecipientsToBatchResponse> AddRecipientsAsync(Guid batchId, Stream file, string fileName, Guid orgId, Guid userId);
    Task<(List<PayoutBatchResponse> Batches, int TotalCount)> GetBatchesAsync(Guid orgId, BatchFilterRequest filters);
    Task<PayoutBatchDetailResponse> GetBatchDetailAsync(Guid batchId, Guid orgId);
    Task<PayoutBatchSummaryResponse> GetBatchSummaryAsync(Guid batchId, Guid orgId);
    Task RetryFailedTransactionsAsync(Guid batchId, Guid orgId, Guid userId);
    Task<int> ConfirmDuplicatesAsync(Guid batchId, Guid orgId, Guid userId);
    Task CancelBatchAsync(Guid batchId, Guid orgId, Guid userId);
}

public class PayoutBatchService : IPayoutBatchService
{
    private readonly AppDbContext _context;
    private readonly ICsvParserService _csvParser;
    private readonly IBankNormalizationClient _bankNormalization;
    private readonly ITransactionValidationService _transactionValidation;
    private readonly IAuditService _audit;
    private readonly TransactionLimits _limits;
    private readonly ILogger<PayoutBatchService> _logger;

    public PayoutBatchService(
        AppDbContext context,
        ICsvParserService csvParser,
        IBankNormalizationClient bankNormalization,
        ITransactionValidationService transactionValidation,
        IAuditService audit,
        IOptions<TransactionLimits> limits,
        ILogger<PayoutBatchService> logger)
    {
        _context = context;
        _csvParser = csvParser;
        _bankNormalization = bankNormalization;
        _transactionValidation = transactionValidation;
        _audit = audit;
        _limits = limits.Value;
        _logger = logger;
    }

    public async Task<CreateBatchFromFileResponse> CreateBatchFromFileAsync(
        Stream file, string fileName, Guid orgId, Guid userId)
    {
        // 1. Parse CSV
        var parseResult = await _csvParser.ParsePaymentFileAsync(file);
        var errors = new List<BatchValidationError>(parseResult.Errors);

        // 2. Process each valid record
        var transactions = new List<Transaction>();
        var totalAmount = 0m;

        // Batch-normalize all bank names at once for efficiency
        var bankNames = parseResult.ValidRecords.Select(r => r.BankName).Distinct().ToList();
        var normalizationResults = bankNames.Count > 0
            ? await _bankNormalization.NormalizeBankNamesAsync(bankNames)
            : new List<DTOs.Normalization.NormalizationResult>();

        var normalizationMap = new Dictionary<string, DTOs.Normalization.NormalizationResult>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < bankNames.Count; i++)
        {
            normalizationMap[bankNames[i]] = normalizationResults[i];
        }

        // Look up bank IDs by code
        var bankCodes = normalizationResults
            .Where(n => n.BankCode != null)
            .Select(n => n.BankCode!)
            .Distinct()
            .ToList();

        var banksById = new Dictionary<string, Bank>(StringComparer.OrdinalIgnoreCase);
        if (bankCodes.Count > 0)
        {
            var banks = await _context.Banks
                .Where(b => bankCodes.Contains(b.Code))
                .ToListAsync();
            foreach (var bank in banks)
                banksById[bank.Code] = bank;
        }

        for (var i = 0; i < parseResult.ValidRecords.Count; i++)
        {
            var record = parseResult.ValidRecords[i];
            // Row number offset: header (row 1) + any error rows that came before + current index
            // We approximate row number from the parse — errors already have their own row numbers
            // For valid records, we track them sequentially after header
            var rowNumber = i + 2; // approximate; header is row 1

            var rowErrors = new List<BatchValidationError>();

            // Normalize bank name
            var normResult = normalizationMap.GetValueOrDefault(record.BankName);
            Guid? bankId = null;
            string? normalizedBankName = normResult?.NormalizedBank;
            decimal? confidence = normResult?.Confidence;

            if (normResult?.BankCode != null && banksById.TryGetValue(normResult.BankCode, out var bank))
            {
                bankId = bank.Id;
            }

            // Validate amount
            var amountErrors = _transactionValidation.ValidateAmount(record.Amount);
            foreach (var err in amountErrors)
            {
                rowErrors.Add(new BatchValidationError
                {
                    RowNumber = rowNumber,
                    Field = "Amount",
                    Message = err
                });
            }

            // Validate account number (NUBAN)
            var accountErrors = _transactionValidation.ValidateAccountNumber(
                record.AccountNumber, normResult?.BankCode);
            foreach (var err in accountErrors)
            {
                rowErrors.Add(new BatchValidationError
                {
                    RowNumber = rowNumber,
                    Field = "AccountNumber",
                    Message = err
                });
            }

            // Check duplicates
            var isDuplicate = await _transactionValidation.IsDuplicateAsync(
                record.AccountNumber, bankId, record.Amount, orgId);
            if (isDuplicate)
            {
                rowErrors.Add(new BatchValidationError
                {
                    RowNumber = rowNumber,
                    Field = "Transaction",
                    Message = "Potential duplicate transaction detected."
                });
            }

            if (rowErrors.Count > 0)
            {
                errors.AddRange(rowErrors);
            }

            // Create the transaction regardless of row-level validation errors
            var status = rowErrors.Count > 0 ? "failed" : "pending";
            var failureReason = rowErrors.Count > 0
                ? string.Join("; ", rowErrors.Select(e => e.Message))
                : null;

            var transaction = new Transaction
            {
                OrganizationId = orgId,
                RecipientName = record.RecipientName,
                RawBankName = record.BankName,
                NormalizedBankName = normalizedBankName,
                AccountNumber = record.AccountNumber,
                Amount = record.Amount,
                BankId = bankId,
                NormalizationConfidence = confidence,
                Status = status,
                FailureReason = failureReason
            };

            transactions.Add(transaction);

            if (status == "pending")
                totalAmount += record.Amount;
        }

        // 3. Create batch + transactions in a single DB transaction
        var pendingCount = transactions.Count(t => t.Status == "pending");
        var failedCount = transactions.Count(t => t.Status == "failed");

        var batch = new PayoutBatch
        {
            OrganizationId = orgId,
            CreatedByUserId = userId,
            FileName = fileName,
            TotalRecords = transactions.Count,
            TotalAmount = totalAmount,
            PendingCount = pendingCount,
            FailedCount = failedCount,
            Status = "draft"
        };

        await using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.PayoutBatches.Add(batch);
            await _context.SaveChangesAsync();

            foreach (var tx in transactions)
            {
                tx.PayoutBatchId = batch.Id;
            }

            _context.Transactions.AddRange(transactions);
            await _context.SaveChangesAsync();

            await dbTransaction.CommitAsync();
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }

        // 4. Audit log
        await _audit.LogAsync(
            "batch.created",
            "PayoutBatch",
            batch.Id.ToString(),
            userId,
            orgId,
            details: $"File: {fileName}, Records: {transactions.Count}, Amount: {totalAmount:N2}");

        // 5. Return response
        return new CreateBatchFromFileResponse
        {
            BatchId = batch.Id,
            FileName = fileName,
            TotalRecords = transactions.Count,
            ValidRecords = pendingCount,
            InvalidRecords = failedCount,
            TotalAmount = totalAmount,
            Errors = errors
        };
    }

    public async Task ConfirmBatchAsync(Guid batchId, ConfirmBatchRequest request, Guid orgId, Guid userId)
    {
        var batch = await _context.PayoutBatches
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException($"Batch '{batchId}' not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException();

        if (batch.Status != "draft")
            throw new AppValidationException("Only draft batches can be confirmed.");

        // Validate batch name is not empty
        if (string.IsNullOrWhiteSpace(request.BatchName))
            throw new AppValidationException("Batch name is required.");

        var batchName = request.BatchName.Trim();

        // Check for duplicate batch name within the org
        var duplicate = await _context.PayoutBatches
            .AnyAsync(b => b.OrganizationId == orgId
                        && b.BatchName == batchName
                        && b.Id != batchId
                        && b.Status != "draft");

        if (duplicate)
            throw new AppValidationException($"A batch named '{batchName}' already exists. Please choose a different name.");

        batch.BatchName = batchName;
        batch.PaymentType = request.PaymentType ?? "immediate";

        if (batch.PaymentType == "scheduled" && request.ScheduledAt.HasValue)
        {
            batch.ScheduledAt = request.ScheduledAt.Value.ToUniversalTime();
            batch.Status = "scheduled";
        }
        else if (batch.PaymentType == "recurring" && !string.IsNullOrWhiteSpace(request.RecurringInterval))
        {
            batch.IsRecurring = true;
            batch.RecurringInterval = request.RecurringInterval;
            if (request.ScheduledAt.HasValue)
            {
                batch.ScheduledAt = request.ScheduledAt.Value.ToUniversalTime();
                batch.NextRunAt = request.ScheduledAt.Value.ToUniversalTime();
                batch.Status = "scheduled";
            }
            else
            {
                batch.NextRunAt = DateTime.UtcNow;
                batch.Status = "pending";
            }
        }
        else
        {
            batch.Status = "pending";
        }

        await _context.SaveChangesAsync();

        await _audit.LogAsync(
            "batch.confirmed",
            "PayoutBatch",
            batch.Id.ToString(),
            userId,
            orgId,
            details: $"Batch confirmed with name: {batchName}, type: {batch.PaymentType}");
    }

    public async Task<UpdateTransactionResponse> UpdateTransactionAsync(
        Guid batchId, Guid transactionId, UpdateTransactionRequest request, Guid orgId)
    {
        var batch = await _context.PayoutBatches
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException($"Batch '{batchId}' not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException();

        if (batch.Status != "draft")
            throw new AppValidationException("Can only edit transactions in draft batches.");

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.PayoutBatchId == batchId)
            ?? throw new NotFoundException($"Transaction '{transactionId}' not found.");

        var wasFailed = transaction.Status == "failed";
        var oldAmount = transaction.Amount;

        // Update fields
        transaction.RecipientName = request.RecipientName.Trim();
        transaction.RawBankName = request.BankName.Trim();
        transaction.AccountNumber = request.AccountNumber.Trim();
        transaction.Amount = request.Amount;

        // Re-normalize bank name
        var normResults = await _bankNormalization.NormalizeBankNamesAsync(new List<string> { request.BankName.Trim() });
        var normResult = normResults.FirstOrDefault();
        transaction.NormalizedBankName = normResult?.NormalizedBank;
        transaction.NormalizationConfidence = normResult?.Confidence;

        Guid? bankId = null;
        if (normResult?.BankCode != null)
        {
            var bank = await _context.Banks.FirstOrDefaultAsync(b => b.Code == normResult.BankCode);
            if (bank != null) bankId = bank.Id;
        }
        transaction.BankId = bankId;

        // Re-validate
        var errors = new List<string>();
        errors.AddRange(_transactionValidation.ValidateAmount(request.Amount));
        errors.AddRange(_transactionValidation.ValidateAccountNumber(
            request.AccountNumber.Trim(), normResult?.BankCode));

        if (errors.Count > 0)
        {
            transaction.Status = "failed";
            transaction.FailureReason = string.Join("; ", errors);
        }
        else
        {
            transaction.Status = "pending";
            transaction.FailureReason = null;
        }

        // Update batch counters
        if (wasFailed && transaction.Status == "pending")
        {
            batch.FailedCount--;
            batch.PendingCount++;
            batch.TotalAmount += transaction.Amount;
            if (oldAmount > 0) batch.TotalAmount -= 0; // failed records weren't counted in TotalAmount
        }
        else if (!wasFailed && transaction.Status == "failed")
        {
            batch.PendingCount--;
            batch.FailedCount++;
            batch.TotalAmount -= oldAmount;
        }
        else if (wasFailed && transaction.Status == "failed")
        {
            // Still failed, no counter change
        }
        else
        {
            // Was pending, still pending — update amount difference
            batch.TotalAmount += (transaction.Amount - oldAmount);
        }

        await _context.SaveChangesAsync();

        return new UpdateTransactionResponse
        {
            Id = transaction.Id,
            Status = transaction.Status,
            FailureReason = transaction.FailureReason,
            NormalizedBankName = transaction.NormalizedBankName,
            NormalizationConfidence = transaction.NormalizationConfidence
        };
    }

    public async Task<ReuploadFailedResponse> ReuploadFailedAsync(
        Guid batchId, Stream file, string fileName, Guid orgId, Guid userId)
    {
        var batch = await _context.PayoutBatches
            .Include(b => b.Transactions)
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException($"Batch '{batchId}' not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException();

        if (batch.Status != "draft")
            throw new AppValidationException("Can only re-upload failed records for draft batches.");

        // Remove all existing failed transactions
        var failedTxns = batch.Transactions.Where(t => t.Status == "failed").ToList();
        _context.Transactions.RemoveRange(failedTxns);

        // Parse new CSV
        var parseResult = await _csvParser.ParsePaymentFileAsync(file);
        var errors = new List<BatchValidationError>(parseResult.Errors);

        // Normalize bank names
        var bankNames = parseResult.ValidRecords.Select(r => r.BankName).Distinct().ToList();
        var normalizationResults = bankNames.Count > 0
            ? await _bankNormalization.NormalizeBankNamesAsync(bankNames)
            : new List<DTOs.Normalization.NormalizationResult>();

        var normMap = new Dictionary<string, DTOs.Normalization.NormalizationResult>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < bankNames.Count; i++)
            normMap[bankNames[i]] = normalizationResults[i];

        var bankCodes = normalizationResults.Where(n => n.BankCode != null).Select(n => n.BankCode!).Distinct().ToList();
        var banksById = new Dictionary<string, Models.Bank>(StringComparer.OrdinalIgnoreCase);
        if (bankCodes.Count > 0)
        {
            var banks = await _context.Banks.Where(b => bankCodes.Contains(b.Code)).ToListAsync();
            foreach (var bank in banks) banksById[bank.Code] = bank;
        }

        var newTransactions = new List<Transaction>();
        var newValidAmount = 0m;

        for (var i = 0; i < parseResult.ValidRecords.Count; i++)
        {
            var record = parseResult.ValidRecords[i];
            var rowNumber = i + 2;
            var rowErrors = new List<BatchValidationError>();

            var normResult = normMap.GetValueOrDefault(record.BankName);
            Guid? bankId = null;
            if (normResult?.BankCode != null && banksById.TryGetValue(normResult.BankCode, out var bank))
                bankId = bank.Id;

            var amountErrors = _transactionValidation.ValidateAmount(record.Amount);
            foreach (var err in amountErrors)
                rowErrors.Add(new BatchValidationError { RowNumber = rowNumber, Field = "Amount", Message = err });

            var accountErrors = _transactionValidation.ValidateAccountNumber(record.AccountNumber, normResult?.BankCode);
            foreach (var err in accountErrors)
                rowErrors.Add(new BatchValidationError { RowNumber = rowNumber, Field = "AccountNumber", Message = err });

            if (rowErrors.Count > 0) errors.AddRange(rowErrors);

            var status = rowErrors.Count > 0 ? "failed" : "pending";
            var failureReason = rowErrors.Count > 0 ? string.Join("; ", rowErrors.Select(e => e.Message)) : null;

            newTransactions.Add(new Transaction
            {
                PayoutBatchId = batch.Id,
                OrganizationId = orgId,
                RecipientName = record.RecipientName,
                RawBankName = record.BankName,
                NormalizedBankName = normResult?.NormalizedBank,
                AccountNumber = record.AccountNumber,
                Amount = record.Amount,
                BankId = bankId,
                NormalizationConfidence = normResult?.Confidence,
                Status = status,
                FailureReason = failureReason
            });

            if (status == "pending") newValidAmount += record.Amount;
        }

        _context.Transactions.AddRange(newTransactions);

        // Recalculate batch counters from scratch
        var existingPending = batch.Transactions.Where(t => t.Status == "pending").ToList();
        var newPendingCount = newTransactions.Count(t => t.Status == "pending");
        var newFailedCount = newTransactions.Count(t => t.Status == "failed");
        var existingPendingAmount = existingPending.Sum(t => t.Amount);

        batch.TotalRecords = existingPending.Count + newTransactions.Count;
        batch.TotalAmount = existingPendingAmount + newValidAmount;
        batch.PendingCount = existingPending.Count + newPendingCount;
        batch.FailedCount = newFailedCount;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(
            "batch.failed_reuploaded",
            "PayoutBatch",
            batch.Id.ToString(),
            userId,
            orgId,
            details: $"Re-uploaded failed records from {fileName}. Replaced {failedTxns.Count} with {newTransactions.Count} records.");

        return new ReuploadFailedResponse
        {
            ReplacedCount = failedTxns.Count,
            StillFailedCount = newFailedCount,
            NewValidCount = newPendingCount,
            TotalAmount = batch.TotalAmount,
            Errors = errors
        };
    }

    public async Task<(List<PayoutBatchResponse> Batches, int TotalCount)> GetBatchesAsync(
        Guid orgId, BatchFilterRequest filters)
    {
        var query = _context.PayoutBatches
            .Where(b => b.OrganizationId == orgId && b.Status != "draft");

        if (!string.IsNullOrWhiteSpace(filters.Status))
            query = query.Where(b => b.Status == filters.Status);

        if (!string.IsNullOrWhiteSpace(filters.FileName))
            query = query.Where(b => b.FileName.Contains(filters.FileName)
                || (b.BatchName != null && b.BatchName.Contains(filters.FileName)));

        if (filters.From.HasValue)
            query = query.Where(b => b.CreatedAt >= filters.From.Value);

        if (filters.To.HasValue)
            query = query.Where(b => b.CreatedAt <= filters.To.Value);

        var totalCount = await query.CountAsync();

        var batches = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .Select(b => new PayoutBatchResponse
            {
                Id = b.Id,
                FileName = b.FileName,
                BatchName = b.BatchName,
                TotalRecords = b.TotalRecords,
                TotalAmount = b.TotalAmount,
                Status = b.Status,
                SuccessCount = b.SuccessCount,
                FailedCount = b.FailedCount,
                PendingCount = b.PendingCount,
                PaymentType = b.PaymentType,
                ScheduledAt = b.ScheduledAt,
                IsRecurring = b.IsRecurring,
                RecurringInterval = b.RecurringInterval,
                NextRunAt = b.NextRunAt,
                CreatedAt = b.CreatedAt,
                CompletedAt = b.CompletedAt
            })
            .ToListAsync();

        return (batches, totalCount);
    }

    public async Task<PayoutBatchDetailResponse> GetBatchDetailAsync(Guid batchId, Guid orgId)
    {
        var batch = await _context.PayoutBatches
            .Include(b => b.Transactions)
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException($"Batch '{batchId}' not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException();

        return new PayoutBatchDetailResponse
        {
            Id = batch.Id,
            FileName = batch.FileName,
            BatchName = batch.BatchName,
            TotalRecords = batch.TotalRecords,
            TotalAmount = batch.TotalAmount,
            Status = batch.Status,
            SuccessCount = batch.SuccessCount,
            FailedCount = batch.FailedCount,
            PendingCount = batch.PendingCount,
            PaymentType = batch.PaymentType,
            ScheduledAt = batch.ScheduledAt,
            IsRecurring = batch.IsRecurring,
            RecurringInterval = batch.RecurringInterval,
            NextRunAt = batch.NextRunAt,
            CreatedAt = batch.CreatedAt,
            CompletedAt = batch.CompletedAt,
            Transactions = batch.Transactions.Select(t => new DTOs.PayoutBatches.TransactionResponse
            {
                Id = t.Id,
                RecipientName = t.RecipientName,
                RawBankName = t.RawBankName,
                NormalizedBankName = t.NormalizedBankName,
                AccountNumber = t.AccountNumber,
                Amount = t.Amount,
                Currency = t.Currency,
                Status = t.Status,
                FailureReason = t.FailureReason,
                NormalizationConfidence = t.NormalizationConfidence,
                RetryCount = t.RetryCount,
                ProcessedAt = t.ProcessedAt,
                CreatedAt = t.CreatedAt
            }).ToList()
        };
    }

    public async Task<AddRecipientsToBatchResponse> AddRecipientsAsync(
        Guid batchId, Stream file, string fileName, Guid orgId, Guid userId)
    {
        var batch = await _context.PayoutBatches
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException($"Batch '{batchId}' not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException();

        if (batch.Status is not ("pending" or "scheduled" or "completed" or "partially_failed"))
            throw new AppValidationException($"Cannot add recipients to a batch with status '{batch.Status}'.");

        // Parse CSV
        var parseResult = await _csvParser.ParsePaymentFileAsync(file);
        var errors = new List<BatchValidationError>(parseResult.Errors);

        // Normalize bank names
        var bankNames = parseResult.ValidRecords.Select(r => r.BankName).Distinct().ToList();
        var normalizationResults = bankNames.Count > 0
            ? await _bankNormalization.NormalizeBankNamesAsync(bankNames)
            : new List<DTOs.Normalization.NormalizationResult>();

        var normalizationMap = new Dictionary<string, DTOs.Normalization.NormalizationResult>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < bankNames.Count; i++)
            normalizationMap[bankNames[i]] = normalizationResults[i];

        var bankCodes = normalizationResults.Where(n => n.BankCode != null).Select(n => n.BankCode!).Distinct().ToList();
        var banksById = new Dictionary<string, Models.Bank>(StringComparer.OrdinalIgnoreCase);
        if (bankCodes.Count > 0)
        {
            var banks = await _context.Banks.Where(b => bankCodes.Contains(b.Code)).ToListAsync();
            foreach (var bank in banks)
                banksById[bank.Code] = bank;
        }

        var newTransactions = new List<Transaction>();
        var addedAmount = 0m;

        for (var i = 0; i < parseResult.ValidRecords.Count; i++)
        {
            var record = parseResult.ValidRecords[i];
            var rowNumber = i + 2;
            var rowErrors = new List<BatchValidationError>();

            var normResult = normalizationMap.GetValueOrDefault(record.BankName);
            Guid? bankId = null;
            string? normalizedBankName = normResult?.NormalizedBank;
            decimal? confidence = normResult?.Confidence;

            if (normResult?.BankCode != null && banksById.TryGetValue(normResult.BankCode, out var bank))
                bankId = bank.Id;

            var amountErrors = _transactionValidation.ValidateAmount(record.Amount);
            foreach (var err in amountErrors)
                rowErrors.Add(new BatchValidationError { RowNumber = rowNumber, Field = "Amount", Message = err });

            var accountErrors = _transactionValidation.ValidateAccountNumber(record.AccountNumber, normResult?.BankCode);
            foreach (var err in accountErrors)
                rowErrors.Add(new BatchValidationError { RowNumber = rowNumber, Field = "AccountNumber", Message = err });

            if (rowErrors.Count > 0)
                errors.AddRange(rowErrors);

            var status = rowErrors.Count > 0 ? "failed" : "pending";
            var failureReason = rowErrors.Count > 0 ? string.Join("; ", rowErrors.Select(e => e.Message)) : null;

            var transaction = new Transaction
            {
                PayoutBatchId = batch.Id,
                OrganizationId = orgId,
                RecipientName = record.RecipientName,
                RawBankName = record.BankName,
                NormalizedBankName = normalizedBankName,
                AccountNumber = record.AccountNumber,
                Amount = record.Amount,
                BankId = bankId,
                NormalizationConfidence = confidence,
                Status = status,
                FailureReason = failureReason
            };

            newTransactions.Add(transaction);
            if (status == "pending") addedAmount += record.Amount;
        }

        var addedCount = newTransactions.Count(t => t.Status == "pending");
        var failedCount = newTransactions.Count(t => t.Status == "failed");

        _context.Transactions.AddRange(newTransactions);

        batch.TotalRecords += newTransactions.Count;
        batch.TotalAmount += addedAmount;
        batch.PendingCount += addedCount;
        batch.FailedCount += failedCount;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(
            "batch.recipients_added",
            "PayoutBatch",
            batch.Id.ToString(),
            userId,
            orgId,
            details: $"Added {addedCount} recipients from {fileName}, amount: {addedAmount:N2}");

        return new AddRecipientsToBatchResponse
        {
            AddedCount = addedCount,
            FailedCount = failedCount,
            AddedAmount = addedAmount,
            Errors = errors
        };
    }

    public async Task<PayoutBatchSummaryResponse> GetBatchSummaryAsync(Guid batchId, Guid orgId)
    {
        var batch = await _context.PayoutBatches
            .Include(b => b.Transactions)
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException($"Batch '{batchId}' not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException();

        var transactions = batch.Transactions;
        var successAmount = transactions.Where(t => t.Status == "completed").Sum(t => t.Amount);
        var failedAmount = transactions.Where(t => t.Status == "failed").Sum(t => t.Amount);
        var pendingAmount = transactions.Where(t => t.Status is "pending" or "processing").Sum(t => t.Amount);
        var totalRecords = transactions.Count;
        var successCount = transactions.Count(t => t.Status == "completed");

        return new PayoutBatchSummaryResponse
        {
            TotalRecords = totalRecords,
            TotalAmount = batch.TotalAmount,
            SuccessCount = batch.SuccessCount,
            FailedCount = batch.FailedCount,
            PendingCount = batch.PendingCount,
            SuccessRate = totalRecords > 0 ? Math.Round((decimal)successCount / totalRecords * 100, 2) : 0,
            SuccessAmount = successAmount,
            FailedAmount = failedAmount,
            PendingAmount = pendingAmount
        };
    }

    public async Task RetryFailedTransactionsAsync(Guid batchId, Guid orgId, Guid userId)
    {
        var batch = await _context.PayoutBatches
            .Include(b => b.Transactions)
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException($"Batch '{batchId}' not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException();

        var failedTransactions = batch.Transactions
            .Where(t => t.Status == "failed" && t.RetryCount < _limits.MaxRetryCount)
            .ToList();

        if (failedTransactions.Count == 0)
        {
            throw new AppValidationException("No eligible failed transactions to retry.");
        }

        foreach (var tx in failedTransactions)
        {
            tx.Status = "pending";
            tx.RetryCount++;
            tx.FailureReason = null;
        }

        batch.PendingCount += failedTransactions.Count;
        batch.FailedCount -= failedTransactions.Count;

        if (batch.Status == "completed" || batch.Status == "failed")
            batch.Status = "pending";

        await _context.SaveChangesAsync();

        await _audit.LogAsync(
            "batch.retry",
            "PayoutBatch",
            batch.Id.ToString(),
            userId,
            orgId,
            details: $"Retried {failedTransactions.Count} failed transactions.");
    }

    public async Task<int> ConfirmDuplicatesAsync(Guid batchId, Guid orgId, Guid userId)
    {
        var batch = await _context.PayoutBatches
            .Include(b => b.Transactions)
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException($"Batch '{batchId}' not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException();

        var duplicateTransactions = batch.Transactions
            .Where(t => t.Status == "failed"
                && t.FailureReason != null
                && t.FailureReason.Contains("duplicate", StringComparison.OrdinalIgnoreCase)
                && t.RetryCount < _limits.MaxRetryCount)
            .ToList();

        if (duplicateTransactions.Count == 0)
            throw new AppValidationException("No duplicate-flagged transactions to confirm.");

        foreach (var tx in duplicateTransactions)
        {
            tx.Status = "pending";
            tx.RetryCount++;
            tx.FailureReason = null;
        }

        batch.PendingCount += duplicateTransactions.Count;
        batch.FailedCount -= duplicateTransactions.Count;

        if (batch.Status is "completed" or "failed" or "partially_failed")
            batch.Status = "pending";

        await _context.SaveChangesAsync();

        await _audit.LogAsync(
            "batch.confirm_duplicates",
            "PayoutBatch",
            batch.Id.ToString(),
            userId,
            orgId,
            details: $"Confirmed {duplicateTransactions.Count} duplicate-flagged transactions as not duplicates.");

        return duplicateTransactions.Count;
    }

    public async Task CancelBatchAsync(Guid batchId, Guid orgId, Guid userId)
    {
        var batch = await _context.PayoutBatches
            .Include(b => b.Transactions)
            .FirstOrDefaultAsync(b => b.Id == batchId)
            ?? throw new NotFoundException($"Batch '{batchId}' not found.");

        if (batch.OrganizationId != orgId)
            throw new ForbiddenException();

        if (batch.Status != "pending" && batch.Status != "draft")
            throw new AppValidationException($"Cannot cancel batch with status '{batch.Status}'. Only pending or draft batches can be cancelled.");

        batch.Status = "cancelled";

        var pendingTransactions = batch.Transactions
            .Where(t => t.Status == "pending")
            .ToList();

        foreach (var tx in pendingTransactions)
        {
            tx.Status = "cancelled";
        }

        batch.PendingCount = 0;

        await _context.SaveChangesAsync();

        await _audit.LogAsync(
            "batch.cancelled",
            "PayoutBatch",
            batch.Id.ToString(),
            userId,
            orgId,
            details: $"Batch cancelled. {pendingTransactions.Count} pending transactions cancelled.");
    }
}
