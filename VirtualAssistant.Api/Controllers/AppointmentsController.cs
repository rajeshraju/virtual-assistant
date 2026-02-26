using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualAssistant.Api.DTOs.Appointments;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Controllers;

[ApiController]
[Route("api/appointments")]
[Authorize]
public class AppointmentsController(IAppointmentService appointmentService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateTime? start, [FromQuery] DateTime? end) =>
        Ok(await appointmentService.GetAllAsync(UserId, start, end));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await appointmentService.GetByIdAsync(id, UserId);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateAppointmentRequest request)
    {
        var result = await appointmentService.CreateAsync(UserId, request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateAppointmentRequest request)
    {
        var result = await appointmentService.UpdateAsync(id, UserId, request);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await appointmentService.DeleteAsync(id, UserId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/reschedule")]
    public async Task<IActionResult> Reschedule(Guid id, RescheduleRequest request)
    {
        var result = await appointmentService.RescheduleAsync(id, UserId, request);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/send-reminder")]
    public async Task<IActionResult> SendReminder(Guid id)
    {
        var sent = await appointmentService.SendReminderAsync(id, UserId);
        return sent ? Ok(new { message = "Reminder sent." }) : NotFound();
    }
}
