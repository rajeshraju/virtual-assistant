using VirtualAssistant.Api.DTOs.Auth;
using VirtualAssistant.Api.Models;

namespace VirtualAssistant.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> UpdateProfileAsync(Guid id, UpdateProfileRequest request);
}
