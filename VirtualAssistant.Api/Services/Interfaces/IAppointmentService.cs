using VirtualAssistant.Api.DTOs.Appointments;
using VirtualAssistant.Api.Models;

namespace VirtualAssistant.Api.Services.Interfaces;

public interface IAppointmentService
{
    Task<List<AppointmentResponse>> GetAllAsync(Guid userId, DateTime? start, DateTime? end);
    Task<AppointmentResponse?> GetByIdAsync(Guid id, Guid userId);
    Task<AppointmentResponse> CreateAsync(Guid userId, CreateAppointmentRequest request);
    Task<AppointmentResponse?> UpdateAsync(Guid id, Guid userId, UpdateAppointmentRequest request);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<AppointmentResponse?> RescheduleAsync(Guid id, Guid userId, RescheduleRequest request);
    Task<bool> SendReminderAsync(Guid id, Guid userId);
}
