import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Download } from 'lucide-react';

import { API_URL as API } from '../config/api';

const RESULT_TABS = [
  { label: 'All Reports', value: '' },
  { label: 'FIT', value: 'FIT' },
  { label: 'UNFIT', value: 'UNFIT' },
  { label: 'UNSATISFACTORY', value: 'UNSATISFACTORY' },
];

const RESULT_COLORS: Record<string, string> = {
  FIT: 'bg-green-900/30 text-green-400 border-green-700',
  UNFIT: 'bg-red-900/30 text-red-400 border-red-700',
  UNSATISFACTORY: 'bg-amber-900/30 text-amber-400 border-amber-700',
};

export default function Reports() {
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = filter ? `?report_type=${filter}` : '';
    const res = await axios.get(`${API}/workflow/reports-data/${params}`);
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const exportCSV = () => {
    const headers = ['Report ID', 'Lab Report No.', 'Result', 'Source', 'Station', 'Division', 'Zone', 'Sample Type', 'Report Date'];
    const rows = data.map(r => [
      r.report_id, r.lab_report_number, r.overall_result,
      r.source_id_code, r.station_name, r.division_name, r.zone_name,
      r.sample_type, r.report_date ? new Date(r.report_date).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `IR-IWQMS-Reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const summary = {
    total: data.length,
    fit: data.filter(d => d.overall_result === 'FIT').length,
    unfit: data.filter(d => d.overall_result === 'UNFIT').length,
    unsat: data.filter(d => d.overall_result === 'UNSATISFACTORY').length,
  };

  return (
    <div className="ir-page">
      <div className="ir-container space-y-6">
        <div className="ir-header-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30">
              <BarChart3 className="w-7 h-7 text-teal-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Water Quality Reports
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Certified laboratory testing reports, compliance analysis & data exports
              </p>
            </div>
          </div>
          <button 
            onClick={exportCSV}
            className="ir-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="ir-stat-grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Lab Reports', value: summary.total, color: 'var(--text-primary)' },
            { label: 'FIT (IS 10500)', value: summary.fit, color: '#10b981' },
            { label: 'UNFIT (Contaminated)', value: summary.unfit, color: '#ef4444' },
            { label: 'UNSATISFACTORY', value: summary.unsat, color: '#eab308' },
          ].map(card => (
            <div key={card.label} className="ir-stat-card p-5 text-center">
              <div className="text-3xl font-black" style={{ color: card.color }}>{card.value}</div>
              <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Result Filter Tabs */}
        <div className="ir-card p-2 flex gap-2 w-fit">
          {RESULT_TABS.map(t => (
            <button 
              key={t.value} 
              onClick={() => setFilter(t.value)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === t.value ? 'ir-btn-primary' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="ir-card text-center py-16" style={{ color: 'var(--text-muted)' }}>
            Loading lab test reports...
          </div>
        ) : (
          <div className="ir-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ir-table">
                <thead>
                  <tr>
                    {['Report ID', 'Lab Report No.', 'IS 10500 Result', 'Source Code', 'Station', 'Division / Zone', 'Sample Type', 'Date'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs font-bold" style={{ color: '#0284c7' }}>{r.report_id}</td>
                      <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.lab_report_number}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${RESULT_COLORS[r.overall_result] || 'bg-gray-900/30 text-gray-400'}`}>
                          {r.overall_result}
                        </span>
                      </td>
                      <td className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{r.source_id_code}</td>
                      <td className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{r.station_name}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.division_name} / {r.zone_name}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.sample_type}</td>
                      <td className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{fmt(r.report_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No reports found for the selected filter.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
