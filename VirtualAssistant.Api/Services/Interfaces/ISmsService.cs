namespace VirtualAssistant.Api.Services.Interfaces;

public interface ISmsService
{
    Task<string?> SendSmsAsync(string to, string body);
}
