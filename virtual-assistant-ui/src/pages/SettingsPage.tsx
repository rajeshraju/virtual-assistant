import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  listUsers, createUser, updateUser, deleteUser, resetPassword,
  getSettings, saveSettings,
  type AdminUserRequest, type SystemSettings,
} from '../api/adminApi';
import {
  getThemes, createTheme, updateTheme, deleteTheme,
  emptyThemeForm, type ThemeFormData,
} from '../api/themesApi';
import type { User, Theme } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import '../styles/pages/Settings.less';

type Tab = 'users' | 'email' | 'phone' | 'appearance';

// ── Shared ────────────────────────────────────────────────────────────────────

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`settings-page__tab-btn ${active ? 'settings-page__tab-btn--active' : ''}`}
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
      <div className="settings-page__section-header">
        <h2 className="settings-page__section-title">Users</h2>
        <button onClick={openCreate}
          className="btn-primary px-4 py-2 rounded-lg text-sm">
          + Add user
        </button>
      </div>

      <div className="settings-page__table-wrap">
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
                  <span className={`settings-page__role-badge settings-page__role-badge--${u.role.toLowerCase()}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">{u.canViewEmails ? '✓' : '–'}</td>
                <td className="px-4 py-3">{u.canViewCalls ? '✓' : '–'}</td>
                <td className="px-4 py-3">{u.canViewScheduling ? '✓' : '–'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)}
                      className="text-primary-color hover:underline text-xs">Edit</button>
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

      {showForm && (
        <div className="settings-page__modal-overlay">
          <div className="settings-page__modal-panel" style={{ maxWidth: '28rem' }}>
            <h3 className="settings-page__modal-title">{editing ? 'Edit user' : 'Add user'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First name" value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="settings-page__modal-input" />
                <input required placeholder="Last name" value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="settings-page__modal-input" />
              </div>
              <input required type="email" placeholder="Email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="settings-page__modal-input" />
              <input placeholder="Phone (optional)" value={form.phoneNumber}
                onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                className="settings-page__modal-input" />
              {!editing && (
                <input required type="password" placeholder="Password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="settings-page__modal-input" />
              )}
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'Admin' | 'Staff' }))}
                className="settings-page__modal-input">
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
              <div className="space-y-1">
                <p className="settings-page__perm-label">Permissions</p>
                {([ ['canViewEmails', 'View Emails'], ['canViewCalls', 'View Phone Calls'], ['canViewScheduling', 'View Scheduling'] ] as const).map(([key, label]) => (
                  <label key={key} className="settings-page__perm-item">
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
                  className="px-4 py-2 text-sm btn-primary rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetTarget && (
        <div className="settings-page__modal-overlay">
          <div className="settings-page__modal-panel" style={{ maxWidth: '24rem' }}>
            <h3 className="settings-page__modal-title">Reset password</h3>
            <p className="settings-page__modal-subtitle">{resetTarget.email}</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input required type="password" placeholder="New password" value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="settings-page__modal-input" />
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
      <div className="settings-page__config-card">
        <h3 className="settings-page__config-title">SendGrid (Outbound Email)</h3>
        <div className="space-y-3">
          <div>
            <label className="settings-page__form-label">API Key</label>
            <input value={sg.apiKey} onChange={e => set(['sendGrid', 'apiKey'], e.target.value)}
              className="settings-page__form-input--mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="settings-page__form-label">From Email</label>
              <input value={sg.fromEmail} onChange={e => set(['sendGrid', 'fromEmail'], e.target.value)}
                className="settings-page__form-input" />
            </div>
            <div>
              <label className="settings-page__form-label">From Name</label>
              <input value={sg.fromName} onChange={e => set(['sendGrid', 'fromName'], e.target.value)}
                className="settings-page__form-input" />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-page__config-card">
        <h3 className="settings-page__config-title">IMAP (Inbound Email)</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="settings-page__form-label">Host</label>
              <input value={imap.host} onChange={e => set(['imap', 'host'], e.target.value)}
                className="settings-page__form-input" />
            </div>
            <div>
              <label className="settings-page__form-label">Port</label>
              <input type="number" value={imap.port} onChange={e => set(['imap', 'port'], Number(e.target.value))}
                className="settings-page__form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="settings-page__form-label">Username</label>
              <input value={imap.username} onChange={e => set(['imap', 'username'], e.target.value)}
                className="settings-page__form-input" />
            </div>
            <div>
              <label className="settings-page__form-label">Password / App Password</label>
              <input type="password" value={imap.password} onChange={e => set(['imap', 'password'], e.target.value)}
                className="settings-page__form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="settings-page__form-label">Poll interval (minutes)</label>
              <input type="number" value={imap.pollIntervalMinutes}
                onChange={e => set(['imap', 'pollIntervalMinutes'], Number(e.target.value))}
                className="settings-page__form-input" />
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
    <div className="settings-page__config-card">
      <h3 className="settings-page__config-title">Twilio</h3>
      <div className="space-y-3">
        <div>
          <label className="settings-page__form-label">Account SID</label>
          <input value={tw.accountSid} onChange={e => set('accountSid', e.target.value)}
            className="settings-page__form-input--mono" />
        </div>
        <div>
          <label className="settings-page__form-label">Auth Token</label>
          <input type="password" value={tw.authToken} onChange={e => set('authToken', e.target.value)}
            className="settings-page__form-input--mono" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="settings-page__form-label">From Phone Number</label>
            <input value={tw.fromPhoneNumber} onChange={e => set('fromPhoneNumber', e.target.value)}
              className="settings-page__form-input" />
          </div>
          <div>
            <label className="settings-page__form-label">Public Base URL (ngrok)</label>
            <input value={tw.publicBaseUrl} onChange={e => set('publicBaseUrl', e.target.value)}
              className="settings-page__form-input" />
          </div>
        </div>
        <p className="settings-page__config-hint">
          Set Public Base URL to your ngrok or production HTTPS URL for Twilio webhook callbacks.
        </p>
      </div>
    </div>
  );
}

// ── Appearance tab ────────────────────────────────────────────────────────────

const COLOR_FIELDS: { key: keyof ThemeFormData; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'primaryDark', label: 'Primary Dark' },
  { key: 'primaryLight', label: 'Primary Light' },
  { key: 'sidebarBg', label: 'Sidebar Background' },
  { key: 'sidebarActive', label: 'Sidebar Active' },
  { key: 'sidebarHover', label: 'Sidebar Hover' },
  { key: 'sidebarText', label: 'Sidebar Text' },
  { key: 'sidebarSubtext', label: 'Sidebar Subtext' },
  { key: 'sidebarBorder', label: 'Sidebar Border' },
  { key: 'pageBg', label: 'Page Background' },
  { key: 'cardBg', label: 'Card Background' },
  { key: 'textPrimary', label: 'Text Primary' },
  { key: 'textMuted', label: 'Text Muted' },
  { key: 'borderColor', label: 'Border Color' },
  { key: 'tableHeaderBg', label: 'Table Header Background' },
  { key: 'inputBg', label: 'Input Background' },
];

function ThemeFormModal({
  editing,
  initialData,
  onClose,
  onSaved,
}: {
  editing: Theme | null;
  initialData?: ThemeFormData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ThemeFormData>(() =>
    editing
      ? {
          name: editing.name,
          slug: editing.slug,
          isDark: editing.isDark,
          primary: editing.primary,
          primaryDark: editing.primaryDark,
          primaryLight: editing.primaryLight,
          sidebarBg: editing.sidebarBg,
          sidebarActive: editing.sidebarActive,
          sidebarHover: editing.sidebarHover,
          sidebarText: editing.sidebarText,
          sidebarSubtext: editing.sidebarSubtext,
          sidebarBorder: editing.sidebarBorder,
          pageBg: editing.pageBg,
          cardBg: editing.cardBg,
          textPrimary: editing.textPrimary,
          textMuted: editing.textMuted,
          borderColor: editing.borderColor,
          tableHeaderBg: editing.tableHeaderBg,
          inputBg: editing.inputBg,
        }
      : (initialData ?? emptyThemeForm())
  );
  const [saving, setSaving] = useState(false);

  const set = (key: keyof ThemeFormData, val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateTheme(editing.id, form);
        toast.success('Theme updated');
      } else {
        await createTheme(form);
        toast.success('Theme created');
      }
      onSaved();
    } catch {
      toast.error('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page__modal-overlay">
      <div className="settings-page__modal-panel settings-page__modal-panel--wide">
        <h3 className="settings-page__modal-title">
          {editing ? `Edit theme: ${editing.name}` : initialData ? 'Import theme' : 'New theme'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="settings-page__form-label">Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                className="settings-page__modal-input" placeholder="My Theme" />
            </div>
            <div>
              <label className="settings-page__form-label">Slug *</label>
              <input required value={form.slug}
                onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="settings-page__modal-input" placeholder="my-theme"
                disabled={editing?.isBuiltIn} />
            </div>
          </div>
          <label className="settings-page__perm-item">
            <input type="checkbox" checked={form.isDark}
              onChange={e => set('isDark', e.target.checked)} />
            Dark theme (enables dark-mode overrides for Tailwind utility classes)
          </label>
          <div className="settings-page__color-grid">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="settings-page__color-field">
                <label className="settings-page__form-label">{label}</label>
                <div className="settings-page__color-input-wrap">
                  <input
                    type="color"
                    value={(form[key] as string).startsWith('rgba') ? '#888888' : form[key] as string}
                    onChange={e => set(key, e.target.value)}
                    className="settings-page__color-picker"
                  />
                  <input
                    value={form[key] as string}
                    onChange={e => set(key, e.target.value)}
                    className="settings-page__modal-input settings-page__modal-input--mono"
                    placeholder="#000000 or rgba(...)"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm btn-primary rounded-lg">
              {saving ? 'Saving…' : 'Save theme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const THEME_JSON_KEYS: (keyof ThemeFormData)[] = [
  'name', 'slug', 'primary', 'primaryDark', 'primaryLight',
  'sidebarBg', 'sidebarActive', 'sidebarHover', 'sidebarText', 'sidebarSubtext',
  'sidebarBorder', 'pageBg', 'cardBg', 'textPrimary', 'textMuted',
  'borderColor', 'tableHeaderBg', 'inputBg',
];

function exportThemeJson(t: Theme) {
  const data: ThemeFormData = {
    name: t.name, slug: t.slug, isDark: t.isDark,
    primary: t.primary, primaryDark: t.primaryDark, primaryLight: t.primaryLight,
    sidebarBg: t.sidebarBg, sidebarActive: t.sidebarActive, sidebarHover: t.sidebarHover,
    sidebarText: t.sidebarText, sidebarSubtext: t.sidebarSubtext, sidebarBorder: t.sidebarBorder,
    pageBg: t.pageBg, cardBg: t.cardBg, textPrimary: t.textPrimary, textMuted: t.textMuted,
    borderColor: t.borderColor, tableHeaderBg: t.tableHeaderBg, inputBg: t.inputBg,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `theme-${t.slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function AppearanceTab() {
  const { activeTheme, activateTheme, refreshTheme } = useTheme();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activating, setActivating] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [importedData, setImportedData] = useState<ThemeFormData | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => getThemes().then(setThemes).catch(() => toast.error('Failed to load themes'));
  useEffect(() => { load(); }, []);

  const handleActivate = async (t: Theme) => {
    if (activating) return;
    setActivating(t.id);
    try {
      await activateTheme(t.id);
      load();
      toast.success(`Theme changed to ${t.name}`);
    } catch {
      toast.error('Failed to apply theme');
    } finally {
      setActivating('');
    }
  };

  const handleDelete = async (t: Theme) => {
    if (!confirm(`Delete theme "${t.name}"?`)) return;
    try {
      await deleteTheme(t.id);
      load();
      toast.success('Theme deleted');
    } catch {
      toast.error('Failed to delete theme');
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setImportedData(undefined);
    load();
    refreshTheme();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string) as Record<string, unknown>;
        const missing = THEME_JSON_KEYS.filter(k => !json[k]);
        if (missing.length > 0) {
          toast.error(`Missing required fields: ${missing.join(', ')}`);
          return;
        }
        const data: ThemeFormData = {
          name: String(json.name ?? ''),
          slug: String(json.slug ?? '').toLowerCase().replace(/\s+/g, '-'),
          isDark: Boolean(json.isDark),
          primary: String(json.primary ?? ''),
          primaryDark: String(json.primaryDark ?? ''),
          primaryLight: String(json.primaryLight ?? ''),
          sidebarBg: String(json.sidebarBg ?? ''),
          sidebarActive: String(json.sidebarActive ?? ''),
          sidebarHover: String(json.sidebarHover ?? ''),
          sidebarText: String(json.sidebarText ?? ''),
          sidebarSubtext: String(json.sidebarSubtext ?? ''),
          sidebarBorder: String(json.sidebarBorder ?? ''),
          pageBg: String(json.pageBg ?? ''),
          cardBg: String(json.cardBg ?? ''),
          textPrimary: String(json.textPrimary ?? ''),
          textMuted: String(json.textMuted ?? ''),
          borderColor: String(json.borderColor ?? ''),
          tableHeaderBg: String(json.tableHeaderBg ?? ''),
          inputBg: String(json.inputBg ?? ''),
        };
        setImportedData(data);
        setEditingTheme(null);
        setShowForm(true);
      } catch {
        toast.error('Invalid JSON file');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="settings-page__section-header">
        <h2 className="settings-page__section-title">Themes</h2>
        <div className="flex gap-2 items-center">
          <a href="/theme-sample.json" download="theme-sample.json"
            className="settings-page__import-link">
            Download sample JSON
          </a>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button onClick={() => fileInputRef.current?.click()}
            className="settings-page__import-btn">
            Import JSON
          </button>
          <button onClick={() => { setImportedData(undefined); setEditingTheme(null); setShowForm(true); }}
            className="btn-primary px-4 py-2 rounded-lg text-sm">
            + New theme
          </button>
        </div>
      </div>

      <div className="settings-page__theme-grid">
        {themes.map(t => (
          <div key={t.id}
            className={`settings-page__theme-card ${t.id === activeTheme?.id ? 'settings-page__theme-card--active' : ''}`}>
            <div className="settings-page__theme-preview">
              <div className="settings-page__theme-preview-sidebar" style={{ backgroundColor: t.sidebarBg }} />
              <div className="settings-page__theme-preview-content" style={{ backgroundColor: t.pageBg }}>
                <div className="settings-page__theme-preview-bar" style={{ backgroundColor: t.primary }} />
                <div className="settings-page__theme-preview-line" />
                <div className="settings-page__theme-preview-line" />
              </div>
            </div>
            <div className="settings-page__theme-label">
              {t.name}
              {t.isBuiltIn && <span className="settings-page__theme-built-in-badge">built-in</span>}
              {t.id === activeTheme?.id && <span className="text-primary-color ml-1">✓</span>}
            </div>
            <div className="settings-page__theme-actions">
              {t.id !== activeTheme?.id && (
                <button onClick={() => handleActivate(t)} disabled={!!activating}
                  className="settings-page__theme-action-btn settings-page__theme-action-btn--apply">
                  Apply
                </button>
              )}
              <button onClick={() => { setImportedData(undefined); setEditingTheme(t); setShowForm(true); }}
                className="settings-page__theme-action-btn">
                Edit
              </button>
              <button onClick={() => exportThemeJson(t)}
                className="settings-page__theme-action-btn">
                Export
              </button>
              {!t.isBuiltIn && (
                <button onClick={() => handleDelete(t)}
                  className="settings-page__theme-action-btn settings-page__theme-action-btn--delete">
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="settings-page__theme-hint">
        The active theme is applied site-wide for all users immediately.
        Built-in themes can be edited but not deleted. Use Export/Import to share themes as JSON files.
      </p>

      {showForm && (
        <ThemeFormModal
          editing={editingTheme}
          initialData={importedData}
          onClose={() => { setShowForm(false); setImportedData(undefined); }}
          onSaved={handleSaved}
        />
      )}
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
    <div className="settings-page">
      <h1 className="settings-page__title">Settings</h1>

      <div className="settings-page__tab-bar">
        <TabButton label="Users" active={tab === 'users'} onClick={() => setTab('users')} />
        <TabButton label="Email Config" active={tab === 'email'} onClick={() => setTab('email')} />
        <TabButton label="Phone Config" active={tab === 'phone'} onClick={() => setTab('phone')} />
        <TabButton label="Appearance" active={tab === 'appearance'} onClick={() => setTab('appearance')} />
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'appearance' && <AppearanceTab />}

      {tab === 'email' && (
        settingsLoading
          ? <div className="text-gray-500 py-8 text-center">Loading…</div>
          : (
            <>
              <EmailConfigTab settings={settings} onChange={setSettings} />
              <div className="mt-6 flex justify-end">
                <button onClick={handleSaveSettings} disabled={saving}
                  className="btn-primary px-6 py-2 rounded-lg text-sm">
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
                  className="btn-primary px-6 py-2 rounded-lg text-sm">
                  {saving ? 'Saving…' : 'Save Phone Settings'}
                </button>
              </div>
            </>
          )
      )}
    </div>
  );
}
