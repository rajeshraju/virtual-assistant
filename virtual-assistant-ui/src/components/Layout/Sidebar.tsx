import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠', show: true },
    { to: '/calendar', label: 'Calendar', icon: '📅', show: user?.canViewScheduling !== false },
    { to: '/appointments', label: 'Appointments', icon: '🗓️', show: user?.canViewScheduling !== false },
    { to: '/calls', label: 'Phone Calls', icon: '📞', show: user?.canViewCalls !== false },
    { to: '/email-rules', label: 'Email Rules', icon: '✉️', show: user?.canViewEmails !== false },
    { to: '/email-logs', label: 'Email Logs', icon: '📬', show: user?.canViewEmails !== false },
    { to: '/settings', label: 'Settings', icon: '⚙️', show: user?.role === 'Admin' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold">Virtual Assistant</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.firstName} {user?.lastName}</p>
        {user?.role === 'Admin' && (
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded mt-1 inline-block">Admin</span>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.filter(l => l.show).map(l => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }>
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <button onClick={logout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800">
          Sign out
        </button>
      </div>
    </aside>
  );
}
