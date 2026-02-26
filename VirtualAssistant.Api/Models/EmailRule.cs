namespace VirtualAssistant.Api.Models;

public class EmailRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string MatchField { get; set; } = EmailMatchField.Subject;
    public string MatchOperator { get; set; } = EmailMatchOperator.Contains;
    public string MatchValue { get; set; } = string.Empty;
    public string ReplyTemplate { get; set; } = string.Empty;
    public int Priority { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<EmailLog> EmailLogs { get; set; } = [];
}

public static class EmailMatchField
{
    public const string Subject = "Subject";
    public const string Body = "Body";
    public const string From = "From";
    public const string Any = "Any";
}

public static class EmailMatchOperator
{
    public const string Contains = "Contains";
    public const string StartsWith = "StartsWith";
    public const string EndsWith = "EndsWith";
    public const string ExactMatch = "Equals";
    public const string Regex = "Regex";
}
