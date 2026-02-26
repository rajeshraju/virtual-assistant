namespace VirtualAssistant.Api.Models;

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = AppointmentStatus.Scheduled;
    public bool ReminderSentSms { get; set; } = false;
    public bool ReminderSentEmail { get; set; } = false;
    public int ReminderMinutesBefore { get; set; } = 60;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PhoneCall> PhoneCalls { get; set; } = [];
    public ICollection<SmsMessage> SmsMessages { get; set; } = [];
    public ICollection<ReminderLog> ReminderLogs { get; set; } = [];
}

public static class AppointmentStatus
{
    public const string Scheduled = "Scheduled";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string Rescheduled = "Rescheduled";
}
