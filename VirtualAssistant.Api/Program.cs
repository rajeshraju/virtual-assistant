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
