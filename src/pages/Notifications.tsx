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
    <div className="ir-page">
      <div className="ir-container space-y-6">
        <div className="ir-header-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30">
              <Bell className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Notification Telemetry
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Record of automated alerts, escalations and officer SMS/email dispatches
              </p>
            </div>
          </div>
        </div>

        <div className="ir-card p-4 text-xs font-medium" style={{ color: '#0284c7' }}>
          ℹ In prototype/demo mode, email and SMS notifications are <strong>SIMULATED</strong>. In production with Indian Railways CRIS/NIC SMTP configured, dispatches are sent in real-time.
        </div>

        {loading ? (
          <div className="ir-card text-center py-16" style={{ color: 'var(--text-muted)' }}>
            Loading notification records...
          </div>
        ) : (
          <div className="ir-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ir-table">
                <thead>
                  <tr>
                    {['Alert Ref', 'Officer Recipient', 'Role', 'Email', 'Channel', 'Status', 'Dispatched At'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {notifications.map(n => (
                    <tr key={n.id}>
                      <td className="text-xs font-mono font-bold" style={{ color: '#0284c7' }}>Alert #{n.alert_id}</td>
                      <td className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{n.recipient_name}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{n.recipient_role}</td>
                      <td className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{n.recipient_email}</td>
                      <td className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{n.notification_type}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusColor[n.status] || ''}`}>{n.status}</span>
                      </td>
                      <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{fmt(n.sent_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {notifications.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No notifications recorded.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
