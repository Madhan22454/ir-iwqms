import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  Droplets,
  X,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { API_URL } from '../config/api';

interface WaterSource {
  id: number;
  station_id: number;
  source_id_code: string;
  source_type: string;
  disinfection_method?: string;
  disinfection_frequency_days?: number;
  last_disinfection_date?: string;
  next_disinfection_due?: string;
  residual_chlorine_last?: number;
  current_status: string;
}

interface Station {
  id: number;
  name: string;
  code: string;
}

export default function DisinfectionManagement() {
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Quick Action Modal: Record Disinfection & Chlorine
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    source_id: '',
    disinfection_method: 'CHLORINATION',
    residual_chlorine_ppm: '0.4',
    disinfection_date: new Date().toISOString().split('T')[0],
    remarks: 'Routine station water supply chlorination dosage & DPD kit verification',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wsRes, stnRes] = await Promise.all([
        axios.get(`${API_URL}/hierarchy/water-sources/`),
        axios.get(`${API_URL}/hierarchy/stations/`),
      ]);
      setSources(wsRes.data || []);
      setStations(stnRes.data || []);
    } catch (err: any) {
      console.error('Failed to load disinfection data', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to fetch disinfection logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stationMap = useMemo(() => {
    const map = new Map<number, Station>();
    stations.forEach(s => map.set(s.id, s));
    return map;
  }, [stations]);

  // Derive status for each source regarding disinfection
  const derivedSources = useMemo(() => {
    const now = new Date();
    return sources.map(src => {
      const nextDue = src.next_disinfection_due ? new Date(src.next_disinfection_due) : null;
      let status: 'COMPLETED' | 'DUE' | 'OVERDUE' = 'COMPLETED';

      if (!nextDue) {
        status = 'DUE';
      } else {
        const diffDays = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          status = 'OVERDUE';
        } else if (diffDays <= 5) {
          status = 'DUE';
        } else {
          status = 'COMPLETED';
        }
      }

      return {
        ...src,
        disinfectionStatus: status,
        station: stationMap.get(src.station_id)
      };
    });
  }, [sources, stationMap]);

  // Filter sources
  const filteredSources = useMemo(() => {
    return derivedSources.filter(src => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const codeMatch = src.source_id_code?.toLowerCase().includes(term);
        const stnMatch = src.station?.name?.toLowerCase().includes(term) || src.station?.code?.toLowerCase().includes(term);
        if (!codeMatch && !stnMatch) return false;
      }

      if (statusFilter !== 'ALL') {
        if (src.disinfectionStatus !== statusFilter) return false;
      }

      if (methodFilter !== 'ALL') {
        if ((src.disinfection_method || 'CHLORINATION') !== methodFilter) return false;
      }

      return true;
    });
  }, [derivedSources, searchTerm, statusFilter, methodFilter]);

  // Chart data: Distribution of residual chlorine readings
  const chartData = useMemo(() => {
    return derivedSources
      .filter(s => s.residual_chlorine_last !== null && s.residual_chlorine_last !== undefined)
      .slice(0, 18)
      .map(s => ({
        name: s.source_id_code,
        ppm: Number(s.residual_chlorine_last) || 0,
        compliant: (Number(s.residual_chlorine_last) || 0) >= 0.2 && (Number(s.residual_chlorine_last) || 0) <= 1.0
      }));
  }, [derivedSources]);

  // Counts
  const counts = useMemo(() => {
    let completed = 0;
    let due = 0;
    let overdue = 0;
    derivedSources.forEach(s => {
      if (s.disinfectionStatus === 'COMPLETED') completed++;
      else if (s.disinfectionStatus === 'DUE') due++;
      else if (s.disinfectionStatus === 'OVERDUE') overdue++;
    });
    return { completed, due, overdue, total: derivedSources.length };
  }, [derivedSources]);

  const openModal = (source?: WaterSource) => {
    setForm({
      source_id: source ? String(source.id) : (sources[0] ? String(sources[0].id) : ''),
      disinfection_method: source?.disinfection_method || 'CHLORINATION',
      residual_chlorine_ppm: '0.4',
      disinfection_date: new Date().toISOString().split('T')[0],
      remarks: 'Routine station water supply chlorination dosage & DPD kit verification',
    });
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!form.source_id) {
      setModalError('Please select a water source.');
      return;
    }

    const ppm = parseFloat(form.residual_chlorine_ppm);
    if (isNaN(ppm) || ppm < 0) {
      setModalError('Please enter a valid residual chlorine reading (ppm).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        disinfection_method: form.disinfection_method,
        residual_chlorine_ppm: ppm,
        disinfection_date: `${form.disinfection_date}T10:00:00`,
        remarks: form.remarks,
      };

      await axios.post(`${API_URL}/hierarchy/water-sources/${form.source_id}/disinfection`, payload);
      setModalSuccess('Disinfection record saved successfully!');

      await fetchData();

      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to record disinfection', err);
      setModalError(err?.response?.data?.detail || err?.message || 'Failed to submit disinfection record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ir-page">
      <div className="ir-container">
        
        {/* Header */}
        <div className="ir-header-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              padding: 12,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              flexShrink: 0
            }}>
              <Sparkles size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Disinfection & Residual Chlorine Management
                </h1>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: counts.overdue > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(22,163,74,0.15)',
                  color: counts.overdue > 0 ? '#ef4444' : '#10b981',
                  border: `1px solid ${counts.overdue > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(22,163,74,0.3)'}`
                }}>
                  {counts.overdue} Overdue
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Chlorination tracking, DPD colorimetric test logs, and residual chlorine compliance per Indian Railways medical manual
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => openModal()}
              className="ir-btn-primary"
            >
              <Plus size={16} />
              Record Disinfection Event
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="ir-btn-secondary"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Operational Overview Cards */}
        <div className="ir-stat-grid">
          <div className="ir-stat-card">
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Water Sources</span>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {counts.total}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Active surveillance network
              </div>
            </div>
            <div style={{ background: 'rgba(59,130,246,0.15)', padding: 10, borderRadius: 10 }}>
              <Droplets size={20} color="#3b82f6" />
            </div>
          </div>

          <div className="ir-stat-card">
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Completed / Active</span>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {counts.completed}
              </div>
              <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>
                Disinfected within validity window
              </div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.15)', padding: 10, borderRadius: 10 }}>
              <ShieldCheck size={20} color="#10b981" />
            </div>
          </div>

          <div className="ir-stat-card">
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Disinfection Due</span>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                {counts.due}
              </div>
              <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>
                Due for treatment within 5 days
              </div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.15)', padding: 10, borderRadius: 10 }}>
              <Clock size={20} color="#f59e0b" />
            </div>
          </div>

          <div className="ir-stat-card">
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Overdue Dosage</span>
              <div style={{ fontSize: 26, fontWeight: 800, color: counts.overdue > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: 4 }}>
                {counts.overdue}
              </div>
              <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                Immediate re-dosing required
              </div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.15)', padding: 10, borderRadius: 10 }}>
              <AlertTriangle size={20} color="#ef4444" />
            </div>
          </div>
        </div>

        {/* Residual Chlorine Trend Chart */}
        <div className="ir-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Residual Chlorine (ppm) across Monitored Sources
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Standard requirement: <strong>0.20 to 1.00 ppm</strong> at point of consumption
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                Compliant (0.2 - 1.0 ppm)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} />
                Sub-standard (&lt; 0.2 ppm)
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            {chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                No residual chlorine measurements recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 'auto']} unit=" ppm" />
                  <Tooltip
                    formatter={(val: any) => [`${val} ppm`, 'Residual Chlorine']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <ReferenceLine y={0.2} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Min Limit 0.2 ppm', fill: '#d97706', fontSize: 10, position: 'insideTopLeft' }} />
                  <Bar dataKey="ppm" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.compliant ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="ir-card" style={{
          padding: '14px 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search source ID or station..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="ir-input"
              style={{ width: '100%', paddingLeft: 36 }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="ir-input"
          >
            <option value="ALL">All Disinfection Statuses</option>
            <option value="COMPLETED">Completed / In Window</option>
            <option value="DUE">Disinfection Due</option>
            <option value="OVERDUE">Overdue Treatment</option>
          </select>

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="ir-input"
          >
            <option value="ALL">All Treatment Methods</option>
            <option value="CHLORINATION">CHLORINATION</option>
            <option value="GAS_CHLORINATION">GAS CHLORINATION</option>
            <option value="BLEACHING_POWDER">BLEACHING POWDER</option>
            <option value="UV">UV DISINFECTION</option>
            <option value="RO">REVERSE OSMOSIS</option>
          </select>
        </div>

        {/* Water Sources Disinfection Table */}
        <div className="ir-card overflow-hidden">
          <div style={{ overflowX: 'auto' }}>
            <table className="ir-table">
              <thead>
                <tr>
                  <th>Source ID</th>
                  <th>Station</th>
                  <th>Disinfection Method</th>
                  <th>Last Disinfection</th>
                  <th>Next Disinfection Due</th>
                  <th>Residual Cl</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSources.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No disinfection records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredSources.map(s => {
                    const isChlorineOk = (s.residual_chlorine_last ?? 0) >= 0.2;
                    return (
                      <tr key={s.id}>
                        <td>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.12)',
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid rgba(56, 189, 248, 0.25)'
                          }}>
                            {s.source_id_code}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {s.station?.name || '—'} ({s.station?.code || '—'})
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {s.disinfection_method || 'CHLORINATION'}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {s.last_disinfection_date ? new Date(s.last_disinfection_date).toLocaleDateString('en-IN') : <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Never</span>}
                        </td>
                        <td style={{ color: s.disinfectionStatus === 'OVERDUE' ? '#ef4444' : 'var(--text-primary)', fontWeight: s.disinfectionStatus === 'OVERDUE' ? 700 : 500 }}>
                          {s.next_disinfection_due ? new Date(s.next_disinfection_due).toLocaleDateString('en-IN') : 'Immediate'}
                        </td>
                        <td>
                          {s.residual_chlorine_last !== null && s.residual_chlorine_last !== undefined ? (
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: isChlorineOk ? '#10b981' : '#ef4444'
                            }}>
                              {s.residual_chlorine_last} ppm
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Not tested</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: s.disinfectionStatus === 'OVERDUE' ? 'rgba(239,68,68,0.15)' : s.disinfectionStatus === 'DUE' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                            color: s.disinfectionStatus === 'OVERDUE' ? '#ef4444' : s.disinfectionStatus === 'DUE' ? '#f59e0b' : '#10b981',
                            border: `1px solid ${s.disinfectionStatus === 'OVERDUE' ? 'rgba(239,68,68,0.3)' : s.disinfectionStatus === 'DUE' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`
                          }}>
                            {s.disinfectionStatus === 'OVERDUE' ? 'OVERDUE' : s.disinfectionStatus === 'DUE' ? 'DUE' : 'COMPLETED'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => openModal(s)}
                            className="ir-btn-primary"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                          >
                            <Sparkles size={12} />
                            Log Treatment
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Record Disinfection Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            width: '100%',
            maxWidth: 580,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={20} color="#2dd4bf" />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Record Disinfection & Chlorine Reading</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {modalError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#dc2626" />
                  {modalError}
                </div>
              )}

              {modalSuccess && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#166534', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#16a34a" />
                  {modalSuccess}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Water Source *
                </label>
                <select
                  required
                  value={form.source_id}
                  onChange={e => setForm({ ...form, source_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                >
                  <option value="">Select Water Source</option>
                  {sources.map(src => {
                    const stn = stationMap.get(src.station_id);
                    return (
                      <option key={src.id} value={src.id}>
                        {src.source_id_code} — {stn?.code} ({src.source_type})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Disinfection Method *
                  </label>
                  <select
                    value={form.disinfection_method}
                    onChange={e => setForm({ ...form, disinfection_method: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="CHLORINATION">CHLORINATION</option>
                    <option value="GAS_CHLORINATION">GAS CHLORINATION</option>
                    <option value="BLEACHING_POWDER">BLEACHING POWDER</option>
                    <option value="UV">UV DISINFECTION</option>
                    <option value="RO">REVERSE OSMOSIS</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Residual Chlorine (ppm) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    required
                    placeholder="e.g. 0.40"
                    value={form.residual_chlorine_ppm}
                    onChange={e => setForm({ ...form, residual_chlorine_ppm: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                  />
                  <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Required threshold: 0.20 to 1.00 ppm
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Treatment Date
                </label>
                <input
                  type="date"
                  value={form.disinfection_date}
                  onChange={e => setForm({ ...form, disinfection_date: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Remarks / Dosing Quantity / Verification Notes
                </label>
                <textarea
                  rows={2}
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0f766e', color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Save Disinfection Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
