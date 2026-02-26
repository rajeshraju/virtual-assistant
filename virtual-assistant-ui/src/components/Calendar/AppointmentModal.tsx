import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Appointment } from '../../types';
import { createAppointment, updateAppointment, deleteAppointment, sendReminder, rescheduleAppointment } from '../../api/appointmentsApi';
import toast from 'react-hot-toast';

interface Props {
  appointment?: Appointment | null;
  defaultStart?: Date;
  defaultEnd?: Date;
  onClose: () => void;
  onSaved: () => void;
}

const toDatetimeLocal = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

export default function AppointmentModal({ appointment, defaultStart, defaultEnd, onClose, onSaved }: Props) {
  const isEdit = !!appointment;
  const [form, setForm] = useState({
    title: '',
    description: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    startTime: toDatetimeLocal(defaultStart ?? new Date()),
    endTime: toDatetimeLocal(defaultEnd ?? new Date(Date.now() + 3600000)),
    reminderMinutesBefore: 60,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'edit' | 'reschedule'>('edit');

  useEffect(() => {
    if (appointment) {
      setForm({
        title: appointment.title,
        description: appointment.description ?? '',
        contactName: appointment.contactName,
        contactEmail: appointment.contactEmail ?? '',
        contactPhone: appointment.contactPhone ?? '',
        startTime: toDatetimeLocal(new Date(appointment.startTime)),
        endTime: toDatetimeLocal(new Date(appointment.endTime)),
        reminderMinutesBefore: appointment.reminderMinutesBefore,
        notes: appointment.notes ?? '',
      });
    }
  }, [appointment]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...form, reminderMinutesBefore: Number(form.reminderMinutesBefore) };
      if (isEdit) {
        if (mode === 'reschedule') {
          await rescheduleAppointment(appointment!.id, new Date(form.startTime).toISOString(), new Date(form.endTime).toISOString());
          toast.success('Appointment rescheduled. Contact notified.');
        } else {
          await updateAppointment(appointment!.id, payload);
          toast.success('Appointment updated.');
        }
      } else {
        await createAppointment(payload);
        toast.success('Appointment created.');
      }
      onSaved();
    } catch {
      toast.error('Failed to save appointment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment || !confirm('Cancel this appointment?')) return;
    setLoading(true);
    try {
      await deleteAppointment(appointment.id);
      toast.success('Appointment cancelled.');
      onSaved();
    } catch {
      toast.error('Failed to cancel.');
    } finally {
      setLoading(false);
    }
  };

  const handleReminder = async () => {
    if (!appointment) return;
    try {
      await sendReminder(appointment.id);
      toast.success('Reminder sent.');
    } catch {
      toast.error('Failed to send reminder.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">{isEdit ? 'Edit Appointment' : 'New Appointment'}</h2>
          {isEdit && (
            <div className="flex gap-2 text-sm">
              <button onClick={() => setMode('edit')}
                className={`px-3 py-1 rounded-lg ${mode === 'edit' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                Edit
              </button>
              <button onClick={() => setMode('reschedule')}
                className={`px-3 py-1 rounded-lg ${mode === 'reschedule' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                Reschedule
              </button>
            </div>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 ml-4 text-xl">×</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <Field label="Title *" value={form.title} onChange={set('title')} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Time *" type="datetime-local" value={form.startTime} onChange={set('startTime')} />
            <Field label="End Time *" type="datetime-local" value={form.endTime} onChange={set('endTime')} />
          </div>
          {mode !== 'reschedule' && (
            <>
              <Field label="Contact Name *" value={form.contactName} onChange={set('contactName')} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Contact Email" type="email" value={form.contactEmail} onChange={set('contactEmail')} />
                <Field label="Contact Phone" type="tel" value={form.contactPhone} onChange={set('contactPhone')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remind before (minutes)</label>
                <select value={form.reminderMinutesBefore} onChange={set('reminderMinutesBefore')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {[15, 30, 60, 120, 1440].map(v => (
                    <option key={v} value={v}>{v < 60 ? `${v} min` : v === 1440 ? '1 day' : `${v / 60} hr`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3 justify-between">
          <div className="flex gap-2">
            {isEdit && (
              <>
                <button onClick={handleDelete} disabled={loading}
                  className="text-sm px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                  Cancel Appt
                </button>
                <button onClick={handleReminder}
                  className="text-sm px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg">
                  Send Reminder
                </button>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="text-sm px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
              Close
            </button>
            <button onClick={handleSave} disabled={loading}
              className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Saving…' : mode === 'reschedule' ? 'Reschedule' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange }: {
  label: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
