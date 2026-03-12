namespace ForgeApi.Configurations;

public class SmtpSettings
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@forgeapi.com";
    public string FromName { get; set; } = "Forge API";
    public bool UseSsl { get; set; } = true;
    public bool Enabled { get; set; } = false; // disabled by default in dev
}
