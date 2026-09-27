import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell } from 'lucide-react';

import { API_URL as API } from '../config/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/workflow/notifications/?limit=100`).then(r => {
      setNotifications(r.data);
      setLoading(false);
    });
  }, []);

  const fmt = (d: string) => d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';

  const statusColor: Record<string, string> = {
    SIMULATED: 'bg-blue-900/40 text-blue-400 border-blue-600/40',
    SENT: 'bg-green-900/40 text-green-400 border-green-600/40',
    PENDING: 'bg-amber-900/40 text-amber-400 border-amber-600/40',
    FAILED: 'bg-red-900/40 text-red-400 border-red-600/40',
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/30">
            <Bell className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notification History</h1>
            <p className="text-blue-300 text-sm">Record of all officer notifications sent for critical alerts</p>
          </div>
        </div>

        <div className="rounded-xl p-4 bg-blue-900/20 border border-blue-500/30 text-blue-300 text-sm">
          ℹ In prototype/demo mode, email notifications are <strong>SIMULATED</strong>. In production with SMTP configured, actual emails will be dispatched and marked as <strong>SENT</strong>.
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/40">Loading...</div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Alert', 'Recipient', 'Role', 'Email', 'Type', 'Status', 'Sent At'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-blue-300 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notifications.map(n => (
                  <tr key={n.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-indigo-400 font-mono text-xs">Alert #{n.alert_id}</td>
                    <td className="px-4 py-3 text-white text-sm">{n.recipient_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{n.recipient_role}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{n.recipient_email}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{n.notification_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statusColor[n.status] || ''}`}>{n.status}</span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{fmt(n.sent_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {notifications.length === 0 && (
              <div className="text-center py-8 text-white/40">No notifications found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
