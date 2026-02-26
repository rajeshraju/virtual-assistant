using Microsoft.EntityFrameworkCore;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.Models;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.BackgroundServices;

public class ReminderService(IServiceScopeFactory scopeFactory, ILogger<ReminderService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ReminderService started");
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await ProcessRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing reminders");
            }
        }
    }

    private async Task ProcessRemindersAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var smsService = scope.ServiceProvider.GetRequiredService<ISmsService>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var now = DateTime.UtcNow;

        var due = await db.Appointments
            .Where(a =>
                a.Status == AppointmentStatus.Scheduled &&
                (a.ReminderSentSms == false || a.ReminderSentEmail == false) &&
                a.StartTime > now &&
                a.StartTime <= now.AddMinutes(a.ReminderMinutesBefore))
            .ToListAsync(ct);

        foreach (var appt in due)
        {
            var dateStr = appt.StartTime.ToString("dddd, MMMM d 'at' h:mm tt");

            if (!string.IsNullOrEmpty(appt.ContactPhone) && !appt.ReminderSentSms)
            {
                var sid = await smsService.SendSmsAsync(appt.ContactPhone,
                    $"Reminder: Your appointment '{appt.Title}' is on {dateStr}. Reply CANCEL to cancel.");

                db.ReminderLogs.Add(new ReminderLog
                {
                    AppointmentId = appt.Id,
                    Channel = "SMS",
                    SentTo = appt.ContactPhone,
                    Status = sid != null ? "Sent" : "Failed",
                    SentAt = DateTime.UtcNow,
                });
                if (sid != null) appt.ReminderSentSms = true;
            }

            if (!string.IsNullOrEmpty(appt.ContactEmail) && !appt.ReminderSentEmail)
            {
                try
                {
                    await emailService.SendEmailAsync(
                        appt.ContactEmail,
                        $"Appointment Reminder: {appt.Title}",
                        BuildHtml(appt));

                    db.ReminderLogs.Add(new ReminderLog
                    {
                        AppointmentId = appt.Id,
                        Channel = "Email",
                        SentTo = appt.ContactEmail,
                        Status = "Sent",
                        SentAt = DateTime.UtcNow,
                    });
                    appt.ReminderSentEmail = true;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to send reminder email for appointment {Id}", appt.Id);
                    db.ReminderLogs.Add(new ReminderLog
                    {
                        AppointmentId = appt.Id,
                        Channel = "Email",
                        SentTo = appt.ContactEmail,
                        Status = "Failed",
                        ErrorMessage = ex.Message,
                        SentAt = DateTime.UtcNow,
                    });
                }
            }

            appt.UpdatedAt = DateTime.UtcNow;
        }

        if (due.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Processed reminders for {Count} appointments", due.Count);
        }
    }

    private static string BuildHtml(Appointment a) =>
        $"""
        <p>Dear {a.ContactName},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <ul>
          <li><strong>Title:</strong> {a.Title}</li>
          <li><strong>Date:</strong> {a.StartTime:dddd, MMMM d, yyyy}</li>
          <li><strong>Time:</strong> {a.StartTime:h:mm tt} – {a.EndTime:h:mm tt}</li>
        </ul>
        {(a.Notes != null ? $"<p><strong>Notes:</strong> {a.Notes}</p>" : "")}
        <p>If you need to reschedule or cancel, please call us.</p>
        """;
}
