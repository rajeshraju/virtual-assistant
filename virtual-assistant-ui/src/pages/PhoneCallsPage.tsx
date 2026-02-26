import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getPhoneCalls } from '../api/emailRulesApi';
import type { PhoneCall, PaginatedResponse } from '../types';

export default function PhoneCallsPage() {
  const [data, setData] = useState<PaginatedResponse<PhoneCall>>({ total: 0, page: 1, pageSize: 20, items: [] });
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getPhoneCalls(page, 20).then(setData);
  }, [page]);

  const statusColor: Record<string, string> = {
    completed: 'text-green-600',
    failed: 'text-red-600',
    'in-progress': 'text-blue-600',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Phone Calls</h1>
      <p className="text-sm text-gray-500 mb-4">{data.total} calls logged</p>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              {['Direction', 'From', 'Date', 'Status', 'Duration', 'Recording'].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No calls logged yet.</td></tr>
            )}
            {data.items.map(call => (
              <>
                <tr key={call.id} onClick={() => setExpanded(expanded === call.id ? null : call.id)}
                  className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      call.direction === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>{call.direction}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{call.from}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {format(new Date(call.callStartedAt), 'MMM d, h:mm aa')}
                  </td>
                  <td className={`px-4 py-3 text-xs font-medium capitalize ${statusColor[call.status] ?? 'text-gray-500'}`}>
                    {call.status}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {call.duration != null ? `${call.duration}s` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {call.recordingUrl
                      ? <a href={call.recordingUrl} target="_blank" rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs" onClick={e => e.stopPropagation()}>
                          Listen
                        </a>
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                </tr>
                {expanded === call.id && call.transcriptionText && (
                  <tr key={`${call.id}-exp`} className="bg-gray-50">
                    <td colSpan={6} className="px-4 py-3 text-sm text-gray-600 italic">
                      Transcript: {call.transcriptionText}
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
