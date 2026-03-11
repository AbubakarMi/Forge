using System.Threading.Channels;
using ForgeApi.Services;

namespace ForgeApi.Jobs;

/// <summary>
/// Channel-based job queue for batch processing.
/// </summary>
public class BatchProcessingQueue
{
    private readonly Channel<Guid> _queue = Channel.CreateUnbounded<Guid>();

    public async ValueTask EnqueueAsync(Guid batchId)
    {
        await _queue.Writer.WriteAsync(batchId);
    }

    public async ValueTask<Guid> DequeueAsync(CancellationToken ct)
    {
        return await _queue.Reader.ReadAsync(ct);
    }
}

/// <summary>
/// Background processor that reads from the batch queue and processes each batch.
/// </summary>
public class BatchProcessingJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly BatchProcessingQueue _queue;
    private readonly ILogger<BatchProcessingJob> _logger;

    public BatchProcessingJob(
        IServiceScopeFactory scopeFactory,
        BatchProcessingQueue queue,
        ILogger<BatchProcessingJob> logger)
    {
        _scopeFactory = scopeFactory;
        _queue = queue;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var batchId = await _queue.DequeueAsync(stoppingToken);
                _logger.LogInformation("Dequeued batch {BatchId} for processing.", batchId);

                using var scope = _scopeFactory.CreateScope();
                var processor = scope.ServiceProvider.GetRequiredService<ITransactionProcessingService>();
                await processor.ProcessBatchAsync(batchId);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing batch job.");
            }
        }
    }
}
