import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, Filter, RefreshCw, ChevronRight, Clock, CheckCircle } from 'lucide-react';

import { API_URL as API } from '../config/api';

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  OPEN: { bg: 'bg-red-900/30 border-red-500/50', text: 'text-red-400', dot: 'bg-red-500' },
  ACKNOWLEDGED: { bg: 'bg-amber-900/30 border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-500' },
  CORRECTIVE_ACTION: { bg: 'bg-orange-900/30 border-orange-500/50', text: 'text-orange-400', dot: 'bg-orange-500' },
  REPEAT_SAMPLE: { bg: 'bg-blue-900/30 border-blue-500/50', text: 'text-blue-400', dot: 'bg-blue-500' },
  VERIFICATION: { bg: 'bg-purple-900/30 border-purple-500/50', text: 'text-purple-400', dot: 'bg-purple-400' },
  ESCALATED: { bg: 'bg-red-900/50 border-red-400', text: 'text-red-300', dot: 'bg-red-400 animate-pulse' },
  CLOSED: { bg: 'bg-green-900/20 border-green-600/40', text: 'text-green-400', dot: 'bg-green-500' },
};

const RESULT_COLORS: Record<string, string> = {
  UNFIT: 'text-red-400 font-bold',
  UNSATISFACTORY: 'text-amber-400 font-bold',
  FIT: 'text-green-400',
};

interface AlertItem {
  id: number; alert_id: string; severity: string;
  source_id_code: string; zone_name: string; division_name: string; station_name: string;
  source_type: string; sample_result: string; sample_date: string;
  status: string; created_at: string; due_date: string; is_escalated: boolean;
}

interface Summary {
  total: number; critical: number; open: number;
  unfit: number; unsatisfactory: number; escalated: number; closed: number;
}

const FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'OPEN', value: 'OPEN' },
  { label: 'Acknowledged', value: 'ACKNOWLEDGED' },
  { label: 'Corrective Action', value: 'CORRECTIVE_ACTION' },
  { label: 'Escalated', value: 'ESCALATED' },
  { label: 'Closed', value: 'CLOSED' },
];
const RESULT_FILTERS = [
  { label: 'All Results', value: '' },
  { label: 'UNFIT', value: 'UNFIT' },
  { label: 'UNSATISFACTORY', value: 'UNSATISFACTORY' },
];

export default function AlertCentre() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (resultFilter) params.set('result', resultFilter);
    const [alertsRes, summaryRes] = await Promise.all([
      axios.get(`${API}/alerts/?${params}`),
      axios.get(`${API}/alerts/summary`),
    ]);
    setAlerts(alertsRes.data);
    setSummary(summaryRes.data);
    setLoading(false);
  }, [statusFilter, resultFilter]);

  useEffect(() => { load(); }, [load]);

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const isOverdue = (due: string) => due && new Date(due) < new Date();

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-600/20 border border-red-500/30">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Alert Centre</h1>
            <p className="text-blue-300 text-sm">Critical water quality alerts — manage and resolve</p>
          </div>
          <button onClick={load} className="ml-auto p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Total', value: summary.total, color: 'text-white', bg: 'rgba(255,255,255,0.05)' },
              { label: 'Critical', value: summary.critical, color: 'text-red-400', bg: 'rgba(239,68,68,0.1)' },
              { label: 'Open', value: summary.open, color: 'text-orange-400', bg: 'rgba(249,115,22,0.1)' },
              { label: 'UNFIT', value: summary.unfit, color: 'text-red-300', bg: 'rgba(220,38,38,0.15)' },
              { label: 'UNSAT.', value: summary.unsatisfactory, color: 'text-amber-400', bg: 'rgba(245,158,11,0.1)' },
              { label: 'Escalated', value: summary.escalated, color: 'text-red-400', bg: 'rgba(239,68,68,0.15)' },
              { label: 'Closed', value: summary.closed, color: 'text-green-400', bg: 'rgba(34,197,94,0.1)' },
            ].map(card => (
              <div key={card.label} className="rounded-xl p-4 text-center"
                style={{ background: card.bg, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-white/40 text-xs uppercase tracking-wider mt-1">{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Filter className="w-4 h-4 text-white/40 ml-2" />
            {FILTER_OPTIONS.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === f.value ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
                }`}>{f.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {RESULT_FILTERS.map(f => (
              <button key={f.value} onClick={() => setResultFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  resultFilter === f.value ? 'bg-red-700 text-white' : 'text-white/50 hover:text-white'
                }`}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Alert Table */}
        {loading ? (
          <div className="text-center py-16 text-white/40">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-white/60">No alerts match the current filters.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {['Alert ID', 'Severity', 'Source', 'Zone / Division', 'Result', 'Date', 'Due', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-blue-300 font-medium text-xs uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(a => {
                    const ss = STATUS_STYLES[a.status] || STATUS_STYLES['OPEN'];
                    return (
                      <tr key={a.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3">
                          <span className="font-mono text-indigo-300 font-semibold text-xs">{a.alert_id}</span>
                          {a.is_escalated && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-red-900/60 text-red-400 border border-red-600/40">ESC</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            a.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-400 border border-red-600/40' : 'bg-yellow-900/30 text-yellow-400'
                          }`}>{a.severity}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white font-medium text-xs">{a.source_id_code}</div>
                          <div className="text-white/40 text-xs">{a.source_type}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white/70 text-xs">{a.zone_name}</div>
                          <div className="text-white/40 text-xs">{a.division_name} / {a.station_name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={RESULT_COLORS[a.sample_result] || 'text-white/60'}>{a.sample_result}</span>
                        </td>
                        <td className="px-4 py-3 text-white/60 text-xs whitespace-nowrap">{fmt(a.sample_date)}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {a.due_date ? (
                            <span className={`flex items-center gap-1 ${isOverdue(a.due_date) && a.status !== 'CLOSED' ? 'text-red-400' : 'text-white/50'}`}>
                              {isOverdue(a.due_date) && a.status !== 'CLOSED' && <Clock className="w-3 h-3" />}
                              {fmt(a.due_date)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ss.bg} ${ss.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/alerts/${a.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 border border-indigo-600/40 hover:bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-all">
                            View <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
