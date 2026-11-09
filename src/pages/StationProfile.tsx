import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Train,
  ArrowLeft,
  MapPin,
  Droplets,
  FlaskConical,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  History as HistoryIcon,
  Layers,
  Calendar,
  AlertCircle,
  Activity,
  RefreshCw
} from 'lucide-react';
import { API_URL } from '../config/api';

interface StationDetailData {
  id: number;
  name: string;
  code: string;
  category?: string;
  gps_lat?: number;
  gps_long?: number;
  source_provenance?: string;
  division?: {
    id: number;
    name: string;
    code: string;
  };
  zone?: {
    id: number;
    name: string;
    code: string;
  };
  water_sources: Array<{
    id: number;
    source_id_code: string;
    source_type: string;
    capacity: string;
    current_status: string;
    disinfection_method: string;
    last_disinfection_date?: string;
    next_disinfection_due?: string;
    residual_chlorine_last?: number;
    last_bacteriological_sample_date?: string;
    next_bacteriological_sample_due?: string;
  }>;
}

export default function StationProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [station, setStation] = useState<StationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'sampling' | 'laboratory' | 'disinfection' | 'alerts' | 'corrective_actions' | 'history'>('overview');

  // Related data
  const [alerts, setAlerts] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const stnRes = await axios.get(`${API_URL}/hierarchy/stations/${id}`);
      setStation(stnRes.data);

      const stnName = stnRes.data?.name;
      const sourceIds = (stnRes.data?.water_sources || []).map((w: any) => w.id);

      // Concurrently fetch related datasets
      const [alertsRes, samplesRes, reportsRes, caRes, auditRes] = await Promise.allSettled([
        axios.get(`${API_URL}/alerts/?limit=300`),
        axios.get(`${API_URL}/labs/samples/?limit=300`),
        axios.get(`${API_URL}/labs/reports/?limit=300`),
        axios.get(`${API_URL}/workflow/corrective-actions/?limit=300`),
        axios.get(`${API_URL}/workflow/audit/?limit=300`)
      ]);

      if (alertsRes.status === 'fulfilled') {
        const filteredAlerts = (alertsRes.value.data || []).filter((a: any) =>
          a.station_name === stnName || sourceIds.includes(a.water_source_id)
        );
        setAlerts(filteredAlerts);
      }

      if (samplesRes.status === 'fulfilled') {
        const filteredSamples = (samplesRes.value.data || []).filter((s: any) =>
          sourceIds.includes(s.water_source_id)
        );
        setSamples(filteredSamples);
      }

      if (reportsRes.status === 'fulfilled') {
        const allReports = reportsRes.value.data || [];
        setReports(allReports);
      }

      if (caRes.status === 'fulfilled') {
        const filteredCAs = (caRes.value.data || []).filter((c: any) =>
          sourceIds.includes(c.water_source_id)
        );
        setCorrectiveActions(filteredCAs);
      }

      if (auditRes.status === 'fulfilled') {
        const filteredAudit = (auditRes.value.data || []).filter((a: any) =>
          (a.entity_type === 'Station' && a.entity_id === Number(id)) ||
          sourceIds.includes(a.entity_id) ||
          (a.details && (a.details.includes(stnName) || a.details.includes(stnRes.data?.code)))
        );
        setAuditLogs(filteredAudit);
      }

    } catch (err: any) {
      console.error('Failed to load station profile', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load station profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Overall station status
  const stationStatus = useMemo(() => {
    if (!station || !station.water_sources || station.water_sources.length === 0) {
      return { label: 'NO SOURCES', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
    }
    const statuses = station.water_sources.map(s => s.current_status);
    if (statuses.includes('PERSISTENT_FAILURE')) {
      return { label: 'PERSISTENT FAILURE', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5' };
    }
    if (statuses.includes('UNFIT')) {
      return { label: 'UNFIT', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
    }
    if (statuses.includes('OVERDUE')) {
      return { label: 'OVERDUE', color: '#ea580c', bg: '#fff7ed', border: '#fdba74' };
    }
    if (statuses.includes('DUE') || statuses.includes('UNSATISFACTORY')) {
      return { label: 'DUE', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
    }
    return { label: 'COMPLIANT', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  }, [station]);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Layers, count: undefined },
    { key: 'sources', label: 'Water Sources', icon: Droplets, count: station?.water_sources?.length },
    { key: 'sampling', label: 'Sampling', icon: Calendar, count: samples.length },
    { key: 'laboratory', label: 'Laboratory', icon: FlaskConical, count: reports.length },
    { key: 'disinfection', label: 'Disinfection', icon: Sparkles, count: undefined },
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle, count: alerts.length },
    { key: 'corrective_actions', label: 'Corrective Actions', icon: ClipboardList, count: correctiveActions.length },
    { key: 'history', label: 'History', icon: HistoryIcon, count: auditLogs.length },
  ];

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid #cbd5e1',
            borderTopColor: '#1e3a8a',
            borderRadius: '50%',
            margin: '0 auto 16px auto',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Loading Station Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', height: '100%' }}>
        <div style={{ maxWidth: 500, margin: '60px auto', background: '#ffffff', padding: 32, borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Station Not Found</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px 0' }}>{error || 'Unable to load details for this station ID.'}</p>
          <button
            onClick={() => navigate('/stations')}
            style={{
              padding: '8px 16px',
              background: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Back to Station Registry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f8fafc', padding: '24px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Navigation Breadcrumb */}
        <div>
          <button
            onClick={() => navigate('/stations')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: '#1e40af',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0
            }}
          >
            <ArrowLeft size={16} />
            Back to Stations Registry
          </button>
        </div>

        {/* Station Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #091224 0%, #0f2347 60%, #1e3a8a 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: 14,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Train size={32} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 14,
                    fontWeight: 800,
                    background: '#3b82f6',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: 6,
                    letterSpacing: '0.05em'
                  }}>
                    {station.code}
                  </span>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'white' }}>
                    {station.name}
                  </h1>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 6,
                    color: stationStatus.color,
                    background: stationStatus.bg,
                    border: `1px solid ${stationStatus.border}`,
                    letterSpacing: '0.04em'
                  }}>
                    {stationStatus.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8, fontSize: 13, color: '#93c5fd', flexWrap: 'wrap' }}>
                  <span>Zone: <strong style={{ color: '#ffffff' }}>{station.zone?.code || '—'} ({station.zone?.name || '—'})</strong></span>
                  <span>•</span>
                  <span>Division: <strong style={{ color: '#ffffff' }}>{station.division?.name || '—'}</strong></span>
                  <span>•</span>
                  <span>Category: <strong style={{ color: '#ffffff' }}>{station.category || 'Standard'}</strong></span>
                  {station.gps_lat && station.gps_long && (
                    <>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} />
                        {station.gps_lat.toFixed(4)}, {station.gps_long.toFixed(4)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={loadData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* 8 Tabs Bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          borderRadius: 10,
          padding: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? '#1e3a8a' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#475569'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}

        {/* 1. OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Water Sources</span>
                  <Droplets size={18} color="#3b82f6" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
                  {station.water_sources.length}
                </div>
                <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4, fontWeight: 600 }}>
                  Active registered supplies
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Active Alerts</span>
                  <AlertTriangle size={18} color="#ea580c" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: alerts.filter(a => a.status === 'OPEN').length > 0 ? '#dc2626' : '#0f172a', marginTop: 8 }}>
                  {alerts.filter(a => a.status === 'OPEN' || a.status === 'ESCALATED').length}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {alerts.length} total logged incidents
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Pending Actions</span>
                  <ClipboardList size={18} color="#8b5cf6" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
                  {correctiveActions.filter(c => c.status !== 'COMPLETED').length}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Corrective tasks assigned
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Samples Collected</span>
                  <Activity size={18} color="#10b981" />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
                  {samples.length}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Surveillance lab samples
                </div>
              </div>
            </div>

            {/* Station Metadata Grid */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
                Operational & Administrative Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Railway Zone</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {station.zone?.code} — {station.zone?.name}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Divisional HQ</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {station.division?.name} ({station.division?.code})
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Category Classification</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {station.category || 'Standard Station'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>GIS Coordinates</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2, fontFamily: 'monospace' }}>
                    {station.gps_lat ? `${station.gps_lat.toFixed(5)}° N, ${station.gps_long?.toFixed(5)}° E` : 'Not recorded'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Provenance</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {station.source_provenance || 'Railway Master Record'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. WATER SOURCES */}
        {activeTab === 'sources' && (
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Associated Water Sources ({station.water_sources.length})
              </h3>
            </div>
            {station.water_sources.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No water sources mapped to this station yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Source ID</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Type</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Capacity</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Disinfection</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Residual Cl</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {station.water_sources.map(src => (
                      <tr key={src.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#1e3a8a', fontFamily: 'monospace' }}>
                          {src.source_id_code}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{src.source_type}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{src.capacity || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>{src.disinfection_method || 'None'}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                          {src.residual_chlorine_last !== null && src.residual_chlorine_last !== undefined ? `${src.residual_chlorine_last} ppm` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: src.current_status === 'COMPLIANT' ? '#f0fdf4' : src.current_status === 'UNFIT' ? '#fef2f2' : '#fffbeb',
                            color: src.current_status === 'COMPLIANT' ? '#16a34a' : src.current_status === 'UNFIT' ? '#dc2626' : '#d97706',
                            border: `1px solid ${src.current_status === 'COMPLIANT' ? '#bbf7d0' : src.current_status === 'UNFIT' ? '#fecaca' : '#fde68a'}`
                          }}>
                            {src.current_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. SAMPLING */}
        {activeTab === 'sampling' && (
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Water Sampling Records ({samples.length})
              </h3>
            </div>
            {samples.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No sampling events logged for this station.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Sample ID</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Type</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Collection Date</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Collector</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace', color: '#1e3a8a' }}>{s.sample_id}</td>
                        <td style={{ padding: '12px 16px' }}>{s.sample_type}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {s.collection_date ? new Date(s.collection_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{s.collector_name || 'Railway Inspector'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#eff6ff', color: '#1d4ed8' }}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. LABORATORY */}
        {activeTab === 'laboratory' && (
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Laboratory Test Reports ({reports.length})
              </h3>
            </div>
            {reports.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No lab reports recorded.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Report ID</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Report Date</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Result</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Lab Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace', color: '#1e3a8a' }}>{r.report_id}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {r.report_date ? new Date(r.report_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: r.overall_result === 'FIT' ? '#f0fdf4' : '#fef2f2',
                            color: r.overall_result === 'FIT' ? '#16a34a' : '#dc2626'
                          }}>
                            {r.overall_result || 'PENDING'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.lab_report_number || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. DISINFECTION */}
        {activeTab === 'disinfection' && (
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Chlorination & Disinfection Surveillance
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Source ID</th>
                    <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Method</th>
                    <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Residual Cl</th>
                    <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Last Disinfected</th>
                    <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Next Due</th>
                  </tr>
                </thead>
                <tbody>
                  {station.water_sources.map(ws => (
                    <tr key={ws.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace' }}>{ws.source_id_code}</td>
                      <td style={{ padding: '12px 16px' }}>{ws.disinfection_method || 'CHLORINATION'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: (ws.residual_chlorine_last ?? 0) >= 0.2 ? '#16a34a' : '#dc2626' }}>
                        {ws.residual_chlorine_last !== null && ws.residual_chlorine_last !== undefined ? `${ws.residual_chlorine_last} ppm` : 'Not recorded'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {ws.last_disinfection_date ? new Date(ws.last_disinfection_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {ws.next_disinfection_due ? new Date(ws.next_disinfection_due).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. ALERTS */}
        {activeTab === 'alerts' && (
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Station Alerts History ({alerts.length})
              </h3>
            </div>
            {alerts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No alerts triggered for this station.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Alert ID</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Severity</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Source Code</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Result</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Triggered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, fontFamily: 'monospace', color: '#1e3a8a' }}>
                          <Link to={`/alerts/${a.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {a.alert_id}
                          </Link>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: a.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb', color: a.severity === 'CRITICAL' ? '#dc2626' : '#d97706' }}>
                            {a.severity}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{a.source_id_code}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#dc2626' }}>{a.sample_result}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{a.status}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {a.created_at ? new Date(a.created_at).toLocaleString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 7. CORRECTIVE ACTIONS */}
        {activeTab === 'corrective_actions' && (
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Corrective Actions ({correctiveActions.length})
              </h3>
            </div>
            {correctiveActions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No corrective actions assigned.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Action ID</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Problem</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Assigned To</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Target Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {correctiveActions.map(ca => (
                      <tr key={ca.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 800, fontFamily: 'monospace', color: '#1e3a8a' }}>{ca.action_id}</td>
                        <td style={{ padding: '12px 16px', color: '#0f172a' }}>{ca.problem_description || 'Water Quality Rectification'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{ca.assigned_to_name || 'Railway Engineer'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: ca.status === 'COMPLETED' ? '#f0fdf4' : '#fff7ed', color: ca.status === 'COMPLETED' ? '#16a34a' : '#ea580c' }}>
                            {ca.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {ca.target_date ? new Date(ca.target_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 8. HISTORY */}
        {activeTab === 'history' && (
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Audit Trail & Operational History
              </h3>
            </div>
            {auditLogs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No audit history records available for this station.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Timestamp</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>User</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Action</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Entity</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, color: '#475569' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.user_name || 'SYSTEM'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e3a8a' }}>{log.action}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{log.entity_type} #{log.entity_id}</td>
                        <td style={{ padding: '12px 16px', color: '#334155' }}>{log.details || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
