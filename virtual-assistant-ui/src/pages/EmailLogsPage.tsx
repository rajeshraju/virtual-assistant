import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getEmailLogs } from '../api/emailRulesApi';
import type { EmailLog, PaginatedResponse } from '../types';

export default function EmailLogsPage() {
  const [data, setData] = useState<PaginatedResponse<EmailLog>>({ total: 0, page: 1, pageSize: 20, items: [] });
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getEmailLogs(page, 20).then(setData);
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Logs</h1>
      <p className="text-sm text-gray-500 mb-4">{data.total} emails processed by IMAP polling</p>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              {['From', 'Subject', 'Received', 'Rule Matched', 'Auto-Reply'].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No emails processed yet.</td></tr>
            )}
            {data.items.map(log => (
              <>
                <tr key={log.id} onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{log.from}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{log.subject}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {format(new Date(log.receivedAt), 'MMM d, h:mm aa')}
                  </td>
                  <td className="px-4 py-3">
                    {log.ruleMatchedName
                      ? <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">{log.ruleMatchedName}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {log.autoReplySent
                      ? <span className="text-green-600 text-xs font-medium">Sent ✓</span>
                      : <span className="text-gray-400 text-xs">No</span>}
                  </td>
                </tr>
                {expanded === log.id && log.bodySnippet && (
                  <tr key={`${log.id}-exp`} className="bg-gray-50">
                    <td colSpan={5} className="px-4 py-3 text-sm text-gray-600 italic">
                      {log.bodySnippet}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {data.total > data.pageSize && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-500">Page {page}</span>
          <button disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border rounded text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
