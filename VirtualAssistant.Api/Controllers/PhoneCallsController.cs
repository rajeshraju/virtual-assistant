using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.DTOs.EmailRules;

namespace VirtualAssistant.Api.Controllers;

[ApiController]
[Route("api/calls")]
[Authorize]
public class PhoneCallsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = db.PhoneCalls.OrderByDescending(c => c.CallStartedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var result = items.Select(c => new PhoneCallResponse
        {
            Id = c.Id,
            From = c.From,
            To = c.To,
            Direction = c.Direction,
            Status = c.Status,
            Duration = c.Duration,
            RecordingUrl = c.RecordingUrl,
            TranscriptionText = c.TranscriptionText,
            CallStartedAt = c.CallStartedAt,
        });

        return Ok(new { total, page, pageSize, items = result });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var call = await db.PhoneCalls.FindAsync(id);
        if (call == null) return NotFound();
        return Ok(new PhoneCallResponse
        {
            Id = call.Id,
            From = call.From,
            To = call.To,
            Direction = call.Direction,
            Status = call.Status,
            Duration = call.Duration,
            RecordingUrl = call.RecordingUrl,
            TranscriptionText = call.TranscriptionText,
            CallStartedAt = call.CallStartedAt,
        });
    }
}
