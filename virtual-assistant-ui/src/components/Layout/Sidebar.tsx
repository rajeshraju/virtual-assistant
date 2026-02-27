import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/layout/Sidebar.less';

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
    <aside className="sidebar">
      <div className="sidebar__header">
        <h1 className="sidebar__title">Virtual Assistant</h1>
        <p className="sidebar__subtitle">
          {user?.firstName} {user?.lastName}
        </p>
        {user?.role === 'Admin' && (
          <span className="sidebar__badge">Admin</span>
        )}
      </div>
      <nav className="sidebar__nav space-y-1">
        {links.filter(l => l.show).map(l => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'nav-link-active' : 'nav-link'
              }`
            }>
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">
        <button onClick={logout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm nav-link">
          Sign out
        </button>
      </div>
    </aside>
  );
}
