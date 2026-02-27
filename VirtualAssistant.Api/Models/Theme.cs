namespace VirtualAssistant.Api.Models;

public class Theme
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = false;
    public bool IsBuiltIn { get; set; } = false;
    public bool IsDark { get; set; } = false;

    // CSS variable values
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

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
