import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getAppointments } from '../api/appointmentsApi';
import type { Appointment } from '../types';
import AppointmentModal from '../components/Calendar/AppointmentModal';

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <button onClick={() => setShowNew(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
                className="cursor-pointer hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{a.title}</td>
                <td className="px-4 py-3 text-gray-600">
                  <div>{a.contactName}</div>
                  {a.contactPhone && <div className="text-xs text-gray-400">{a.contactPhone}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {format(new Date(a.startTime), 'MMM d, yyyy h:mm aa')}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[a.status] ?? 'bg-gray-100'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {a.reminderSentSms && <span className="mr-2">SMS ✓</span>}
                  {a.reminderSentEmail && <span>Email ✓</span>}
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
