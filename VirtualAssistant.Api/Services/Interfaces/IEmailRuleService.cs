using VirtualAssistant.Api.DTOs.EmailRules;

namespace VirtualAssistant.Api.Services.Interfaces;

public interface IEmailRuleService
{
    Task<List<EmailRuleResponse>> GetAllAsync(Guid userId);
    Task<EmailRuleResponse?> GetByIdAsync(Guid id, Guid userId);
    Task<EmailRuleResponse> CreateAsync(Guid userId, CreateEmailRuleRequest request);
    Task<EmailRuleResponse?> UpdateAsync(Guid id, Guid userId, UpdateEmailRuleRequest request);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<bool> ToggleAsync(Guid id, Guid userId);
}
