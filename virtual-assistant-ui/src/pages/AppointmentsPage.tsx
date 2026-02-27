import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getAppointments } from '../api/appointmentsApi';
import type { Appointment } from '../types';
import AppointmentModal from '../components/Calendar/AppointmentModal';
import '../styles/pages/Appointments.less';

const statusColor: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Rescheduled: 'bg-yellow-100 text-yellow-800',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = () => getAppointments().then(setAppointments);
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="appointments-page__header">
        <h1 className="appointments-page__title">Appointments</h1>
        <button onClick={() => setShowNew(true)}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
          + New Appointment
        </button>
      </div>

      <div className="appointments-page__table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              {['Title', 'Contact', 'Date & Time', 'Status', 'Reminders'].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No appointments yet.</td></tr>
            )}
            {appointments.map(a => (
              <tr key={a.id} onClick={() => setSelected(a)}
                className="appointments-page__row">
                <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                <td className="px-4 py-3">
                  <div className="appointments-page__contact-name">{a.contactName}</div>
                  {a.contactPhone && <div className="appointments-page__contact-phone">{a.contactPhone}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {format(new Date(a.startTime), 'MMM d, yyyy h:mm aa')}
                </td>
                <td className="px-4 py-3">
                  <span className={`appointments-page__status-badge ${statusColor[a.status] ?? 'bg-gray-100'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="appointments-page__reminder-label">
                    {a.reminderSentSms && <span className="mr-2">SMS ✓</span>}
                    {a.reminderSentEmail && <span>Email ✓</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <AppointmentModal appointment={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); load(); }} />
      )}
      {showNew && (
        <AppointmentModal
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load(); }} />
      )}
    </div>
  );
}
