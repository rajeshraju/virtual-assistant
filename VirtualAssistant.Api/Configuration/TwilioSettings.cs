namespace VirtualAssistant.Api.Configuration;

public class TwilioSettings
{
    public string AccountSid { get; set; } = string.Empty;
    public string AuthToken { get; set; } = string.Empty;
    public string FromPhoneNumber { get; set; } = string.Empty;
    public string PublicBaseUrl { get; set; } = string.Empty;
}
