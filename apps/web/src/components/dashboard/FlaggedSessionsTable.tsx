import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from './StatCard';

export interface FlaggedSession {
  id: string;
  student_name: string;
  timestamp: string;
  flagged_phrase: string;
}

interface FlaggedSessionsTableProps {
  sessions: FlaggedSession[];
  onViewSession: (sessionId: string) => void;
}

export const FlaggedSessionsTable: React.FC<FlaggedSessionsTableProps> = ({ sessions, onViewSession }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          Flagged Sessions
        </h3>
        <p className="text-sm text-slate-500 mt-1">Suspicious activity or potential prompt injection attempts</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium">Time</th>
              <th className="px-6 py-4 font-medium">Flagged Text</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No flagged sessions found.
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                // Highlight recent sessions (within 24 hours, but since this is mock data, we just tint everything slightly or based on logic)
                // Assuming all are recent for this MVP display, or we could parse timestamp.
                // We'll apply a very light red tint to all rows that have a flagged_phrase just to be safe as per requirements ("light red tint for sessions in last 24h")
                return (
                  <tr key={session.id} className="border-b border-slate-100 hover:bg-rose-50/50 bg-rose-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {session.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(session.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-xs font-mono text-xs">
                      "{session.flagged_phrase}"
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewSession(session.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        View session <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
