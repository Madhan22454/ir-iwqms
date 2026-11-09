import { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API_URL as API } from '../config/api';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-900/30 text-red-400 border-red-600/40',
  ASSIGNED: 'bg-amber-900/30 text-amber-400 border-amber-600/40',
  IN_PROGRESS: 'bg-blue-900/30 text-blue-400 border-blue-600/40',
  COMPLETED: 'bg-green-900/30 text-green-400 border-green-600/40',
  VERIFICATION_PENDING: 'bg-purple-900/30 text-purple-400 border-purple-600/40',
  CLOSED: 'bg-gray-900/30 text-gray-400 border-gray-600/40',
  ESCALATED: 'bg-red-900/50 text-red-300 border-red-500 animate-pulse',
};

export default function CorrectiveActions() {
  const { token } = useAuth();
  const [actions, setActions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    const res = await axios.get(`${API}/workflow/corrective-actions/${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setActions(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const isOverdue = (d: string, status: string) => d && new Date(d) < new Date() && !['COMPLETED','CLOSED'].includes(status);

  return (
    <div className="ir-page">
      <div className="ir-container space-y-6">
        <div className="ir-header-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30">
              <ClipboardList className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Corrective Actions
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Automated ISO/IS 10500 rectification workflows for contaminated railway water sources
              </p>
            </div>
          </div>
        </div>

        {/* Status filter */}
        <div className="ir-card p-2 flex items-center gap-2 w-fit">
          <Filter className="w-4 h-4 ml-2" style={{ color: 'var(--text-muted)' }} />
          {['', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'ESCALATED'].map(s => (
            <button 
              key={s} 
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === s ? 'ir-btn-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s || 'All Statuses'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="ir-card text-center py-16" style={{ color: 'var(--text-muted)' }}>
            Loading corrective action records...
          </div>
        ) : (
          <div className="ir-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ir-table">
                <thead>
                  <tr>
                    {['Action ID', 'Alert Ref', 'Water Source', 'Failed Parameters', 'Target Date', 'Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {actions.map(ca => (
                    <tr key={ca.id}>
                      <td className="font-mono text-xs font-black" style={{ color: '#0284c7' }}>{ca.action_id}</td>
                      <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>Alert #{ca.alert_id}</td>
                      <td className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Source #{ca.water_source_id}</td>
                      <td className="text-xs font-semibold text-rose-500">{ca.failed_parameters || '—'}</td>
                      <td className={`text-xs ${isOverdue(ca.target_date, ca.status) ? 'text-red-500 font-bold' : ''}`} style={{ color: isOverdue(ca.target_date, ca.status) ? '#ef4444' : 'var(--text-muted)' }}>
                        {fmt(ca.target_date)}
                        {isOverdue(ca.target_date, ca.status) && ' ⚠'}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[ca.status] || ''}`}>
                          {ca.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {actions.length === 0 && (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No corrective actions found matching the filter.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
