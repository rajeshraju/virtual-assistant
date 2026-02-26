namespace VirtualAssistant.Api.Models;

public class PhoneCall
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string TwilioCallSid { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? Duration { get; set; }
    public string? RecordingUrl { get; set; }
    public string? TranscriptionText { get; set; }
    public Guid? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public DateTime CallStartedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
