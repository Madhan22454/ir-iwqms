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
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-600/20 border border-orange-500/30">
            <ClipboardList className="w-7 h-7 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Corrective Actions</h1>
            <p className="text-blue-300 text-sm">Auto-created tasks for UNFIT/UNSATISFACTORY alerts</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <Filter className="w-4 h-4 text-white/40 ml-2" />
          {['', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'ESCALATED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === s ? 'bg-orange-600 text-white' : 'text-white/50 hover:text-white'
              }`}>{s || 'All'}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/40">Loading...</div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Action ID', 'Alert', 'Source', 'Failed Parameters', 'Target Date', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-blue-300 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map(ca => (
                  <tr key={ca.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-orange-400 text-xs font-bold">{ca.action_id}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">Alert #{ca.alert_id}</td>
                    <td className="px-4 py-3 text-white text-xs">Source #{ca.water_source_id}</td>
                    <td className="px-4 py-3 text-red-400 text-xs font-medium">{ca.failed_parameters || '—'}</td>
                    <td className={`px-4 py-3 text-xs ${isOverdue(ca.target_date, ca.status) ? 'text-red-400 font-bold' : 'text-white/60'}`}>
                      {fmt(ca.target_date)}
                      {isOverdue(ca.target_date, ca.status) && ' ⚠'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[ca.status] || ''}`}>
                        {ca.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {actions.length === 0 && (
              <div className="text-center py-8 text-white/40">No corrective actions found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
