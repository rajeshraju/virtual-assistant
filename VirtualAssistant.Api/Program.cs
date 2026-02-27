using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Twilio;
using VirtualAssistant.Api.BackgroundServices;
using VirtualAssistant.Api.Configuration;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.Helpers;
using VirtualAssistant.Api.Middleware;
using VirtualAssistant.Api.Services;
using VirtualAssistant.Api.Services.Interfaces;

// ── Serilog ──────────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/app-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// ── Configuration ─────────────────────────────────────────────────────────────
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<TwilioSettings>(builder.Configuration.GetSection("TwilioSettings"));
builder.Services.Configure<SendGridSettings>(builder.Configuration.GetSection("SendGridSettings"));
builder.Services.Configure<ImapSettings>(builder.Configuration.GetSection("ImapSettings"));

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── JWT Auth ──────────────────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        };
    });

builder.Services.AddAuthorization(opts =>
    opts.AddPolicy("AdminOnly", p => p.RequireRole(VirtualAssistant.Api.Models.UserRole.Admin)));

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<IEmailRuleService, EmailRuleService>();
builder.Services.AddSingleton<ImapEmailService>();

// ── Background Services ───────────────────────────────────────────────────────
builder.Services.AddHostedService<ReminderService>();
builder.Services.AddHostedService<ImapPollingService>();

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(opts =>
    opts.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// ── MVC / Swagger ─────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Virtual Assistant API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {token}",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            []
        }
    });
});

// ── Twilio SDK init ───────────────────────────────────────────────────────────
var twilioSettings = builder.Configuration.GetSection("TwilioSettings").Get<TwilioSettings>()!;
TwilioClient.Init(twilioSettings.AccountSid, twilioSettings.AuthToken);

// ────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Auto-migrate on startup ───────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Promote the oldest user to Admin if no Admin exists
    if (!db.Users.Any(u => u.Role == VirtualAssistant.Api.Models.UserRole.Admin))
    {
        var oldest = db.Users.OrderBy(u => u.CreatedAt).FirstOrDefault();
        if (oldest != null)
        {
            oldest.Role = VirtualAssistant.Api.Models.UserRole.Admin;
            db.SaveChanges();
        }
    }

    // Seed built-in themes
    SeedBuiltInThemes(db);
}

static void SeedBuiltInThemes(VirtualAssistant.Api.Data.AppDbContext db)
{
    var builtIn = new[]
    {
        new VirtualAssistant.Api.Models.Theme
        {
            Name = "Ocean", Slug = "ocean", IsBuiltIn = true, IsActive = true, IsDark = false,
            Primary = "#2563eb", PrimaryDark = "#1d4ed8", PrimaryLight = "#eff6ff",
            SidebarBg = "#111827", SidebarActive = "#2563eb", SidebarHover = "#1f2937",
            SidebarText = "#d1d5db", SidebarSubtext = "#9ca3af", SidebarBorder = "rgba(255,255,255,0.1)",
            PageBg = "#f9fafb", CardBg = "#ffffff", TextPrimary = "#111827", TextMuted = "#6b7280",
            BorderColor = "#e5e7eb", TableHeaderBg = "#f9fafb", InputBg = "#ffffff",
        },
        new VirtualAssistant.Api.Models.Theme
        {
            Name = "Midnight", Slug = "midnight", IsBuiltIn = true, IsActive = false, IsDark = true,
            Primary = "#818cf8", PrimaryDark = "#6366f1", PrimaryLight = "#312e81",
            SidebarBg = "#030712", SidebarActive = "#3730a3", SidebarHover = "#111827",
            SidebarText = "#9ca3af", SidebarSubtext = "#6b7280", SidebarBorder = "rgba(255,255,255,0.06)",
            PageBg = "#111827", CardBg = "#1f2937", TextPrimary = "#f3f4f6", TextMuted = "#9ca3af",
            BorderColor = "#374151", TableHeaderBg = "#111827", InputBg = "#374151",
        },
        new VirtualAssistant.Api.Models.Theme
        {
            Name = "Forest", Slug = "forest", IsBuiltIn = true, IsActive = false, IsDark = false,
            Primary = "#059669", PrimaryDark = "#047857", PrimaryLight = "#ecfdf5",
            SidebarBg = "#064e3b", SidebarActive = "#065f46", SidebarHover = "#065f46",
            SidebarText = "#a7f3d0", SidebarSubtext = "#6ee7b7", SidebarBorder = "rgba(255,255,255,0.1)",
            PageBg = "#f0fdf4", CardBg = "#ffffff", TextPrimary = "#111827", TextMuted = "#6b7280",
            BorderColor = "#d1fae5", TableHeaderBg = "#ecfdf5", InputBg = "#ffffff",
        },
        new VirtualAssistant.Api.Models.Theme
        {
            Name = "Sunset", Slug = "sunset", IsBuiltIn = true, IsActive = false, IsDark = false,
            Primary = "#ea580c", PrimaryDark = "#c2410c", PrimaryLight = "#fff7ed",
            SidebarBg = "#1c1917", SidebarActive = "#7c2d12", SidebarHover = "#292524",
            SidebarText = "#d6d3d1", SidebarSubtext = "#a8a29e", SidebarBorder = "rgba(255,255,255,0.1)",
            PageBg = "#fff7ed", CardBg = "#ffffff", TextPrimary = "#111827", TextMuted = "#6b7280",
            BorderColor = "#fed7aa", TableHeaderBg = "#fff7ed", InputBg = "#ffffff",
        },
        new VirtualAssistant.Api.Models.Theme
        {
            Name = "Lavender", Slug = "lavender", IsBuiltIn = true, IsActive = false, IsDark = false,
            Primary = "#9333ea", PrimaryDark = "#7e22ce", PrimaryLight = "#faf5ff",
            SidebarBg = "#0f172a", SidebarActive = "#6b21a8", SidebarHover = "#1e293b",
            SidebarText = "#cbd5e1", SidebarSubtext = "#94a3b8", SidebarBorder = "rgba(255,255,255,0.1)",
            PageBg = "#faf5ff", CardBg = "#ffffff", TextPrimary = "#111827", TextMuted = "#6b7280",
            BorderColor = "#e9d5ff", TableHeaderBg = "#faf5ff", InputBg = "#ffffff",
        },
    };

    foreach (var theme in builtIn)
    {
        if (!db.Themes.Any(t => t.Slug == theme.Slug))
            db.Themes.Add(theme);
    }

    db.SaveChanges();

    // Migrate old App.Theme setting: if one exists and no theme is active, activate that slug
    if (!db.Themes.Any(t => t.IsActive))
    {
        var oldThemeSetting = db.SystemSettings.FirstOrDefault(s => s.Key == "App.Theme");
        var slug = oldThemeSetting?.Value ?? "ocean";
        var active = db.Themes.FirstOrDefault(t => t.Slug == slug) ?? db.Themes.First();
        active.IsActive = true;
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");

// ── Twilio signature middleware (webhooks only) ───────────────────────────────
app.UseWhen(
    ctx => ctx.Request.Path.StartsWithSegments("/webhooks/twilio"),
    appBuilder => appBuilder.UseMiddleware<TwilioSignatureValidationMiddleware>());

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();
