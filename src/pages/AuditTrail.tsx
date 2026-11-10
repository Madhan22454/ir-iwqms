import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';

import { API_URL as API } from '../config/api';

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
    <div className="ir-page">
      <div className="ir-container space-y-6">
        <div className="ir-header-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/15 border border-violet-500/30">
              <Activity className="w-7 h-7 text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                System Audit Trail
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Complete immutable security and compliance ledger of all operational events
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="ir-card text-center py-16" style={{ color: 'var(--text-muted)' }}>
            Loading audit log entries...
          </div>
        ) : (
          <div className="ir-card p-4 space-y-2">
            {logs.map(log => (
              <div 
                key={log.id} 
                className="flex items-start gap-4 p-3.5 rounded-xl transition-colors"
                style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)' }}
              >
                <div className="text-xs font-mono whitespace-nowrap pt-0.5 w-40" style={{ color: 'var(--text-muted)' }}>
                  {fmt(log.created_at)}
                </div>
                <div className="flex-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2 ${ACTION_COLORS[log.action] || 'bg-gray-900/30 text-gray-400'}`}>
                    {log.action}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {log.details}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{log.user_name}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{log.user_role}</div>
                </div>
              </div>
            ))}
            {logs.length === 0 && <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No audit records found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
