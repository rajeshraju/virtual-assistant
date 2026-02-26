using System.Text.RegularExpressions;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MimeKit;
using VirtualAssistant.Api.Configuration;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.Models;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Services;

public class ImapEmailService(
    IOptions<ImapSettings> options,
    IServiceScopeFactory scopeFactory,
    ILogger<ImapEmailService> logger)
{
    private readonly ImapSettings _settings = options.Value;

    public async Task PollInboxAsync(CancellationToken ct)
    {
        using var client = new ImapClient();
        try
        {
            await client.ConnectAsync(_settings.Host, _settings.Port, _settings.UseSsl, ct);
            await client.AuthenticateAsync(_settings.Username, _settings.Password, ct);
            await client.Inbox.OpenAsync(FolderAccess.ReadWrite, ct);

            var uids = await client.Inbox.SearchAsync(SearchQuery.NotSeen, ct);
            logger.LogInformation("IMAP: Found {Count} unseen messages", uids.Count);

            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            foreach (var uid in uids)
            {
                if (ct.IsCancellationRequested) break;
                try
                {
                    await ProcessMessageAsync(client, uid, db, emailService, ct);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error processing IMAP message {Uid}", uid);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "IMAP poll failed");
        }
        finally
        {
            if (client.IsConnected)
                await client.DisconnectAsync(true, ct);
        }
    }

    private async Task ProcessMessageAsync(
        ImapClient client, UniqueId uid, AppDbContext db, IEmailService emailService, CancellationToken ct)
    {
        var msg = await client.Inbox.GetMessageAsync(uid, ct);

        var messageId = msg.MessageId ?? uid.ToString();
        var from = msg.From.Mailboxes.FirstOrDefault()?.Address ?? string.Empty;
        var fromName = msg.From.Mailboxes.FirstOrDefault()?.Name ?? from;
        var subject = msg.Subject ?? "(no subject)";
        var textBody = msg.TextBody ?? StripHtml(msg.HtmlBody ?? string.Empty);
        var snippet = textBody.Length > 500 ? textBody[..500] : textBody;

        // Deduplication
        if (await db.EmailLogs.AnyAsync(e => e.MessageId == messageId, ct))
        {
            await client.Inbox.AddFlagsAsync(uid, MessageFlags.Seen, true, ct);
            return;
        }

        // Match rules ordered by priority
        var rules = await db.EmailRules
            .Where(r => r.IsActive)
            .OrderBy(r => r.Priority)
            .ToListAsync(ct);

        EmailRule? matched = null;
        foreach (var rule in rules)
        {
            if (MatchesRule(rule, from, subject, textBody))
            {
                matched = rule;
                break;
            }
        }

        var log = new EmailLog
        {
            MessageId = messageId,
            From = from,
            To = _settings.Username,
            Subject = subject,
            BodySnippet = snippet,
            ReceivedAt = msg.Date.UtcDateTime,
            RuleMatchedId = matched?.Id,
        };

        if (matched != null)
        {
            var replyBody = ProcessTemplate(matched.ReplyTemplate, fromName, from, subject, msg.Date.UtcDateTime);
            try
            {
                await emailService.SendEmailAsync(from, $"Re: {subject}", replyBody);
                log.AutoReplySent = true;
                log.AutoReplyAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send auto-reply to {From}", from);
            }
        }

        db.EmailLogs.Add(log);
        await db.SaveChangesAsync(ct);

        await client.Inbox.AddFlagsAsync(uid, MessageFlags.Seen, true, ct);
    }

    private static bool MatchesRule(EmailRule rule, string from, string subject, string body)
    {
        var field = rule.MatchField switch
        {
            EmailMatchField.Subject => subject,
            EmailMatchField.Body => body,
            EmailMatchField.From => from,
            _ => subject + " " + body + " " + from,
        };

        return rule.MatchOperator switch
        {
            EmailMatchOperator.Contains => field.Contains(rule.MatchValue, StringComparison.OrdinalIgnoreCase),
            EmailMatchOperator.StartsWith => field.StartsWith(rule.MatchValue, StringComparison.OrdinalIgnoreCase),
            EmailMatchOperator.EndsWith => field.EndsWith(rule.MatchValue, StringComparison.OrdinalIgnoreCase),
            EmailMatchOperator.ExactMatch => field.Equals(rule.MatchValue, StringComparison.OrdinalIgnoreCase),
            EmailMatchOperator.Regex => Regex.IsMatch(field, rule.MatchValue, RegexOptions.IgnoreCase),
            _ => false,
        };
    }

    private static string ProcessTemplate(string template, string senderName, string senderEmail, string subject, DateTime receivedAt) =>
        template
            .Replace("{{SenderName}}", senderName)
            .Replace("{{SenderEmail}}", senderEmail)
            .Replace("{{Subject}}", subject)
            .Replace("{{ReceivedAt}}", receivedAt.ToString("f"));

    private static string StripHtml(string html) =>
        Regex.Replace(html, "<[^>]*>", string.Empty);
}
