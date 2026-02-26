import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  listUsers, createUser, updateUser, deleteUser, resetPassword,
  getSettings, saveSettings,
  type AdminUserRequest, type SystemSettings,
} from '../api/adminApi';
import type { User } from '../types';
import toast from 'react-hot-toast';

type Tab = 'users' | 'email' | 'phone';

// ── Shared ────────────────────────────────────────────────────────────────────

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

const emptyUser: AdminUserRequest = {
  email: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  password: '',
  role: 'Staff',
  canViewEmails: true,
  canViewCalls: true,
  canViewScheduling: true,
};

function UsersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<AdminUserRequest>(emptyUser);
  const [showForm, setShowForm] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  const load = () => {
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyUser);
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phoneNumber: u.phoneNumber ?? '',
      password: '',
      role: u.role,
      canViewEmails: u.canViewEmails,
      canViewCalls: u.canViewCalls,
      canViewScheduling: u.canViewScheduling,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateUser(editing.id, form);
        toast.success('User updated');
      } else {
        await createUser(form);
        toast.success('User created');
      }
      setShowForm(false);
      load();
    } catch {
      toast.error('Save failed');
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete ${u.email}?`)) return;
    try {
      await deleteUser(u.id);
      toast.success('User deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    try {
      await resetPassword(resetTarget.id, newPw);
      toast.success('Password reset');
      setResetTarget(null);
      setNewPw('');
    } catch {
      toast.error('Reset failed');
    }
  };

  if (loading) return <div className="text-gray-500 py-8 text-center">Loading users…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Users</h2>
        <button onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Add user
        </button>
      </div>

      {/* User table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Email', 'Role', 'Emails', 'Calls', 'Scheduling', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">{u.canViewEmails ? '✓' : '–'}</td>
                <td className="px-4 py-3">{u.canViewCalls ? '✓' : '–'}</td>
                <td className="px-4 py-3">{u.canViewScheduling ? '✓' : '–'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)}
                      className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => { setResetTarget(u); setNewPw(''); }}
                      className="text-yellow-600 hover:underline text-xs">Reset pw</button>
                    {u.id !== me?.id && (
                      <button onClick={() => handleDelete(u)}
                        className="text-red-600 hover:underline text-xs">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit user' : 'Add user'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First name" value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm" />
                <input required placeholder="Last name" value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm" />
              </div>
              <input required type="email" placeholder="Email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Phone (optional)" value={form.phoneNumber}
                onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              {!editing && (
                <input required type="password" placeholder="Password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              )}
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'Admin' | 'Staff' }))}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600 mb-1">Permissions</p>
                {([ ['canViewEmails', 'View Emails'], ['canViewCalls', 'View Phone Calls'], ['canViewScheduling', 'View Scheduling'] ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-1">Reset password</h3>
            <p className="text-sm text-gray-500 mb-4">{resetTarget.email}</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input required type="password" placeholder="New password" value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setResetTarget(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Email Config tab ──────────────────────────────────────────────────────────

function EmailConfigTab({ settings, onChange }: {
  settings: SystemSettings;
  onChange: (s: SystemSettings) => void;
}) {
  const sg = settings.sendGrid;
  const imap = settings.imap;
  const set = (path: string[], val: string | number | boolean) => {
    const next = structuredClone(settings);
    let obj: Record<string, unknown> = next as unknown as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] as Record<string, unknown>;
    obj[path[path.length - 1]] = val;
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">SendGrid (Outbound Email)</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <input value={sg.apiKey} onChange={e => set(['sendGrid', 'apiKey'], e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Email</label>
              <input value={sg.fromEmail} onChange={e => set(['sendGrid', 'fromEmail'], e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Name</label>
              <input value={sg.fromName} onChange={e => set(['sendGrid', 'fromName'], e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">IMAP (Inbound Email)</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Host</label>
              <input value={imap.host} onChange={e => set(['imap', 'host'], e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
              <input type="number" value={imap.port} onChange={e => set(['imap', 'port'], Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
              <input value={imap.username} onChange={e => set(['imap', 'username'], e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password / App Password</label>
              <input type="password" value={imap.password} onChange={e => set(['imap', 'password'], e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Poll interval (minutes)</label>
              <input type="number" value={imap.pollIntervalMinutes}
                onChange={e => set(['imap', 'pollIntervalMinutes'], Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm mt-5">
              <input type="checkbox" checked={imap.useSsl}
                onChange={e => set(['imap', 'useSsl'], e.target.checked)} />
              Use SSL
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Phone Config tab ──────────────────────────────────────────────────────────

function PhoneConfigTab({ settings, onChange }: {
  settings: SystemSettings;
  onChange: (s: SystemSettings) => void;
}) {
  const tw = settings.twilio;
  const set = (key: keyof SystemSettings['twilio'], val: string) => {
    onChange({ ...settings, twilio: { ...tw, [key]: val } });
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Twilio</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Account SID</label>
          <input value={tw.accountSid} onChange={e => set('accountSid', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Auth Token</label>
          <input type="password" value={tw.authToken} onChange={e => set('authToken', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Phone Number</label>
            <input value={tw.fromPhoneNumber} onChange={e => set('fromPhoneNumber', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Public Base URL (ngrok)</label>
            <input value={tw.publicBaseUrl} onChange={e => set('publicBaseUrl', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Set Public Base URL to your ngrok or production HTTPS URL for Twilio webhook callbacks.
        </p>
      </div>
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

const defaultSettings: SystemSettings = {
  twilio: { accountSid: '', authToken: '', fromPhoneNumber: '', publicBaseUrl: '' },
  sendGrid: { apiKey: '', fromEmail: '', fromName: '' },
  imap: { host: '', port: 993, useSsl: true, username: '', password: '', pollIntervalMinutes: 5 },
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setSettingsLoading(false));
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      toast.success('Settings saved (restart server to apply)');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-6">
        <TabButton label="Users" active={tab === 'users'} onClick={() => setTab('users')} />
        <TabButton label="Email Config" active={tab === 'email'} onClick={() => setTab('email')} />
        <TabButton label="Phone Config" active={tab === 'phone'} onClick={() => setTab('phone')} />
      </div>

      {tab === 'users' && <UsersTab />}

      {tab === 'email' && (
        settingsLoading
          ? <div className="text-gray-500 py-8 text-center">Loading…</div>
          : (
            <>
              <EmailConfigTab settings={settings} onChange={setSettings} />
              <div className="mt-6 flex justify-end">
                <button onClick={handleSaveSettings} disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Email Settings'}
                </button>
              </div>
            </>
          )
      )}

      {tab === 'phone' && (
        settingsLoading
          ? <div className="text-gray-500 py-8 text-center">Loading…</div>
          : (
            <>
              <PhoneConfigTab settings={settings} onChange={setSettings} />
              <div className="mt-6 flex justify-end">
                <button onClick={handleSaveSettings} disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Phone Settings'}
                </button>
              </div>
            </>
          )
      )}
    </div>
  );
}
