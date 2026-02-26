using Microsoft.EntityFrameworkCore;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.DTOs.Auth;
using VirtualAssistant.Api.Helpers;
using VirtualAssistant.Api.Models;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Services;

public class AuthService(AppDbContext db, JwtHelper jwtHelper) : IAuthService
{
    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email.ToLower()))
            return null;

        // First user ever registered becomes Admin automatically
        var isFirstUser = !await db.Users.AnyAsync();

        var user = new User
        {
            Email = request.Email.ToLower(),
            PasswordHash = PasswordHelper.Hash(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            Role = isFirstUser ? UserRole.Admin : UserRole.Staff,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return new AuthResponse { Token = jwtHelper.GenerateToken(user), User = ToDto(user) };
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());
        if (user == null || !PasswordHelper.Verify(request.Password, user.PasswordHash))
            return null;

        return new AuthResponse { Token = jwtHelper.GenerateToken(user), User = ToDto(user) };
    }

    public async Task<User?> GetByIdAsync(Guid id) =>
        await db.Users.FindAsync(id);

    public async Task<User?> UpdateProfileAsync(Guid id, UpdateProfileRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return null;

        if (request.FirstName != null) user.FirstName = request.FirstName;
        if (request.LastName != null) user.LastName = request.LastName;
        if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;
        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return user;
    }

    public static UserDto ToDto(User u) => new()
    {
        Id = u.Id,
        Email = u.Email,
        FirstName = u.FirstName,
        LastName = u.LastName,
        PhoneNumber = u.PhoneNumber,
        Role = u.Role,
        CanViewEmails = u.CanViewEmails,
        CanViewCalls = u.CanViewCalls,
        CanViewScheduling = u.CanViewScheduling,
    };
}
