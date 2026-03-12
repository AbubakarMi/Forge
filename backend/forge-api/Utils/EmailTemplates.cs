namespace ForgeApi.Utils;

public static class EmailTemplates
{
    // Shared layout wrapper with Forge branding (dark header, white body, gray footer)
    private static string WrapInLayout(string title, string content) => $@"
    <!DOCTYPE html>
    <html>
    <head><meta charset='utf-8'></head>
    <body style='margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;'>
    <div style='max-width:600px;margin:0 auto;padding:20px;'>
        <div style='background:#1a1a2e;padding:24px 32px;border-radius:12px 12px 0 0;'>
            <h1 style='color:#fff;margin:0;font-size:20px;'>&#9889; Forge API</h1>
        </div>
        <div style='background:#fff;padding:32px;border:1px solid #e5e7eb;'>
            <h2 style='color:#111;margin:0 0 16px;font-size:18px;'>{title}</h2>
            {content}
        </div>
        <div style='padding:16px 32px;text-align:center;color:#9ca3af;font-size:12px;'>
            <p>&copy; Forge API — Payment Infrastructure Platform</p>
        </div>
    </div>
    </body></html>";

    public static string RegistrationConfirmation(string name) => WrapInLayout("Welcome to Forge!", $@"
        <p style='color:#374151;'>Hi {name},</p>
        <p style='color:#374151;'>Your account has been created successfully. You're ready to start processing payments.</p>
        <p style='color:#374151;'>Get started by creating an API key in your dashboard.</p>");

    public static string BatchCompleted(string fileName, int totalRecords, int successCount, decimal totalAmount) => WrapInLayout("Batch Completed", $@"
        <p style='color:#374151;'>Your payment batch has been processed successfully.</p>
        <table style='width:100%;border-collapse:collapse;margin:16px 0;'>
            <tr><td style='padding:8px;color:#6b7280;'>File</td><td style='padding:8px;font-weight:bold;color:#111;'>{fileName}</td></tr>
            <tr><td style='padding:8px;color:#6b7280;'>Total Records</td><td style='padding:8px;font-weight:bold;color:#111;'>{totalRecords}</td></tr>
            <tr><td style='padding:8px;color:#6b7280;'>Successful</td><td style='padding:8px;font-weight:bold;color:#059669;'>{successCount}</td></tr>
            <tr><td style='padding:8px;color:#6b7280;'>Total Amount</td><td style='padding:8px;font-weight:bold;color:#111;'>&#8358;{totalAmount:N2}</td></tr>
        </table>");

    public static string BatchFailed(string fileName, int totalRecords, int failedCount, int successCount) => WrapInLayout("Batch Processing Alert", $@"
        <p style='color:#374151;'>Your payment batch completed with some failures.</p>
        <table style='width:100%;border-collapse:collapse;margin:16px 0;'>
            <tr><td style='padding:8px;color:#6b7280;'>File</td><td style='padding:8px;font-weight:bold;color:#111;'>{fileName}</td></tr>
            <tr><td style='padding:8px;color:#6b7280;'>Total Records</td><td style='padding:8px;font-weight:bold;color:#111;'>{totalRecords}</td></tr>
            <tr><td style='padding:8px;color:#6b7280;'>Successful</td><td style='padding:8px;font-weight:bold;color:#059669;'>{successCount}</td></tr>
            <tr><td style='padding:8px;color:#6b7280;'>Failed</td><td style='padding:8px;font-weight:bold;color:#dc2626;'>{failedCount}</td></tr>
        </table>
        <p style='color:#374151;'>Please review the failed transactions in your dashboard.</p>");

    public static string FailedTransactionsAlert(int failedCount, Guid batchId, string fileName) => WrapInLayout("Failed Transactions Alert", $@"
        <p style='color:#dc2626;font-weight:bold;'>{failedCount} transaction(s) failed in batch '{fileName}'.</p>
        <p style='color:#374151;'>Review and retry failed transactions from your dashboard.</p>");

    public static string WeeklySummary(string orgName, int totalTransactions, decimal totalVolume, decimal successRate, int totalBatches) => WrapInLayout($"Weekly Summary — {orgName}", $@"
        <p style='color:#374151;'>Here's your weekly activity summary:</p>
        <table style='width:100%;border-collapse:collapse;margin:16px 0;'>
            <tr><td style='padding:8px;color:#6b7280;'>Total Batches</td><td style='padding:8px;font-weight:bold;color:#111;'>{totalBatches}</td></tr>
            <tr><td style='padding:8px;color:#6b7280;'>Total Transactions</td><td style='padding:8px;font-weight:bold;color:#111;'>{totalTransactions}</td></tr>
            <tr><td style='padding:8px;color:#6b7280;'>Total Volume</td><td style='padding:8px;font-weight:bold;color:#111;'>&#8358;{totalVolume:N2}</td></tr>
            <tr><td style='padding:8px;color:#6b7280;'>Success Rate</td><td style='padding:8px;font-weight:bold;color:#059669;'>{successRate:F1}%</td></tr>
        </table>");
}
