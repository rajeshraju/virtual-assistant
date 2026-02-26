using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.DTOs.Auth;
using VirtualAssistant.Api.Helpers;
using VirtualAssistant.Api.Models;
using VirtualAssistant.Api.Services;

namespace VirtualAssistant.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = UserRole.Admin)]
public class AdminController(AppDbContext db) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("users")]
    public async Task<IActionResult> ListUsers()
    {
        var users = await db.Users.OrderBy(u => u.CreatedAt).ToListAsync();
        return Ok(users.Select(AuthService.ToDto));
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(CreateUserRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email.ToLower()))
            return Conflict(new { message = "Email already in use." });

        var user = new User
        {
            Email = request.Email.ToLower(),
            PasswordHash = PasswordHelper.Hash(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            Role = request.Role ?? UserRole.Staff,
            CanViewEmails = request.CanViewEmails,
            CanViewCalls = request.CanViewCalls,
            CanViewScheduling = request.CanViewScheduling,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Ok(AuthService.ToDto(user));
    }

    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, UpdateUserRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();

        if (request.FirstName != null) user.FirstName = request.FirstName;
        if (request.LastName != null) user.LastName = request.LastName;
        if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;
        if (request.Role != null) user.Role = request.Role;
        if (request.CanViewEmails.HasValue) user.CanViewEmails = request.CanViewEmails.Value;
        if (request.CanViewCalls.HasValue) user.CanViewCalls = request.CanViewCalls.Value;
        if (request.CanViewScheduling.HasValue) user.CanViewScheduling = request.CanViewScheduling.Value;
        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(AuthService.ToDto(user));
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        if (id == CurrentUserId)
            return BadRequest(new { message = "You cannot delete your own account." });

        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("users/{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, ResetPasswordRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.PasswordHash = PasswordHelper.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { message = "Password reset." });
    }
}

public class CreateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Role { get; set; }
    public bool CanViewEmails { get; set; } = true;
    public bool CanViewCalls { get; set; } = true;
    public bool CanViewScheduling { get; set; } = true;
}

public class UpdateUserRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Role { get; set; }
    public bool? CanViewEmails { get; set; }
    public bool? CanViewCalls { get; set; }
    public bool? CanViewScheduling { get; set; }
}

public class ResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}
