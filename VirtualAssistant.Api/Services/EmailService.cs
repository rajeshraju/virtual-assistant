using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;
using VirtualAssistant.Api.Configuration;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Services;

public class EmailService(IOptions<SendGridSettings> options, ILogger<EmailService> logger) : IEmailService
{
    private readonly SendGridSettings _settings = options.Value;

    public async Task SendEmailAsync(string to, string subject, string htmlBody, string? plainTextBody = null)
    {
        var client = new SendGridClient(_settings.ApiKey);
        var from = new EmailAddress(_settings.FromEmail, _settings.FromName);
        var toAddress = new EmailAddress(to);
        var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, plainTextBody ?? string.Empty, htmlBody);

        var response = await client.SendEmailAsync(msg);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Body.ReadAsStringAsync();
            logger.LogError("SendGrid error {StatusCode}: {Body}", response.StatusCode, body);
        }
    }
}
