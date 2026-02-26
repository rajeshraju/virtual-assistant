using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using VirtualAssistant.Api.Configuration;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.Models;

namespace VirtualAssistant.Api.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize(Roles = UserRole.Admin)]
public class SettingsController(
    AppDbContext db,
    IOptions<TwilioSettings> twilioOptions,
    IOptions<SendGridSettings> sendGridOptions,
    IOptions<ImapSettings> imapOptions) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var stored = await db.SystemSettings.ToListAsync();
        string Get(string key, string fallback) =>
            stored.FirstOrDefault(s => s.Key == key)?.Value ?? fallback;

        var twilio = twilioOptions.Value;
        var sg = sendGridOptions.Value;
        var imap = imapOptions.Value;

        return Ok(new
        {
            twilio = new
            {
                accountSid = Get("Twilio.AccountSid", twilio.AccountSid),
                authToken = Get("Twilio.AuthToken", twilio.AuthToken),
                fromPhoneNumber = Get("Twilio.FromPhoneNumber", twilio.FromPhoneNumber),
                publicBaseUrl = Get("Twilio.PublicBaseUrl", twilio.PublicBaseUrl),
            },
            sendGrid = new
            {
                apiKey = Get("SendGrid.ApiKey", sg.ApiKey),
                fromEmail = Get("SendGrid.FromEmail", sg.FromEmail),
                fromName = Get("SendGrid.FromName", sg.FromName),
            },
            imap = new
            {
                host = Get("Imap.Host", imap.Host),
                port = int.TryParse(Get("Imap.Port", imap.Port.ToString()), out var port) ? port : imap.Port,
                useSsl = bool.TryParse(Get("Imap.UseSsl", imap.UseSsl.ToString()), out var ssl) ? ssl : imap.UseSsl,
                username = Get("Imap.Username", imap.Username),
                password = Get("Imap.Password", imap.Password),
                pollIntervalMinutes = int.TryParse(Get("Imap.PollIntervalMinutes", imap.PollIntervalMinutes.ToString()), out var poll) ? poll : imap.PollIntervalMinutes,
            },
        });
    }

    [HttpPut]
    public async Task<IActionResult> SaveSettings(SaveSettingsRequest request)
    {
        var updates = new Dictionary<string, string>();

        if (request.Twilio != null)
        {
            if (request.Twilio.AccountSid != null) updates["Twilio.AccountSid"] = request.Twilio.AccountSid;
            if (request.Twilio.AuthToken != null) updates["Twilio.AuthToken"] = request.Twilio.AuthToken;
            if (request.Twilio.FromPhoneNumber != null) updates["Twilio.FromPhoneNumber"] = request.Twilio.FromPhoneNumber;
            if (request.Twilio.PublicBaseUrl != null) updates["Twilio.PublicBaseUrl"] = request.Twilio.PublicBaseUrl;
        }

        if (request.SendGrid != null)
        {
            if (request.SendGrid.ApiKey != null) updates["SendGrid.ApiKey"] = request.SendGrid.ApiKey;
            if (request.SendGrid.FromEmail != null) updates["SendGrid.FromEmail"] = request.SendGrid.FromEmail;
            if (request.SendGrid.FromName != null) updates["SendGrid.FromName"] = request.SendGrid.FromName;
        }

        if (request.Imap != null)
        {
            if (request.Imap.Host != null) updates["Imap.Host"] = request.Imap.Host;
            if (request.Imap.Port.HasValue) updates["Imap.Port"] = request.Imap.Port.Value.ToString();
            if (request.Imap.UseSsl.HasValue) updates["Imap.UseSsl"] = request.Imap.UseSsl.Value.ToString();
            if (request.Imap.Username != null) updates["Imap.Username"] = request.Imap.Username;
            if (request.Imap.Password != null) updates["Imap.Password"] = request.Imap.Password;
            if (request.Imap.PollIntervalMinutes.HasValue) updates["Imap.PollIntervalMinutes"] = request.Imap.PollIntervalMinutes.Value.ToString();
        }

        foreach (var (key, value) in updates)
        {
            var existing = await db.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (existing != null)
            {
                existing.Value = value;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                db.SystemSettings.Add(new SystemSetting { Key = key, Value = value });
            }
        }

        await db.SaveChangesAsync();
        return await GetSettings();
    }
}

public class SaveSettingsRequest
{
    public TwilioSettingsUpdate? Twilio { get; set; }
    public SendGridSettingsUpdate? SendGrid { get; set; }
    public ImapSettingsUpdate? Imap { get; set; }
}

public class TwilioSettingsUpdate
{
    public string? AccountSid { get; set; }
    public string? AuthToken { get; set; }
    public string? FromPhoneNumber { get; set; }
    public string? PublicBaseUrl { get; set; }
}

public class SendGridSettingsUpdate
{
    public string? ApiKey { get; set; }
    public string? FromEmail { get; set; }
    public string? FromName { get; set; }
}

public class ImapSettingsUpdate
{
    public string? Host { get; set; }
    public int? Port { get; set; }
    public bool? UseSsl { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
    public int? PollIntervalMinutes { get; set; }
}
