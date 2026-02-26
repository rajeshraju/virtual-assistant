using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VirtualAssistant.Api.Configuration;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.Helpers;
using VirtualAssistant.Api.Models;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Controllers;

[ApiController]
[Route("webhooks/twilio")]
public class TwilioWebhookController(
    AppDbContext db,
    IOptions<TwilioSettings> twilioOptions,
    IEmailService emailService,
    ISmsService smsService,
    ILogger<TwilioWebhookController> logger) : ControllerBase
{
    private readonly TwilioSettings _twilio = twilioOptions.Value;

    [HttpPost("voice/inbound")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> InboundCall([FromForm] string callSid, [FromForm] string from, [FromForm] string to)
    {
        logger.LogInformation("Inbound call from {From}, SID {Sid}", from, callSid);

        db.PhoneCalls.Add(new PhoneCall
        {
            TwilioCallSid = callSid,
            From = from,
            To = to,
            Direction = "inbound",
            Status = "ringing",
            CallStartedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        var gatherUrl = $"{_twilio.PublicBaseUrl}/webhooks/twilio/voice/gather";
        var twiml = TwiMLBuilder.MainMenu(gatherUrl);
        return Content(twiml, "application/xml");
    }

    [HttpPost("voice/gather")]
    [Consumes("application/x-www-form-urlencoded")]
    public IActionResult GatherResult([FromForm] string digits, [FromForm] string callSid)
    {
        logger.LogInformation("Gather result: digit={Digit}, SID={Sid}", digits, callSid);
        var recordingUrl = $"{_twilio.PublicBaseUrl}/webhooks/twilio/voice/recording";

        var twiml = digits switch
        {
            "1" => TwiMLBuilder.RecordMessage(
                "Please leave your name, phone number, and preferred appointment time after the tone. We will call you back to confirm.",
                recordingUrl),
            "2" => TwiMLBuilder.RecordMessage(
                "Please leave your name and your preferred new appointment time. We will confirm by SMS.",
                recordingUrl),
            "3" => TwiMLBuilder.RecordMessage(
                "Please leave your name and the appointment date you would like to cancel. We will confirm by SMS.",
                recordingUrl),
            "0" => TwiMLBuilder.RecordMessage(
                "Please leave your message after the tone.",
                recordingUrl),
            _ => TwiMLBuilder.SayAndHangup("Invalid option. Goodbye."),
        };

        return Content(twiml, "application/xml");
    }

    [HttpPost("voice/status")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> CallStatus(
        [FromForm] string callSid,
        [FromForm] string callStatus,
        [FromForm] string? callDuration)
    {
        var call = await db.PhoneCalls.FirstOrDefaultAsync(c => c.TwilioCallSid == callSid);
        if (call != null)
        {
            call.Status = callStatus;
            if (int.TryParse(callDuration, out var duration)) call.Duration = duration;
            call.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        return Content(TwiMLBuilder.EmptyResponse(), "application/xml");
    }

    [HttpPost("voice/recording")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> RecordingReady(
        [FromForm] string callSid,
        [FromForm] string recordingUrl,
        [FromForm] string? transcriptionText)
    {
        var call = await db.PhoneCalls.FirstOrDefaultAsync(c => c.TwilioCallSid == callSid);
        if (call != null)
        {
            call.RecordingUrl = recordingUrl;
            if (!string.IsNullOrEmpty(transcriptionText))
                call.TranscriptionText = transcriptionText;
            call.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        // Notify assistant owner by email
        try
        {
            await emailService.SendEmailAsync(
                _twilio.PublicBaseUrl.Contains("localhost") ? "admin@localhost" : "owner@yourdomain.com",
                "New voicemail received",
                $"<p>New voicemail from <strong>{call?.From}</strong>.</p>" +
                $"<p><a href='{recordingUrl}'>Listen to recording</a></p>" +
                (string.IsNullOrEmpty(transcriptionText) ? "" : $"<p><strong>Transcription:</strong> {transcriptionText}</p>"));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send voicemail notification email");
        }

        return Ok();
    }

    [HttpPost("sms/inbound")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> InboundSms(
        [FromForm] string from,
        [FromForm] string to,
        [FromForm] string body,
        [FromForm] string messageSid)
    {
        logger.LogInformation("Inbound SMS from {From}: {Body}", from, body);

        db.SmsMessages.Add(new SmsMessage
        {
            TwilioMessageSid = messageSid,
            From = from,
            To = to,
            Body = body,
            Direction = "inbound",
            Status = "received",
            SentAt = DateTime.UtcNow,
        });

        // Handle CANCEL keyword
        if (body.Trim().Equals("CANCEL", StringComparison.OrdinalIgnoreCase))
        {
            await smsService.SendSmsAsync(from,
                "Your cancellation request has been received. We will process it shortly.");
        }

        await db.SaveChangesAsync();
        return Content(TwiMLBuilder.EmptyResponse(), "application/xml");
    }

    [HttpPost("sms/status")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> SmsStatus(
        [FromForm] string messageSid,
        [FromForm] string messageStatus)
    {
        var msg = await db.SmsMessages.FirstOrDefaultAsync(s => s.TwilioMessageSid == messageSid);
        if (msg != null)
        {
            msg.Status = messageStatus;
            await db.SaveChangesAsync();
        }
        return Ok();
    }
}
