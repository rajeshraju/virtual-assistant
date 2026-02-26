import { useEffect, useState } from 'react';
import { getEmailRules, createEmailRule, updateEmailRule, deleteEmailRule, toggleEmailRule } from '../api/emailRulesApi';
import type { EmailRule } from '../types';
import toast from 'react-hot-toast';

const MATCH_FIELDS = ['Subject', 'Body', 'From', 'Any'];
const MATCH_OPERATORS = ['Contains', 'StartsWith', 'EndsWith', 'Equals', 'Regex'];

const TEMPLATE_HELP = `Available variables: {{SenderName}}, {{SenderEmail}}, {{Subject}}, {{ReceivedAt}}`;

export default function EmailRulesPage() {
  const [rules, setRules] = useState<EmailRule[]>([]);
  const [editing, setEditing] = useState<Partial<EmailRule> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = () => getEmailRules().then(setRules);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    try {
      if (isNew) {
        await createEmailRule(editing);
        toast.success('Rule created.');
      } else {
        await updateEmailRule(editing.id!, editing);
        toast.success('Rule updated.');
      }
      setEditing(null);
      load();
    } catch {
      toast.error('Failed to save rule.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await deleteEmailRule(id);
      toast.success('Rule deleted.');
      load();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleToggle = async (id: string) => {
    await toggleEmailRule(id);
    load();
  };

  const startNew = () => {
    setEditing({ name: '', matchField: 'Subject', matchOperator: 'Contains', matchValue: '', replyTemplate: '', priority: 0, isActive: true });
    setIsNew(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Rules</h1>
        <button onClick={startNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.length === 0 && <p className="text-gray-400 text-sm">No email rules yet.</p>}
        {rules.map(rule => (
          <div key={rule.id} className="bg-white rounded-xl border shadow-sm p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-medium text-gray-900">{rule.name}</span>
                <span className="text-xs text-gray-400">Priority {rule.priority}</span>
              </div>
              <p className="text-sm text-gray-600">
                If <strong>{rule.matchField}</strong> <em>{rule.matchOperator}</em> "<code>{rule.matchValue}</code>"
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">Reply: {rule.replyTemplate.slice(0, 80)}…</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleToggle(rule.id)}
                className="text-xs px-2 py-1 border rounded text-gray-600 hover:bg-gray-50">
                {rule.isActive ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => { setEditing({ ...rule }); setIsNew(false); }}
                className="text-xs px-2 py-1 border rounded text-blue-600 hover:bg-blue-50">
                Edit
              </button>
              <button onClick={() => handleDelete(rule.id)}
                className="text-xs px-2 py-1 border rounded text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-lg">{isNew ? 'New Email Rule' : 'Edit Rule'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <LabeledInput label="Rule Name" value={editing.name ?? ''} onChange={v => setEditing(e => ({ ...e!, name: v }))} />
              <div className="grid grid-cols-2 gap-4">
                <LabeledSelect label="Match Field" value={editing.matchField ?? 'Subject'} options={MATCH_FIELDS}
                  onChange={v => setEditing(e => ({ ...e!, matchField: v as EmailRule['matchField'] }))} />
                <LabeledSelect label="Match Operator" value={editing.matchOperator ?? 'Contains'} options={MATCH_OPERATORS}
                  onChange={v => setEditing(e => ({ ...e!, matchOperator: v as EmailRule['matchOperator'] }))} />
              </div>
              <LabeledInput label="Match Value" value={editing.matchValue ?? ''} onChange={v => setEditing(e => ({ ...e!, matchValue: v }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reply Template</label>
                <textarea rows={4} value={editing.replyTemplate ?? ''} onChange={e => setEditing(prev => ({ ...prev!, replyTemplate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
                <p className="text-xs text-gray-400 mt-1">{TEMPLATE_HELP}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <LabeledInput label="Priority (0=highest)" type="number" value={String(editing.priority ?? 0)}
                  onChange={v => setEditing(e => ({ ...e!, priority: Number(v) }))} />
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" id="active" checked={editing.isActive ?? true}
                    onChange={e => setEditing(prev => ({ ...prev!, isActive: e.target.checked }))} />
                  <label htmlFor="active" className="text-sm text-gray-700">Active</label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="text-sm px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}

function LabeledSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
