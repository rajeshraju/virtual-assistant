using Microsoft.EntityFrameworkCore;
using VirtualAssistant.Api.Data;
using VirtualAssistant.Api.DTOs.EmailRules;
using VirtualAssistant.Api.Models;
using VirtualAssistant.Api.Services.Interfaces;

namespace VirtualAssistant.Api.Services;

public class EmailRuleService(AppDbContext db) : IEmailRuleService
{
    public async Task<List<EmailRuleResponse>> GetAllAsync(Guid userId)
    {
        var rules = await db.EmailRules
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.Priority)
            .ToListAsync();
        return rules.Select(ToResponse).ToList();
    }

    public async Task<EmailRuleResponse?> GetByIdAsync(Guid id, Guid userId)
    {
        var rule = await db.EmailRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        return rule == null ? null : ToResponse(rule);
    }

    public async Task<EmailRuleResponse> CreateAsync(Guid userId, CreateEmailRuleRequest request)
    {
        var rule = new EmailRule
        {
            UserId = userId,
            Name = request.Name,
            IsActive = request.IsActive,
            MatchField = request.MatchField,
            MatchOperator = request.MatchOperator,
            MatchValue = request.MatchValue,
            ReplyTemplate = request.ReplyTemplate,
            Priority = request.Priority,
        };
        db.EmailRules.Add(rule);
        await db.SaveChangesAsync();
        return ToResponse(rule);
    }

    public async Task<EmailRuleResponse?> UpdateAsync(Guid id, Guid userId, UpdateEmailRuleRequest request)
    {
        var rule = await db.EmailRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (rule == null) return null;

        if (request.Name != null) rule.Name = request.Name;
        if (request.MatchField != null) rule.MatchField = request.MatchField;
        if (request.MatchOperator != null) rule.MatchOperator = request.MatchOperator;
        if (request.MatchValue != null) rule.MatchValue = request.MatchValue;
        if (request.ReplyTemplate != null) rule.ReplyTemplate = request.ReplyTemplate;
        if (request.Priority.HasValue) rule.Priority = request.Priority.Value;
        if (request.IsActive.HasValue) rule.IsActive = request.IsActive.Value;
        rule.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return ToResponse(rule);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var rule = await db.EmailRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (rule == null) return false;
        db.EmailRules.Remove(rule);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleAsync(Guid id, Guid userId)
    {
        var rule = await db.EmailRules.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (rule == null) return false;
        rule.IsActive = !rule.IsActive;
        rule.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    private static EmailRuleResponse ToResponse(EmailRule r) => new()
    {
        Id = r.Id,
        Name = r.Name,
        IsActive = r.IsActive,
        MatchField = r.MatchField,
        MatchOperator = r.MatchOperator,
        MatchValue = r.MatchValue,
        ReplyTemplate = r.ReplyTemplate,
        Priority = r.Priority,
        CreatedAt = r.CreatedAt,
        UpdatedAt = r.UpdatedAt,
    };
}
