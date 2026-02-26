using System.ComponentModel.DataAnnotations;

namespace VirtualAssistant.Api.DTOs.EmailRules;

public class CreateEmailRuleRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string MatchField { get; set; } = string.Empty;

    [Required]
    public string MatchOperator { get; set; } = string.Empty;

    [Required]
    public string MatchValue { get; set; } = string.Empty;

    [Required]
    public string ReplyTemplate { get; set; } = string.Empty;

    public int Priority { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

public class UpdateEmailRuleRequest
{
    public string? Name { get; set; }
    public string? MatchField { get; set; }
    public string? MatchOperator { get; set; }
    public string? MatchValue { get; set; }
    public string? ReplyTemplate { get; set; }
    public int? Priority { get; set; }
    public bool? IsActive { get; set; }
}

public class EmailRuleResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string MatchField { get; set; } = string.Empty;
    public string MatchOperator { get; set; } = string.Empty;
    public string MatchValue { get; set; } = string.Empty;
    public string ReplyTemplate { get; set; } = string.Empty;
    public int Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class EmailLogResponse
{
    public Guid Id { get; set; }
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string? BodySnippet { get; set; }
    public DateTime ReceivedAt { get; set; }
    public string? RuleMatchedName { get; set; }
    public bool AutoReplySent { get; set; }
    public DateTime? AutoReplyAt { get; set; }
}

public class PhoneCallResponse
{
    public Guid Id { get; set; }
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? Duration { get; set; }
    public string? RecordingUrl { get; set; }
    public string? TranscriptionText { get; set; }
    public DateTime CallStartedAt { get; set; }
}
