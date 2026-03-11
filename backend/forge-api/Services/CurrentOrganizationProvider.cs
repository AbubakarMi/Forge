namespace ForgeApi.Services;

public interface ICurrentOrganizationProvider
{
    Guid OrganizationId { get; }
    Guid UserId { get; }
    string Role { get; }
    bool IsAuthenticated { get; }
}

public class CurrentOrganizationProvider : ICurrentOrganizationProvider
{
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsAuthenticated { get; set; }
}
