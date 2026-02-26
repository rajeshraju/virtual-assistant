import { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, type Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Appointment } from '../types';
import { getAppointments } from '../api/appointmentsApi';
import AppointmentModal from '../components/Calendar/AppointmentModal';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } });

const statusBg: Record<string, string> = {
  Scheduled: '#3b82f6',
  Completed: '#22c55e',
  Cancelled: '#ef4444',
  Rescheduled: '#f59e0b',
};

interface CalEvent extends Event {
  resource: Appointment;
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [newSlot, setNewSlot] = useState<{ start: Date; end: Date } | null>(null);

  const load = useCallback(() => {
    getAppointments().then(setAppointments);
  }, []);

  useEffect(() => { load(); }, [load]);

  const events: CalEvent[] = appointments.map(a => ({
    title: `${a.title} — ${a.contactName}`,
    start: new Date(a.startTime),
    end: new Date(a.endTime),
    resource: a,
  }));

  const eventStyleGetter = (event: CalEvent) => ({
    style: { backgroundColor: statusBg[event.resource.status] ?? '#6b7280', borderRadius: '4px', border: 'none' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Appointment Calendar</h1>
      <div className="bg-white rounded-xl shadow-sm border p-4" style={{ height: '75vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(ev: CalEvent) => setSelectedAppt(ev.resource)}
          onSelectSlot={({ start, end }: { start: Date; end: Date }) => setNewSlot({ start, end })}
          selectable
        />
      </div>

      {selectedAppt && (
        <AppointmentModal
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onSaved={() => { setSelectedAppt(null); load(); }}
        />
      )}

      {newSlot && (
        <AppointmentModal
          defaultStart={newSlot.start}
          defaultEnd={newSlot.end}
          onClose={() => setNewSlot(null)}
          onSaved={() => { setNewSlot(null); load(); }}
        />
      )}
    </div>
  );
}
