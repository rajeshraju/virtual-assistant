using Microsoft.Extensions.Options;
using Twilio.Rest.Api.V2010.Account;
using VirtualAssistant.Api.Configuration;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Services;

public class SmsService(IOptions<TwilioSettings> options, ILogger<SmsService> logger) : ISmsService
{
    private readonly TwilioSettings _settings = options.Value;

    public async Task<string?> SendSmsAsync(string to, string body)
    {
        try
        {
            var message = await MessageResource.CreateAsync(
                to: new Twilio.Types.PhoneNumber(to),
                from: new Twilio.Types.PhoneNumber(_settings.FromPhoneNumber),
                body: body);
            return message.Sid;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send SMS to {To}", to);
            return null;
        }
    }
}
