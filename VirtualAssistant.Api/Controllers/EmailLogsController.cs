using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.DTOs.EmailRules;

namespace VirtualAssistant.Api.Controllers;

[ApiController]
[Route("api/email-logs")]
[Authorize]
public class EmailLogsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = db.EmailLogs
            .Include(l => l.RuleMatched)
            .OrderByDescending(l => l.ReceivedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var result = items.Select(l => new EmailLogResponse
        {
            Id = l.Id,
            From = l.From,
            To = l.To,
            Subject = l.Subject,
            BodySnippet = l.BodySnippet,
            ReceivedAt = l.ReceivedAt,
            RuleMatchedName = l.RuleMatched?.Name,
            AutoReplySent = l.AutoReplySent,
            AutoReplyAt = l.AutoReplyAt,
        });

        return Ok(new { total, page, pageSize, items = result });
    }
}
