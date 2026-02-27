import { useEffect, useState } from 'react';
import { getEmailRules, createEmailRule, updateEmailRule, deleteEmailRule, toggleEmailRule } from '../api/emailRulesApi';
import type { EmailRule } from '../types';
import toast from 'react-hot-toast';
import '../styles/pages/EmailRules.less';

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
      <div className="email-rules-page__header">
        <h1 className="email-rules-page__title">Email Rules</h1>
        <button onClick={startNew}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
          + New Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.length === 0 && <p className="email-rules-page__empty">No email rules yet.</p>}
        {rules.map(rule => (
          <div key={rule.id} className="email-rules-page__rule-card">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`email-rules-page__rule-indicator email-rules-page__rule-indicator--${rule.isActive ? 'active' : 'inactive'}`} />
                <span className="email-rules-page__rule-name">{rule.name}</span>
                <span className="email-rules-page__rule-priority">Priority {rule.priority}</span>
              </div>
              <p className="email-rules-page__rule-desc">
                If <strong>{rule.matchField}</strong> <em>{rule.matchOperator}</em> "<code>{rule.matchValue}</code>"
              </p>
              <p className="email-rules-page__rule-preview truncate">Reply: {rule.replyTemplate.slice(0, 80)}…</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleToggle(rule.id)}
                className="text-xs px-2 py-1 border rounded text-gray-600 hover:bg-gray-50">
                {rule.isActive ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => { setEditing({ ...rule }); setIsNew(false); }}
                className="text-xs px-2 py-1 border rounded text-primary-color hover:bg-primary-light border-primary-color">
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
        <div className="email-rules-page__modal-overlay">
          <div className="email-rules-page__modal-panel">
            <div className="email-rules-page__modal-header">
              <h2 className="email-rules-page__modal-title">{isNew ? 'New Email Rule' : 'Edit Rule'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="email-rules-page__modal-body space-y-4">
              <LabeledInput label="Rule Name" value={editing.name ?? ''} onChange={v => setEditing(e => ({ ...e!, name: v }))} />
              <div className="grid grid-cols-2 gap-4">
                <LabeledSelect label="Match Field" value={editing.matchField ?? 'Subject'} options={MATCH_FIELDS}
                  onChange={v => setEditing(e => ({ ...e!, matchField: v as EmailRule['matchField'] }))} />
                <LabeledSelect label="Match Operator" value={editing.matchOperator ?? 'Contains'} options={MATCH_OPERATORS}
                  onChange={v => setEditing(e => ({ ...e!, matchOperator: v as EmailRule['matchOperator'] }))} />
              </div>
              <LabeledInput label="Match Value" value={editing.matchValue ?? ''} onChange={v => setEditing(e => ({ ...e!, matchValue: v }))} />
              <div>
                <label className="email-rules-page__label">Reply Template</label>
                <textarea rows={4} value={editing.replyTemplate ?? ''} onChange={e => setEditing(prev => ({ ...prev!, replyTemplate: e.target.value }))}
                  className="email-rules-page__textarea" />
                <p className="email-rules-page__hint">{TEMPLATE_HELP}</p>
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
            <div className="email-rules-page__modal-footer">
              <button onClick={() => setEditing(null)} className="text-sm px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="text-sm px-4 py-2 btn-primary rounded-lg">Save</button>
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
      <label className="email-rules-page__label">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="email-rules-page__input" />
    </div>
  );
}

function LabeledSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="email-rules-page__label">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="email-rules-page__select">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
