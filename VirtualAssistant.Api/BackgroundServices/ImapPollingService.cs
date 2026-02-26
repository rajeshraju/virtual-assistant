using Microsoft.Extensions.Options;
using VirtualAssistant.Api.Configuration;
using VirtualAssistant.Api.Services;

namespace VirtualAssistant.Api.BackgroundServices;

public class ImapPollingService(
    ImapEmailService imapService,
    IOptions<ImapSettings> options,
    ILogger<ImapPollingService> logger) : BackgroundService
{
    private readonly ImapSettings _settings = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ImapPollingService started — polling every {Min} min", _settings.PollIntervalMinutes);
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(_settings.PollIntervalMinutes));

        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await imapService.PollInboxAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ImapPollingService error");
            }
        }
    }
}
