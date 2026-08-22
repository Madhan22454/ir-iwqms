import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';

const API = 'http://localhost:8000/api/v1';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-900/30 text-blue-400',
  RESULT_CREATED: 'bg-indigo-900/30 text-indigo-400',
  RESULT_EVALUATED: 'bg-purple-900/30 text-purple-400',
  ALERT_CREATED: 'bg-red-900/40 text-red-400',
  ALERT_ACKNOWLEDGED: 'bg-amber-900/30 text-amber-400',
  ALERT_CLOSED: 'bg-green-900/30 text-green-400',
  ALERT_ESCALATED: 'bg-red-900/50 text-red-300',
  CORRECTIVE_ACTION_CREATED: 'bg-orange-900/30 text-orange-400',
  CORRECTIVE_ACTION_UPDATED: 'bg-orange-900/20 text-orange-300',
  REPEAT_SAMPLE_CREATED: 'bg-cyan-900/30 text-cyan-400',
  VERIFICATION_COMPLETED: 'bg-emerald-900/30 text-emerald-400',
  NOTIFICATION_CREATED: 'bg-violet-900/30 text-violet-400',
  SAMPLE_CREATED: 'bg-teal-900/30 text-teal-400',
  SYSTEM_INIT: 'bg-gray-900/30 text-gray-400',
};

export default function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/workflow/audit/?limit=200`).then(r => {
      setLogs(r.data);
      setLoading(false);
    });
  }, []);

  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-600/20 border border-violet-500/30">
            <Activity className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Audit Trail</h1>
            <p className="text-blue-300 text-sm">Complete immutable log of all system events</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/40">Loading audit log...</div>
        ) : (
          <div className="space-y-1">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs text-white/30 font-mono whitespace-nowrap pt-0.5 w-36">{fmt(log.created_at)}</div>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2 ${ACTION_COLORS[log.action] || 'bg-gray-900/30 text-gray-400'}`}>
                    {log.action}
                  </span>
                  <span className="text-white/80 text-sm">{log.details}</span>
                </div>
                <div className="ml-auto text-right text-xs">
                  <div className="text-white/40">{log.user_name}</div>
                  <div className="text-white/25">{log.user_role}</div>
                </div>
              </div>
            ))}
            {logs.length === 0 && <div className="text-center py-8 text-white/40">No audit records found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
