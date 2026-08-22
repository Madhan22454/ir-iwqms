import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Clock, Droplets,
  MapPin, QrCode, FlaskConical, X
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api/v1';

const STATUS_CONFIG: Record<string, { icon: any; bg: string; text: string; border: string; label: string }> = {
  COMPLIANT: { icon: ShieldCheck, bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Compliant' },
  UNFIT: { icon: ShieldAlert, bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Unfit' },
  UNSATISFACTORY: { icon: AlertTriangle, bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Unsatisfactory' },
  OVERDUE: { icon: Clock, bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff', label: 'Overdue' },
  DUE: { icon: Clock, bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'Due' },
  PERSISTENT_FAILURE: { icon: ShieldAlert, bg: '#fff1f2', text: '#7f1d1d', border: '#fecdd3', label: 'Persistent Failure' },
};

const DEFAULT_STATUS = { icon: AlertTriangle, bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: 'Unknown' };

interface Station {
  id: number;
  name: string;
  code: string;
  category: string;
  division_id: number;
}

interface HealthCardData {
  water_source_id: number;
  source_id_code: string;
  source_type?: string;
  capacity?: string;
  areas_supplied?: string;
  population_served?: number;
  disinfection_method?: string;
  residual_chlorine_last?: number;
  consecutive_failures?: number;
  total_failures?: number;
  station_name: string;
  division_name: string;
  zone_name: string;
  status: string;
  last_bacteriological_date: string | null;
  next_bacteriological_due: string | null;
  last_chemical_date: string | null;
  next_chemical_due: string | null;
  last_disinfection_date: string | null;
  next_disinfection_due: string | null;
  active_alerts_count?: number;
  latest_alert_id?: string | null;
}

function DateRow({ label, last, next }: { label: string; last: string | null; next: string | null }) {
  const isOverdue = next && new Date(next) < new Date();
  return (
    <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          Last: {last ? new Date(last).toLocaleDateString('en-IN') : '—'}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: isOverdue ? '#dc2626' : '#374151',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {isOverdue && <Clock size={11} />}
          Due: {next ? new Date(next).toLocaleDateString('en-IN') : '—'}
        </span>
      </div>
    </div>
  );
}

export function HealthCard() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [data, setData] = useState<HealthCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [qrModalItem, setQrModalItem] = useState<HealthCardData | null>(null);

  // Load station list on mount
  useEffect(() => {
    axios.get(`${API_URL}/hierarchy/stations/`)
      .then(res => {
        setStations(res.data);
        if (res.data.length > 0) {
          setSelectedStationId(String(res.data[0].id));
        }
      })
      .catch(err => console.error('Failed to load stations:', err))
      .finally(() => setStationsLoading(false));
  }, []);

  // Fetch health cards when station selection changes
  useEffect(() => {
    if (!selectedStationId) return;
    fetchHealthCards();
  }, [selectedStationId]);

  const fetchHealthCards = async () => {
    if (!selectedStationId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/health/healthcard/station/${selectedStationId}`);
      setData(res.data);
    } catch (error) {
      console.error('Error fetching health cards:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedStation = stations.find(s => String(s.id) === selectedStationId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Water Source Health Cards
          </h2>
          {selectedStation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <MapPin size={14} color="#64748b" />
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
                {selectedStation.name} ({selectedStation.code}) · Category: {selectedStation.category}
              </p>
            </div>
          )}
        </div>

        {/* Station selector */}
        <div style={{
          background: 'white', borderRadius: 12, padding: '12px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <MapPin size={16} color="#64748b" />
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
            Station:
          </label>
          {stationsLoading ? (
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading...</span>
          ) : (
            <select
              id="stationSelect"
              value={selectedStationId}
              onChange={e => setSelectedStationId(e.target.value)}
              style={{
                border: 'none', outline: 'none', fontSize: 13.5, fontWeight: 700,
                color: '#1e3a8a', background: 'transparent', cursor: 'pointer',
                fontFamily: 'inherit', minWidth: 200,
              }}
            >
              {stations.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 240 }}>
          <div style={{
            width: 44, height: 44, border: '4px solid #e2e8f0',
            borderTopColor: '#2563eb', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : data.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 16, padding: '60px 24px',
          textAlign: 'center', color: '#94a3b8',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <Droplets size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', margin: 0 }}>
            No water sources found for this station.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {data.map((card, idx) => {
            const cfg = STATUS_CONFIG[card.status] || DEFAULT_STATUS;
            const StatusIcon = cfg.icon;
            return (
              <div key={idx} style={{
                background: 'white', borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                border: '1px solid #f1f5f9',
                display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget).style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                  (e.currentTarget).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)';
                  (e.currentTarget).style.transform = 'none';
                }}
              >
                {/* Card header */}
                <div style={{
                  padding: '16px 20px', background: cfg.bg,
                  borderBottom: `2px solid ${cfg.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                      {card.source_id_code}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} />
                      {card.station_name} · {card.division_name}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setQrModalItem(card)}
                      title="View QR Code"
                      style={{
                        background: 'white', borderRadius: 8, padding: 6, border: `1px solid ${cfg.border}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <QrCode size={16} color="#475569" />
                    </button>
                    <div style={{
                      background: 'white', borderRadius: 8, padding: 6,
                      border: `1px solid ${cfg.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <StatusIcon size={18} color={cfg.text} />
                    </div>
                  </div>
                </div>

                {/* Status + Failure Count */}
                <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                    background: cfg.bg, color: cfg.text,
                    border: `1px solid ${cfg.border}`,
                  }}>
                    <StatusIcon size={11} />
                    {cfg.label}
                  </span>

                  {card.consecutive_failures && card.consecutive_failures > 0 ? (
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, color: '#b91c1c',
                      background: '#fef2f2', padding: '2px 8px', borderRadius: 6, border: '1px solid #fecaca',
                    }}>
                      ⚠ {card.consecutive_failures} Failure{card.consecutive_failures > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>

                {/* Source Metadata */}
                <div style={{ padding: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: 11, display: 'block', fontWeight: 600 }}>TYPE</span>
                    <span style={{ color: '#334155', fontWeight: 600 }}>{card.source_type || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: 11, display: 'block', fontWeight: 600 }}>CAPACITY</span>
                    <span style={{ color: '#334155', fontWeight: 600 }}>{card.capacity || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: 11, display: 'block', fontWeight: 600 }}>DISINFECTION</span>
                    <span style={{ color: '#334155', fontWeight: 600 }}>{card.disinfection_method || '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: 11, display: 'block', fontWeight: 600 }}>POPULATION</span>
                    <span style={{ color: '#334155', fontWeight: 600 }}>
                      {card.population_served ? `${card.population_served.toLocaleString()}` : '—'}
                    </span>
                  </div>
                </div>

                {/* Date rows */}
                <div style={{ padding: '14px 20px', flex: 1 }}>
                  <DateRow
                    label="Bacteriological Test"
                    last={card.last_bacteriological_date}
                    next={card.next_bacteriological_due}
                  />
                  <DateRow
                    label="Chemical Test"
                    last={card.last_chemical_date}
                    next={card.next_chemical_due}
                  />
                  <DateRow
                    label="Disinfection"
                    last={card.last_disinfection_date}
                    next={card.next_disinfection_due}
                  />
                </div>

                {/* Card Footer Actions */}
                <div style={{
                  padding: '10px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  {card.latest_alert_id ? (
                    <Link to="/alerts" style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2626', textDecoration: 'none' }}>
                      🚨 View Alert
                    </Link>
                  ) : (
                    <span style={{ fontSize: 11.5, color: '#64748b' }}>No active alerts</span>
                  )}

                  <Link to="/lab/result-entry" style={{
                    fontSize: 11.5, fontWeight: 700, color: '#2563eb', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <FlaskConical size={12} /> Test Result
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '28px', maxWidth: 360, width: '90%',
            textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Water Source QR Code</div>
              <button onClick={() => setQrModalItem(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Generated QR visual code */}
            <div style={{
              background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 14,
              padding: '24px', margin: '0 auto 16px', width: 180, height: 180,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <QrCode size={100} color="#1e3a8a" />
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>
                IR-IWQMS-QR
              </div>
            </div>

            <div style={{ fontSize: 16, fontWeight: 800, color: '#1e40af' }}>
              {qrModalItem.source_id_code}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              {qrModalItem.station_name} · {qrModalItem.division_name} ({qrModalItem.zone_name})
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, marginTop: 8,
              display: 'inline-block', padding: '3px 10px', borderRadius: 12,
              background: STATUS_CONFIG[qrModalItem.status]?.bg || '#f8fafc',
              color: STATUS_CONFIG[qrModalItem.status]?.text || '#64748b',
            }}>
              Status: {qrModalItem.status}
            </div>

            <div style={{ marginTop: 20 }}>
              <button onClick={() => window.print()} style={{
                width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                background: '#1e3a8a', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                Print QR Sticker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
