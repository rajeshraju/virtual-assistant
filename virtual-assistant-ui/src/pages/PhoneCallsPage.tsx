import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getPhoneCalls } from '../api/emailRulesApi';
import type { PhoneCall, PaginatedResponse } from '../types';
import '../styles/pages/PhoneCalls.less';

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
      <h1 className="phone-calls-page__title">Phone Calls</h1>
      <p className="phone-calls-page__subtitle">{data.total} calls logged</p>

      <div className="phone-calls-page__table-wrap">
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
                  className="phone-calls-page__row">
                  <td className="px-4 py-3">
                    <span className={`phone-calls-page__direction-badge phone-calls-page__direction-badge--${call.direction}`}>
                      {call.direction}
                    </span>
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
                          className="phone-calls-page__recording-link" onClick={e => e.stopPropagation()}>
                          Listen
                        </a>
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                </tr>
                {expanded === call.id && call.transcriptionText && (
                  <tr key={`${call.id}-exp`} className="phone-calls-page__row-expanded">
                    <td colSpan={6} className="px-4 py-3 phone-calls-page__transcript">
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
        <div className="phone-calls-page__pagination">
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
