using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtualAssistant.Api.DTOs.Auth;
using VirtualAssistant.Api.Services;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await authService.RegisterAsync(request);
        if (result == null)
            return Conflict(new { message = "Email already in use." });
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await authService.LoginAsync(request);
        if (result == null)
            return Unauthorized(new { message = "Invalid email or password." });
        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
        var user = await authService.GetByIdAsync(userId);
        if (user == null) return NotFound();
        return Ok(AuthService.ToDto(user));
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(UpdateProfileRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);
        var user = await authService.UpdateProfileAsync(userId, request);
        if (user == null) return NotFound();
        return Ok(AuthService.ToDto(user));
    }
}
