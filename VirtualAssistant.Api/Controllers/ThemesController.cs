using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.Models;

namespace VirtualAssistant.Api.Controllers;

[ApiController]
[Route("api/themes")]
public class ThemesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetThemes()
    {
        var themes = await db.Themes
            .OrderBy(t => t.IsBuiltIn ? 0 : 1)
            .ThenBy(t => t.Name)
            .ToListAsync();
        return Ok(themes.Select(MapToDto));
    }

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveTheme()
    {
        var theme = await db.Themes.FirstOrDefaultAsync(t => t.IsActive)
            ?? await db.Themes.FirstOrDefaultAsync(t => t.Slug == "ocean")
            ?? await db.Themes.FirstOrDefaultAsync();

        if (theme == null)
            return Ok(null);

        return Ok(MapToDto(theme));
    }

    [HttpPost]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<IActionResult> CreateTheme(ThemeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
            return BadRequest(new { message = "Slug is required." });

        if (await db.Themes.AnyAsync(t => t.Slug == request.Slug))
            return BadRequest(new { message = "A theme with this slug already exists." });

        var theme = ApplyRequest(new Theme { IsBuiltIn = false }, request);
        db.Themes.Add(theme);
        await db.SaveChangesAsync();
        return Ok(MapToDto(theme));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<IActionResult> UpdateTheme(Guid id, ThemeRequest request)
    {
        var theme = await db.Themes.FindAsync(id);
        if (theme == null) return NotFound();

        if (theme.Slug != request.Slug && await db.Themes.AnyAsync(t => t.Slug == request.Slug && t.Id != id))
            return BadRequest(new { message = "A theme with this slug already exists." });

        ApplyRequest(theme, request);
        theme.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(MapToDto(theme));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<IActionResult> DeleteTheme(Guid id)
    {
        var theme = await db.Themes.FindAsync(id);
        if (theme == null) return NotFound();
        if (theme.IsBuiltIn) return BadRequest(new { message = "Built-in themes cannot be deleted." });

        db.Themes.Remove(theme);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/activate")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<IActionResult> ActivateTheme(Guid id)
    {
        var theme = await db.Themes.FindAsync(id);
        if (theme == null) return NotFound();

        await db.Themes.ExecuteUpdateAsync(s => s.SetProperty(t => t.IsActive, false));
        theme.IsActive = true;
        theme.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(MapToDto(theme));
    }

    private static ThemeDto MapToDto(Theme t) => new(
        t.Id, t.Name, t.Slug, t.IsActive, t.IsBuiltIn, t.IsDark,
        t.Primary, t.PrimaryDark, t.PrimaryLight,
        t.SidebarBg, t.SidebarActive, t.SidebarHover,
        t.SidebarText, t.SidebarSubtext, t.SidebarBorder,
        t.PageBg, t.CardBg, t.TextPrimary, t.TextMuted,
        t.BorderColor, t.TableHeaderBg, t.InputBg
    );

    private static Theme ApplyRequest(Theme theme, ThemeRequest r)
    {
        theme.Name = r.Name;
        theme.Slug = r.Slug;
        theme.IsDark = r.IsDark;
        theme.Primary = r.Primary;
        theme.PrimaryDark = r.PrimaryDark;
        theme.PrimaryLight = r.PrimaryLight;
        theme.SidebarBg = r.SidebarBg;
        theme.SidebarActive = r.SidebarActive;
        theme.SidebarHover = r.SidebarHover;
        theme.SidebarText = r.SidebarText;
        theme.SidebarSubtext = r.SidebarSubtext;
        theme.SidebarBorder = r.SidebarBorder;
        theme.PageBg = r.PageBg;
        theme.CardBg = r.CardBg;
        theme.TextPrimary = r.TextPrimary;
        theme.TextMuted = r.TextMuted;
        theme.BorderColor = r.BorderColor;
        theme.TableHeaderBg = r.TableHeaderBg;
        theme.InputBg = r.InputBg;
        return theme;
    }
}

public record ThemeDto(
    Guid Id, string Name, string Slug, bool IsActive, bool IsBuiltIn, bool IsDark,
    string Primary, string PrimaryDark, string PrimaryLight,
    string SidebarBg, string SidebarActive, string SidebarHover,
    string SidebarText, string SidebarSubtext, string SidebarBorder,
    string PageBg, string CardBg, string TextPrimary, string TextMuted,
    string BorderColor, string TableHeaderBg, string InputBg
);

public class ThemeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsDark { get; set; } = false;
    public string Primary { get; set; } = string.Empty;
    public string PrimaryDark { get; set; } = string.Empty;
    public string PrimaryLight { get; set; } = string.Empty;
    public string SidebarBg { get; set; } = string.Empty;
    public string SidebarActive { get; set; } = string.Empty;
    public string SidebarHover { get; set; } = string.Empty;
    public string SidebarText { get; set; } = string.Empty;
    public string SidebarSubtext { get; set; } = string.Empty;
    public string SidebarBorder { get; set; } = string.Empty;
    public string PageBg { get; set; } = string.Empty;
    public string CardBg { get; set; } = string.Empty;
    public string TextPrimary { get; set; } = string.Empty;
    public string TextMuted { get; set; } = string.Empty;
    public string BorderColor { get; set; } = string.Empty;
    public string TableHeaderBg { get; set; } = string.Empty;
    public string InputBg { get; set; } = string.Empty;
}
