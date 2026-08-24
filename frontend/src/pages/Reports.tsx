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
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-teal-600/20 border border-teal-500/30">
              <BarChart3 className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Reports</h1>
              <p className="text-blue-300 text-sm">Laboratory result reports — view, filter, and export</p>
            </div>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Reports', value: summary.total, color: 'text-white' },
            { label: 'FIT', value: summary.fit, color: 'text-green-400' },
            { label: 'UNFIT', value: summary.unfit, color: 'text-red-400' },
            { label: 'UNSATISFACTORY', value: summary.unsat, color: 'text-amber-400' },
          ].map(card => (
            <div key={card.label} className="rounded-xl p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-white/40 text-xs uppercase tracking-wider mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Result Filter Tabs */}
        <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {RESULT_TABS.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === t.value ? 'bg-teal-600 text-white' : 'text-white/50 hover:text-white'
              }`}>{t.label}</button>
          ))}
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="text-center py-16 text-white/40">Loading reports...</div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Report ID', 'Lab Report No.', 'Result', 'Source', 'Station', 'Division / Zone', 'Sample Type', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-blue-300 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-indigo-400 text-xs">{r.report_id}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{r.lab_report_number}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${RESULT_COLORS[r.overall_result] || 'bg-gray-900/30 text-gray-400'}`}>
                        {r.overall_result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white text-xs font-mono">{r.source_id_code}</td>
                    <td className="px-4 py-3 text-white/70 text-xs">{r.station_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{r.division_name} / {r.zone_name}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{r.sample_type}</td>
                    <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{fmt(r.report_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && (
              <div className="text-center py-8 text-white/40">No reports found for the selected filter.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
