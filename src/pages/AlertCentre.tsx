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
    <div className="ir-page">
      <div className="ir-container space-y-6">
        {/* Header */}
        <div className="ir-header-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-600/15 border border-red-500/30">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Alert Centre
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Critical IS 10500 water quality alerts — real-time detection, escalation & resolution
              </p>
            </div>
          </div>
          <button 
            onClick={load} 
            className="ir-btn-secondary p-2.5 rounded-xl transition-all"
            title="Refresh alerts"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="ir-stat-grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Total Alerts', value: summary.total, color: 'var(--text-primary)' },
              { label: 'Critical', value: summary.critical, color: '#ef4444' },
              { label: 'Open', value: summary.open, color: '#f97316' },
              { label: 'UNFIT (IS 10500)', value: summary.unfit, color: '#f43f5e' },
              { label: 'Unsatisfactory', value: summary.unsatisfactory, color: '#eab308' },
              { label: 'Escalated', value: summary.escalated, color: '#ef4444' },
              { label: 'Resolved / Closed', value: summary.closed, color: '#10b981' },
            ].map(card => (
              <div key={card.label} className="ir-stat-card text-center p-3.5">
                <div className="text-2xl font-black" style={{ color: card.color }}>{card.value}</div>
                <div className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
                  {card.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="ir-card p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-lg" style={{ background: 'var(--bg-page)' }}>
            <Filter className="w-4 h-4 ml-2" style={{ color: 'var(--text-muted)' }} />
            {FILTER_OPTIONS.map(f => (
              <button 
                key={f.value} 
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === f.value ? 'ir-btn-primary' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-lg" style={{ background: 'var(--bg-page)' }}>
            {RESULT_FILTERS.map(f => (
              <button 
                key={f.value} 
                onClick={() => setResultFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  resultFilter === f.value ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Table */}
        {loading ? (
          <div className="ir-card text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
            Loading water quality alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="ir-card text-center py-16">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>No active alerts</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>All monitored sources currently comply with IS 10500 standards.</p>
          </div>
        ) : (
          <div className="ir-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ir-table">
                <thead>
                  <tr>
                    {['Alert ID', 'Severity', 'Source Code', 'Zone / Division', 'Result', 'Sample Date', 'Due Date', 'Status', 'Action'].map(h => (
                      <th key={h} className="whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(a => {
                    const ss = STATUS_STYLES[a.status] || STATUS_STYLES['OPEN'];
                    return (
                      <tr key={a.id} className="group">
                        <td>
                          <span className="font-mono font-bold text-xs" style={{ color: '#0284c7' }}>{a.alert_id}</span>
                          {a.is_escalated && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">ESC</span>
                          )}
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            a.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                          }`}>{a.severity}</span>
                        </td>
                        <td>
                          <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{a.source_id_code}</div>
                          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.source_type}</div>
                        </td>
                        <td>
                          <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{a.zone_name}</div>
                          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.division_name} / {a.station_name}</div>
                        </td>
                        <td>
                          <span className={RESULT_COLORS[a.sample_result] || ''} style={{ color: a.sample_result === 'UNFIT' ? '#ef4444' : a.sample_result === 'UNSATISFACTORY' ? '#f59e0b' : '#10b981' }}>
                            {a.sample_result}
                          </span>
                        </td>
                        <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{fmt(a.sample_date)}</td>
                        <td className="text-xs whitespace-nowrap">
                          {a.due_date ? (
                            <span className={`flex items-center gap-1 font-semibold ${isOverdue(a.due_date) && a.status !== 'CLOSED' ? 'text-red-500' : ''}`} style={{ color: isOverdue(a.due_date) && a.status !== 'CLOSED' ? '#ef4444' : 'var(--text-muted)' }}>
                              {isOverdue(a.due_date) && a.status !== 'CLOSED' && <Clock className="w-3.5 h-3.5" />}
                              {fmt(a.due_date)}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${ss.bg} ${ss.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                            {a.status}
                          </span>
                        </td>
                        <td>
                          <Link 
                            to={`/alerts/${a.id}`}
                            className="ir-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                          >
                            View <ChevronRight className="w-3.5 h-3.5" />
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
