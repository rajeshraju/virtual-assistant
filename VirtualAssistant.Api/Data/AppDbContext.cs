using Microsoft.EntityFrameworkCore;
using VirtualAssistant.Api.Models;

namespace VirtualAssistant.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<PhoneCall> PhoneCalls => Set<PhoneCall>();
    public DbSet<SmsMessage> SmsMessages => Set<SmsMessage>();
    public DbSet<EmailRule> EmailRules => Set<EmailRule>();
    public DbSet<EmailLog> EmailLogs => Set<EmailLog>();
    public DbSet<ReminderLog> ReminderLogs => Set<ReminderLog>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<Theme> Themes => Set<Theme>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(256).IsRequired();
            e.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
            e.Property(u => u.LastName).HasMaxLength(100).IsRequired();
            e.Property(u => u.PhoneNumber).HasMaxLength(20);
            e.Property(u => u.Role).HasMaxLength(20).IsRequired().HasDefaultValue("Staff");
            e.Property(u => u.CanViewEmails).HasDefaultValue(true);
            e.Property(u => u.CanViewCalls).HasDefaultValue(true);
            e.Property(u => u.CanViewScheduling).HasDefaultValue(true);
        });

        modelBuilder.Entity<SystemSetting>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.Key).IsUnique();
            e.Property(s => s.Key).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<Appointment>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Title).HasMaxLength(255).IsRequired();
            e.Property(a => a.ContactName).HasMaxLength(255).IsRequired();
            e.Property(a => a.ContactEmail).HasMaxLength(256);
            e.Property(a => a.ContactPhone).HasMaxLength(20);
            e.Property(a => a.Status).HasMaxLength(50).IsRequired();
            e.HasOne(a => a.User).WithMany(u => u.Appointments).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PhoneCall>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.TwilioCallSid).IsUnique();
            e.Property(p => p.TwilioCallSid).HasMaxLength(100).IsRequired();
            e.Property(p => p.From).HasMaxLength(20).IsRequired();
            e.Property(p => p.To).HasMaxLength(20).IsRequired();
            e.Property(p => p.Direction).HasMaxLength(20).IsRequired();
            e.Property(p => p.Status).HasMaxLength(50).IsRequired();
            e.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(p => p.Appointment).WithMany(a => a.PhoneCalls).HasForeignKey(p => p.AppointmentId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SmsMessage>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.TwilioMessageSid).IsUnique().HasFilter("\"TwilioMessageSid\" IS NOT NULL");
            e.Property(s => s.TwilioMessageSid).HasMaxLength(100);
            e.Property(s => s.From).HasMaxLength(20).IsRequired();
            e.Property(s => s.To).HasMaxLength(20).IsRequired();
            e.Property(s => s.Direction).HasMaxLength(20).IsRequired();
            e.Property(s => s.Status).HasMaxLength(50).IsRequired();
            e.HasOne(s => s.Appointment).WithMany(a => a.SmsMessages).HasForeignKey(s => s.AppointmentId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<EmailRule>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Name).HasMaxLength(255).IsRequired();
            e.Property(r => r.MatchField).HasMaxLength(50).IsRequired();
            e.Property(r => r.MatchOperator).HasMaxLength(50).IsRequired();
            e.HasOne(r => r.User).WithMany(u => u.EmailRules).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmailLog>(e =>
        {
            e.HasKey(l => l.Id);
            e.HasIndex(l => l.MessageId).IsUnique();
            e.Property(l => l.MessageId).HasMaxLength(255).IsRequired();
            e.Property(l => l.From).HasMaxLength(256).IsRequired();
            e.Property(l => l.To).HasMaxLength(256).IsRequired();
            e.HasOne(l => l.User).WithMany().HasForeignKey(l => l.UserId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(l => l.RuleMatched).WithMany(r => r.EmailLogs).HasForeignKey(l => l.RuleMatchedId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ReminderLog>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Channel).HasMaxLength(20).IsRequired();
            e.Property(r => r.SentTo).HasMaxLength(256).IsRequired();
            e.Property(r => r.Status).HasMaxLength(50).IsRequired();
            e.HasOne(r => r.Appointment).WithMany(a => a.ReminderLogs).HasForeignKey(r => r.AppointmentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Theme>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => t.Slug).IsUnique();
            e.Property(t => t.Name).HasMaxLength(100).IsRequired();
            e.Property(t => t.Slug).HasMaxLength(100).IsRequired();
            e.Property(t => t.Primary).HasMaxLength(50).IsRequired();
            e.Property(t => t.PrimaryDark).HasMaxLength(50).IsRequired();
            e.Property(t => t.PrimaryLight).HasMaxLength(50).IsRequired();
            e.Property(t => t.SidebarBg).HasMaxLength(50).IsRequired();
            e.Property(t => t.SidebarActive).HasMaxLength(50).IsRequired();
            e.Property(t => t.SidebarHover).HasMaxLength(50).IsRequired();
            e.Property(t => t.SidebarText).HasMaxLength(50).IsRequired();
            e.Property(t => t.SidebarSubtext).HasMaxLength(50).IsRequired();
            e.Property(t => t.SidebarBorder).HasMaxLength(100).IsRequired();
            e.Property(t => t.PageBg).HasMaxLength(50).IsRequired();
            e.Property(t => t.CardBg).HasMaxLength(50).IsRequired();
            e.Property(t => t.TextPrimary).HasMaxLength(50).IsRequired();
            e.Property(t => t.TextMuted).HasMaxLength(50).IsRequired();
            e.Property(t => t.BorderColor).HasMaxLength(50).IsRequired();
            e.Property(t => t.TableHeaderBg).HasMaxLength(50).IsRequired();
            e.Property(t => t.InputBg).HasMaxLength(50).IsRequired();
        });
    }
}
