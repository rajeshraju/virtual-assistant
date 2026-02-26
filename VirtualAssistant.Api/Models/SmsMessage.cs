namespace VirtualAssistant.Api.Models;

public class SmsMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? TwilioMessageSid { get; set; }
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
