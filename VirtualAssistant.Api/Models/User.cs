namespace VirtualAssistant.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = UserRole.Staff;
    public bool CanViewEmails { get; set; } = true;
    public bool CanViewCalls { get; set; } = true;
    public bool CanViewScheduling { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<EmailRule> EmailRules { get; set; } = [];
}

public static class UserRole
{
    public const string Admin = "Admin";
    public const string Staff = "Staff";
}
