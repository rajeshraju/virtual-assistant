import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAppointments } from '../api/appointmentsApi';
import { getPhoneCalls, getEmailLogs } from '../api/emailRulesApi';
import type { Appointment } from '../types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [callCount, setCallCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);

  useEffect(() => {
    const now = new Date().toISOString();
    const weekOut = new Date(Date.now() + 7 * 86400000).toISOString();
    getAppointments(now, weekOut).then(a => setUpcoming(a.slice(0, 5)));
    getPhoneCalls(1, 1).then(r => setCallCount(r.total));
    getEmailLogs(1, 1).then(r => setEmailCount(r.total));
  }, []);

  const statusColor: Record<string, string> = {
    Scheduled: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
    Rescheduled: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <p className="text-sm text-gray-500">Upcoming (7 days)</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{upcoming.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <p className="text-sm text-gray-500">Total Calls</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{callCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <p className="text-sm text-gray-500">Emails Processed</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{emailCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Upcoming Appointments</h2>
          <Link to="/calendar" className="text-sm text-blue-600 hover:underline">View calendar →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400">No upcoming appointments this week.</p>
        ) : (
          <ul className="divide-y">
            {upcoming.map(a => (
              <li key={a.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-500">{a.contactName} · {format(new Date(a.startTime), 'MMM d, h:mm aa')}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor[a.status] ?? 'bg-gray-100'}`}>
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
