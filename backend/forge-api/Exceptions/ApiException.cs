namespace ForgeApi.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class AppValidationException : Exception
{
    public List<string> Errors { get; }

    public AppValidationException(string message, List<string>? errors = null)
        : base(message)
    {
        Errors = errors ?? new();
    }
}

public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "You do not have permission to perform this action.")
        : base(message) { }
}

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
