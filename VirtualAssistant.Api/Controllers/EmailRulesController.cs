using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualAssistant.Api.DTOs.EmailRules;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Controllers;

[ApiController]
[Route("api/email-rules")]
[Authorize]
public class EmailRulesController(IEmailRuleService ruleService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await ruleService.GetAllAsync(UserId));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await ruleService.GetByIdAsync(id, UserId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateEmailRuleRequest request)
    {
        var result = await ruleService.CreateAsync(UserId, request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateEmailRuleRequest request)
    {
        var result = await ruleService.UpdateAsync(id, UserId, request);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await ruleService.DeleteAsync(id, UserId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        var toggled = await ruleService.ToggleAsync(id, UserId);
        return toggled ? Ok(new { message = "Toggled." }) : NotFound();
    }
}
