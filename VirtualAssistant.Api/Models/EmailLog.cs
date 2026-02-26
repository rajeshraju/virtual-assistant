namespace VirtualAssistant.Api.Models;

public class EmailLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string MessageId { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string? BodySnippet { get; set; }
    public DateTime ReceivedAt { get; set; }
    public Guid? RuleMatchedId { get; set; }
    public EmailRule? RuleMatched { get; set; }
    public bool AutoReplySent { get; set; } = false;
    public DateTime? AutoReplyAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
