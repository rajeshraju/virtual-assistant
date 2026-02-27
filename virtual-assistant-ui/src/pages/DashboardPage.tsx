import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAppointments } from '../api/appointmentsApi';
import { getPhoneCalls, getEmailLogs } from '../api/emailRulesApi';
import type { Appointment } from '../types';
import { format } from 'date-fns';
import '../styles/pages/Dashboard.less';

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
      <h1 className="dashboard__title">Dashboard</h1>

      <div className="dashboard__stat-grid">
        <div className="dashboard__stat-card">
          <p className="dashboard__stat-label">Upcoming (7 days)</p>
          <p className="dashboard__stat-value text-primary-color">{upcoming.length}</p>
        </div>
        <div className="dashboard__stat-card">
          <p className="dashboard__stat-label">Total Calls</p>
          <p className="dashboard__stat-value text-green-600">{callCount}</p>
        </div>
        <div className="dashboard__stat-card">
          <p className="dashboard__stat-label">Emails Processed</p>
          <p className="dashboard__stat-value text-purple-600">{emailCount}</p>
        </div>
      </div>

      <div className="dashboard__upcoming">
        <div className="dashboard__upcoming-header">
          <h2 className="dashboard__upcoming-title">Upcoming Appointments</h2>
          <Link to="/calendar" className="dashboard__upcoming-link">View calendar →</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="dashboard__upcoming-empty">No upcoming appointments this week.</p>
        ) : (
          <ul>
            {upcoming.map(a => (
              <li key={a.id} className="dashboard__upcoming-item">
                <div>
                  <p className="dashboard__upcoming-item-name">{a.title}</p>
                  <p className="dashboard__upcoming-item-meta">{a.contactName} · {format(new Date(a.startTime), 'MMM d, h:mm aa')}</p>
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
