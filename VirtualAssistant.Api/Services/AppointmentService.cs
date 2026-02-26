using Microsoft.EntityFrameworkCore;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.DTOs.Appointments;
using VirtualAssistant.Api.Models;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Services;

public class AppointmentService(AppDbContext db, IEmailService emailService, ISmsService smsService) : IAppointmentService
{
    public async Task<List<AppointmentResponse>> GetAllAsync(Guid userId, DateTime? start, DateTime? end)
    {
        var query = db.Appointments.Where(a => a.UserId == userId);
        if (start.HasValue) query = query.Where(a => a.EndTime >= start.Value);
        if (end.HasValue) query = query.Where(a => a.StartTime <= end.Value);
        var list = await query.OrderBy(a => a.StartTime).ToListAsync();
        return list.Select(ToResponse).ToList();
    }

    public async Task<AppointmentResponse?> GetByIdAsync(Guid id, Guid userId)
    {
        var a = await db.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        return a == null ? null : ToResponse(a);
    }

    public async Task<AppointmentResponse> CreateAsync(Guid userId, CreateAppointmentRequest request)
    {
        var appt = new Appointment
        {
            UserId = userId,
            Title = request.Title,
            Description = request.Description,
            ContactName = request.ContactName,
            ContactEmail = request.ContactEmail,
            ContactPhone = request.ContactPhone,
            StartTime = request.StartTime.ToUniversalTime(),
            EndTime = request.EndTime.ToUniversalTime(),
            ReminderMinutesBefore = request.ReminderMinutesBefore,
            Notes = request.Notes,
        };
        db.Appointments.Add(appt);
        await db.SaveChangesAsync();
        return ToResponse(appt);
    }

    public async Task<AppointmentResponse?> UpdateAsync(Guid id, Guid userId, UpdateAppointmentRequest request)
    {
        var appt = await db.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (appt == null) return null;

        if (request.Title != null) appt.Title = request.Title;
        if (request.Description != null) appt.Description = request.Description;
        if (request.ContactName != null) appt.ContactName = request.ContactName;
        if (request.ContactEmail != null) appt.ContactEmail = request.ContactEmail;
        if (request.ContactPhone != null) appt.ContactPhone = request.ContactPhone;
        if (request.StartTime.HasValue) appt.StartTime = request.StartTime.Value.ToUniversalTime();
        if (request.EndTime.HasValue) appt.EndTime = request.EndTime.Value.ToUniversalTime();
        if (request.Status != null) appt.Status = request.Status;
        if (request.ReminderMinutesBefore.HasValue) appt.ReminderMinutesBefore = request.ReminderMinutesBefore.Value;
        if (request.Notes != null) appt.Notes = request.Notes;
        appt.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToResponse(appt);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var appt = await db.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (appt == null) return false;

        appt.Status = AppointmentStatus.Cancelled;
        appt.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<AppointmentResponse?> RescheduleAsync(Guid id, Guid userId, RescheduleRequest request)
    {
        var appt = await db.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (appt == null) return null;

        appt.StartTime = request.StartTime.ToUniversalTime();
        appt.EndTime = request.EndTime.ToUniversalTime();
        appt.Status = AppointmentStatus.Rescheduled;
        appt.ReminderSentSms = false;
        appt.ReminderSentEmail = false;
        appt.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var dateStr = appt.StartTime.ToString("dddd, MMMM d 'at' h:mm tt");

        if (!string.IsNullOrEmpty(appt.ContactPhone))
        {
            await smsService.SendSmsAsync(appt.ContactPhone,
                $"Your appointment '{appt.Title}' has been rescheduled to {dateStr}.");
            db.SmsMessages.Add(new SmsMessage
            {
                From = "system", To = appt.ContactPhone,
                Body = $"Rescheduled to {dateStr}", Direction = "outbound",
                Status = "sent", AppointmentId = appt.Id
            });
        }

        if (!string.IsNullOrEmpty(appt.ContactEmail))
        {
            await emailService.SendEmailAsync(appt.ContactEmail,
                $"Appointment Rescheduled: {appt.Title}",
                $"<p>Dear {appt.ContactName},</p><p>Your appointment <strong>{appt.Title}</strong> has been rescheduled to <strong>{dateStr}</strong>.</p>");
        }

        await db.SaveChangesAsync();
        return ToResponse(appt);
    }

    public async Task<bool> SendReminderAsync(Guid id, Guid userId)
    {
        var appt = await db.Appointments.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (appt == null) return false;

        var dateStr = appt.StartTime.ToString("dddd, MMMM d 'at' h:mm tt");

        if (!string.IsNullOrEmpty(appt.ContactPhone))
            await smsService.SendSmsAsync(appt.ContactPhone,
                $"Reminder: Your appointment '{appt.Title}' is on {dateStr}.");

        if (!string.IsNullOrEmpty(appt.ContactEmail))
            await emailService.SendEmailAsync(appt.ContactEmail,
                $"Appointment Reminder: {appt.Title}",
                BuildReminderHtml(appt));

        appt.ReminderSentSms = !string.IsNullOrEmpty(appt.ContactPhone);
        appt.ReminderSentEmail = !string.IsNullOrEmpty(appt.ContactEmail);
        await db.SaveChangesAsync();
        return true;
    }

    private static string BuildReminderHtml(Appointment a) =>
        $"""
        <p>Dear {a.ContactName},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <ul>
          <li><strong>Title:</strong> {a.Title}</li>
          <li><strong>Date:</strong> {a.StartTime:dddd, MMMM d, yyyy}</li>
          <li><strong>Time:</strong> {a.StartTime:h:mm tt} – {a.EndTime:h:mm tt}</li>
        </ul>
        {(a.Notes != null ? $"<p><strong>Notes:</strong> {a.Notes}</p>" : "")}
        """;

    private static AppointmentResponse ToResponse(Appointment a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Description = a.Description,
        ContactName = a.ContactName,
        ContactEmail = a.ContactEmail,
        ContactPhone = a.ContactPhone,
        StartTime = a.StartTime,
        EndTime = a.EndTime,
        Status = a.Status,
        ReminderSentSms = a.ReminderSentSms,
        ReminderSentEmail = a.ReminderSentEmail,
        ReminderMinutesBefore = a.ReminderMinutesBefore,
        Notes = a.Notes,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt,
    };
}
