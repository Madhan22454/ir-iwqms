import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  Layers, Building2, TrainFront, Droplets,
  ShieldCheck, ShieldAlert, AlertTriangle, Clock, TrendingUp,
  FlaskConical, ClipboardList, ChevronRight, RefreshCw
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/v1';

const STATUS_COLORS: Record<string, string> = {
  COMPLIANT: '#16a34a',
  UNFIT: '#dc2626',
  UNSATISFACTORY: '#d97706',
  OVERDUE: '#9333ea',
  DUE: '#2563eb',
  PERSISTENT_FAILURE: '#7f1d1d',
};

const STATUS_BG: Record<string, string> = {
  COMPLIANT: '#f0fdf4',
  UNFIT: '#fef2f2',
  UNSATISFACTORY: '#fffbeb',
  OVERDUE: '#faf5ff',
  DUE: '#eff6ff',
  PERSISTENT_FAILURE: '#fff1f2',
};

function StatCard({ icon: Icon, label, value, color, bg, to }: {
  icon: any; label: string; value: number | string; color: string; bg: string; to?: string;
}) {
  const content = (
    <div style={{
      background: 'white', borderRadius: 16, padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16,
      transition: 'all 0.2s ease', cursor: to ? 'pointer' : 'default',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)';
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
      }}
    >
      <div style={{ background: bg, borderRadius: 14, padding: 14, flexShrink: 0 }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{label}</div>
      </div>
      {to && <ChevronRight size={16} color="#94a3b8" />}
    </div>
  );

  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

export function Dashboard() {
  const [zones, setZones] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [waterSources, setWaterSources] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [alertSummary, setAlertSummary] = useState<any>(null);
  const [caCount, setCaCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [z, d, s, ws, alerts, summary, cas] = await Promise.all([
        axios.get(`${API_URL}/hierarchy/zones/`),
        axios.get(`${API_URL}/hierarchy/divisions/`),
        axios.get(`${API_URL}/hierarchy/stations/`),
        axios.get(`${API_URL}/hierarchy/water-sources/`),
        axios.get(`${API_URL}/alerts/?limit=6`),
        axios.get(`${API_URL}/alerts/summary`),
        axios.get(`${API_URL}/workflow/corrective-actions/?status=OPEN`),
      ]);
      setZones(z.data);
      setDivisions(d.data);
      setStations(s.data);
      setWaterSources(ws.data);
      setRecentAlerts(alerts.data);
      setAlertSummary(summary.data);
      setCaCount(cas.data.length);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Compute status breakdown
  const statusCounts = waterSources.reduce((acc: Record<string, number>, ws) => {
    acc[ws.current_status] = (acc[ws.current_status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const compliantCount = statusCounts['COMPLIANT'] || 0;
  const totalSources = waterSources.length;
  const complianceRate = totalSources > 0 ? Math.round((compliantCount / totalSources) * 100) : 0;

  // Status breakdown per zone
  const barData = zones.map(zone => {
    const zoneDivIds = divisions.filter(d => d.zone_id === zone.id).map((d: any) => d.id);
    const zoneStationIds = stations.filter(s => zoneDivIds.includes(s.division_id)).map((s: any) => s.id);
    const zoneSources = waterSources.filter(ws => zoneStationIds.includes(ws.station_id));
    return {
      name: zone.code,
      Compliant: zoneSources.filter(ws => ws.current_status === 'COMPLIANT').length,
      Unfit: zoneSources.filter(ws => ws.current_status === 'UNFIT').length,
      Unsatisfactory: zoneSources.filter(ws => ws.current_status === 'UNSATISFACTORY').length,
      Overdue: zoneSources.filter(ws => ws.current_status === 'OVERDUE').length,
      Persistent: zoneSources.filter(ws => ws.current_status === 'PERSISTENT_FAILURE').length,
    };
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #e2e8f0',
          borderTopColor: '#2563eb', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 28px' }}>
      {/* Page header with quick actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            National Water Quality Surveillance Dashboard
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 4 }}>
            Live water quality monitoring & rapid-alert surveillance across Indian Railways network
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchAll} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/lab/result-entry" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8,
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
          }}>
            <FlaskConical size={16} /> Enter Lab Result
          </Link>
        </div>
      </div>

      {/* Critical Alert Bar (if alerts exist) */}
      {alertSummary && (alertSummary.critical > 0 || alertSummary.open > 0) && (
        <div style={{
          background: 'linear-gradient(90deg, #fef2f2 0%, #fff1f2 100%)',
          border: '1px solid #fecaca', borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#ef4444', borderRadius: '50%', padding: 6, display: 'flex' }}>
              <AlertTriangle size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#991b1b' }}>
                🚨 {alertSummary.critical} Critical Water Quality Alert{alertSummary.critical > 1 ? 's' : ''} Active
              </div>
              <div style={{ fontSize: 12, color: '#b91c1c' }}>
                {alertSummary.open} alert{alertSummary.open > 1 ? 's' : ''} awaiting acknowledgement and corrective action.
              </div>
            </div>
          </div>
          <Link to="/alerts" style={{
            fontSize: 12.5, fontWeight: 700, color: '#991b1b', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4, background: 'white', padding: '6px 14px', borderRadius: 8,
            border: '1px solid #fca5a5',
          }}>
            View Alert Centre <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <StatCard icon={Layers} label="Total Zones" value={zones.length} color="#2563eb" bg="#eff6ff" />
        <StatCard icon={Building2} label="Total Divisions" value={divisions.length} color="#7c3aed" bg="#f5f3ff" />
        <StatCard icon={TrainFront} label="Total Stations" value={stations.length} color="#0891b2" bg="#ecfeff" />
        <StatCard icon={Droplets} label="Water Sources" value={totalSources} color="#059669" bg="#ecfdf5" to="/healthcard" />
        <StatCard icon={TrendingUp} label="Compliance Rate" value={`${complianceRate}%`} color="#16a34a" bg="#f0fdf4" />
        <StatCard icon={AlertTriangle} label="Critical Alerts" value={alertSummary?.critical || 0} color="#dc2626" bg="#fef2f2" to="/alerts" />
        <StatCard icon={ClipboardList} label="Open Corrective Actions" value={caCount} color="#d97706" bg="#fffbeb" to="/corrective-actions" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
        {/* Status pie chart */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '22px 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Water Quality Status Breakdown
          </h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} sources`, '']} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
                {pieData.map(entry => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 9, height: 9, borderRadius: '50%',
                        background: STATUS_COLORS[entry.name] || '#94a3b8', flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{entry.name.replace(/_/g, ' ')}</span>
                    </div>
                    <span style={{
                      fontSize: 11.5, fontWeight: 700,
                      background: STATUS_BG[entry.name] || '#f8fafc',
                      color: STATUS_COLORS[entry.name] || '#64748b',
                      padding: '2px 8px', borderRadius: 20,
                    }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>No data yet</div>
          )}
        </div>

        {/* Zone bar chart */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '22px 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
            Sources by Zone & Quality Status
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Compliant" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Unfit" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Unsatisfactory" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Overdue" fill="#9333ea" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Persistent" fill="#7f1d1d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0' }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Recent Alerts Section */}
      {recentAlerts.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#dc2626" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Recent Critical Water Quality Alerts
              </h3>
            </div>
            <Link to="/alerts" style={{ fontSize: 12.5, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
              View All Alerts →
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Alert ID', 'Severity', 'Source', 'Location', 'Result', 'Status', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '10px 18px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #f1f5f9',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px 18px', fontSize: 12.5, fontWeight: 700, color: '#1e40af', fontFamily: 'monospace' }}>
                      {a.alert_id}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12,
                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                      }}>{a.severity}</span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>
                      {a.source_id_code}
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: '#64748b' }}>
                      {a.division_name} · {a.station_name}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: a.sample_result === 'UNFIT' ? '#dc2626' : a.sample_result === 'UNSATISFACTORY' ? '#d97706' : '#16a34a',
                      }}>{a.sample_result}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                        background: a.status === 'CLOSED' ? '#f0fdf4' : '#fef2f2',
                        color: a.status === 'CLOSED' ? '#16a34a' : '#dc2626',
                      }}>{a.status}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <Link to={`/alerts/${a.id}`} style={{
                        fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none',
                      }}>
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Water sources overview table */}
      <div style={{
        background: 'white', borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Droplets size={18} color="#2563eb" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Water Source Surveillance Overview
            </h3>
          </div>
          <Link to="/healthcard" style={{ fontSize: 12.5, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
            Open Health Cards →
          </Link>
        </div>
        {waterSources.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0' }}>
            No water sources found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Source ID', 'Type', 'Status', 'Bacteriological Due', 'Chemical Due', 'Disinfection Due'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      borderBottom: '1px solid #f1f5f9',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {waterSources.map((ws, idx) => {
                  const StatusIcon = ws.current_status === 'COMPLIANT' ? ShieldCheck
                    : ws.current_status === 'UNFIT' ? ShieldAlert : AlertTriangle;
                  const isDue = (dateStr: string | null) => dateStr && new Date(dateStr) < new Date();
                  return (
                    <tr key={ws.id} style={{
                      borderBottom: '1px solid #f8fafc',
                      background: idx % 2 === 0 ? 'white' : '#fafafa',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f0f9ff'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? 'white' : '#fafafa'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
                        {ws.source_id_code}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151' }}>
                        {ws.source_type || '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                          background: STATUS_BG[ws.current_status] || '#f8fafc',
                          color: STATUS_COLORS[ws.current_status] || '#64748b',
                        }}>
                          <StatusIcon size={12} />
                          {ws.current_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      {['next_bacteriological_sample_due', 'next_chemical_sample_due', 'next_disinfection_due'].map(field => (
                        <td key={field} style={{ padding: '14px 20px', fontSize: 13 }}>
                          {ws[field] ? (
                            <span style={{
                              color: isDue(ws[field]) ? '#dc2626' : '#374151',
                              fontWeight: isDue(ws[field]) ? 700 : 400,
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              {isDue(ws[field]) && <Clock size={12} />}
                              {new Date(ws[field]).toLocaleDateString('en-IN')}
                            </span>
                          ) : '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
