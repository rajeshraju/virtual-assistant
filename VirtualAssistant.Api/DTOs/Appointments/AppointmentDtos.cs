using System.ComponentModel.DataAnnotations;

namespace VirtualAssistant.Api.DTOs.Appointments;

public class CreateAppointmentRequest
{
    [Required]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    [Required]
    public string ContactName { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    public int ReminderMinutesBefore { get; set; } = 60;
    public string? Notes { get; set; }
}

public class UpdateAppointmentRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ContactName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Status { get; set; }
    public int? ReminderMinutesBefore { get; set; }
    public string? Notes { get; set; }
}

public class RescheduleRequest
{
    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }
}

public class AppointmentResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool ReminderSentSms { get; set; }
    public bool ReminderSentEmail { get; set; }
    public int ReminderMinutesBefore { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
