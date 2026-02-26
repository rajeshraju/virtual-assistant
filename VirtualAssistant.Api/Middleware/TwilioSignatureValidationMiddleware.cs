using Microsoft.Extensions.Options;
using Twilio.Security;
using VirtualAssistant.Api.Configuration;

namespace VirtualAssistant.Api.Middleware;

public class TwilioSignatureValidationMiddleware(
    RequestDelegate next,
    IOptions<TwilioSettings> options,
    ILogger<TwilioSignatureValidationMiddleware> logger)
{
    private readonly TwilioSettings _settings = options.Value;

    public async Task InvokeAsync(HttpContext context)
    {
        // Enable buffering so we can read the body
        context.Request.EnableBuffering();

        var signature = context.Request.Headers["X-Twilio-Signature"].FirstOrDefault() ?? string.Empty;
        var requestUrl = $"{_settings.PublicBaseUrl}{context.Request.Path}{context.Request.QueryString}";

        // Read POST parameters
        Dictionary<string, string> parameters = [];
        if (context.Request.HasFormContentType)
        {
            var form = await context.Request.ReadFormAsync();
            parameters = form.ToDictionary(k => k.Key, v => v.Value.ToString());
        }

        // Reset stream position
        context.Request.Body.Position = 0;

        var validator = new RequestValidator(_settings.AuthToken);
        if (!validator.Validate(requestUrl, parameters, signature))
        {
            logger.LogWarning("Twilio signature validation failed for {Url}", requestUrl);
            context.Response.StatusCode = 403;
            await context.Response.WriteAsync("Forbidden");
            return;
        }

        await next(context);
    }
}
