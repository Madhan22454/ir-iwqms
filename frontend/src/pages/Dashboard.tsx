import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  MapPin, AlertTriangle, ShieldCheck, ShieldAlert,
  Droplets, Building2, TrendingUp, Filter, Search,
  ChevronRight, X, Clock, FlaskConical, ClipboardList, RefreshCw
} from 'lucide-react';

import { API_URL } from '../config/api';

const STATUS_COLORS: Record<string, string> = {
  COMPLIANT: '#16a34a',
  UNSATISFACTORY: '#d97706',
  CORRECTIVE_ACTION: '#ea580c',
  UNFIT: '#dc2626',
  OVERDUE: '#9333ea',
  PERSISTENT_FAILURE: '#991b1b',
  DUE: '#2563eb',
};

const STATUS_BG: Record<string, string> = {
  COMPLIANT: '#f0fdf4',
  UNSATISFACTORY: '#fffbeb',
  CORRECTIVE_ACTION: '#fff7ed',
  UNFIT: '#fef2f2',
  OVERDUE: '#faf5ff',
  PERSISTENT_FAILURE: '#fef2f2',
  DUE: '#eff6ff',
};

function OverlayCard({ title, value, icon: Icon, color, bg, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: 16, padding: '16px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.03)',
        border: '1px solid rgba(255,255,255,0.4)',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        if(onClick) {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={e => {
        if(onClick) {
          (e.currentTarget as HTMLDivElement).style.transform = 'none';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.03)';
        }
      }}
    >
      <div style={{ background: bg, borderRadius: 12, padding: 12, flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  
  // Data
  const [zones, setZones] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [waterSources, setWaterSources] = useState<any[]>([]);
  const [alertSummary, setAlertSummary] = useState<any>(null);
  const [caCount, setCaCount] = useState(0);
  
  // State
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Load Leaflet dynamically
  useEffect(() => {
    if (document.getElementById('leaflet-css')) {
      setLeafletLoaded(true);
      return;
    }
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  const fetchData = async () => {
    try {
      const [z, d, s, ws, summary, cas] = await Promise.all([
        axios.get(`${API_URL}/hierarchy/zones/`),
        axios.get(`${API_URL}/hierarchy/divisions/`),
        axios.get(`${API_URL}/hierarchy/stations/`),
        axios.get(`${API_URL}/hierarchy/water-sources/`),
        axios.get(`${API_URL}/alerts/summary`),
        axios.get(`${API_URL}/workflow/corrective-actions/?status=OPEN`),
      ]);
      
      setZones(z.data);
      setDivisions(d.data);
      
      const stnMap: Record<number, any> = {};
      s.data.forEach((stn: any) => { stnMap[stn.id] = stn; });
      setStations(s.data);
      
      const mappedSources = ws.data.map((source: any) => ({
        ...source,
        station: stnMap[source.station_id]
      }));
      setWaterSources(mappedSources);
      
      setAlertSummary(summary.data);
      setCaCount(cas.data.length);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize and update Map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || loading) return;
    
    const L = (window as any).L;
    
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false, // We'll position it custom or rely on scroll
      }).setView([22.5, 79.0], 5); // Center of India roughly
      
      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // Clean, light, professional map tiles (CartoDB Positron)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);
      
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Filter sources
    const filteredSources = filterStatus === 'ALL' 
      ? waterSources 
      : waterSources.filter(ws => ws.current_status === filterStatus);

    filteredSources.forEach(ws => {
      const lat = ws.gps_lat || ws.station?.gps_lat;
      const lng = ws.gps_long || ws.station?.gps_long;
      if (!lat || !lng) return;

      const color = STATUS_COLORS[ws.current_status] || '#94a3b8';
      const isCritical = ws.current_status === 'UNFIT' || ws.current_status === 'PERSISTENT_FAILURE';
      const isOverdue = ws.current_status === 'OVERDUE';

      // Advanced Hover Tooltip HTML
      const tooltipHtml = `
        <div style="padding: 12px; min-width: 220px; font-family: 'Outfit', sans-serif;">
          <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            ${ws.station?.name || 'Unknown Station'}
          </div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 8px;">
            ${ws.source_id_code}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; background: ${STATUS_BG[ws.current_status] || '#f8fafc'}; color: ${color}; border: 1px solid ${color}40; margin-bottom: 12px;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: ${color}; box-shadow: 0 0 4px ${color}; ${isCritical ? 'animation: pulse 1s infinite;' : ''}"></div>
            ${ws.current_status.replace(/_/g, ' ')}
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            <div>
              <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Source Type</div>
              <div style="font-size: 12px; color: #1e293b; font-weight: 600;">${ws.source_type || '—'}</div>
            </div>
            <div>
              <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase;">Disinfection</div>
              <div style="font-size: 12px; color: #1e293b; font-weight: 600;">${ws.disinfection_method || '—'}</div>
            </div>
          </div>
          
          <div style="margin-top: 12px; font-size: 11px; font-weight: 700; color: #2563eb; text-align: center; background: #eff6ff; padding: 6px; border-radius: 6px;">
            Click to view full details
          </div>
        </div>
      `;

      // Custom Marker Icon
      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            width: ${isCritical || isOverdue ? '22px' : '18px'}; 
            height: ${isCritical || isOverdue ? '22px' : '18px'}; 
            border-radius: 50%;
            background: ${color}; 
            border: 2px solid white;
            box-shadow: 0 0 10px ${color}80, 0 2px 4px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
            ${isCritical ? 'animation: pulse 1.5s infinite;' : ''}
          "></div>
        `,
        iconAnchor: [isCritical || isOverdue ? 11 : 9, isCritical || isOverdue ? 11 : 9],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      
      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -10],
        opacity: 1,
      });

      marker.on('click', () => {
        setSelectedSource(ws);
        map.flyTo([lat, lng], 12, { duration: 1.5 });
      });

      // Hover effects
      marker.on('mouseover', (e: any) => {
        const el = e.target.getElement().firstChild;
        if(el) {
          el.style.transform = 'scale(1.3)';
          el.style.zIndex = 1000;
        }
      });
      marker.on('mouseout', (e: any) => {
        const el = e.target.getElement().firstChild;
        if(el) {
          el.style.transform = 'scale(1)';
          el.style.zIndex = 'auto';
        }
      });

      markersRef.current.push(marker);
    });
    
  }, [leafletLoaded, loading, waterSources, filterStatus]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#f8fafc' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Calculate stats
  const total = waterSources.length;
  const compliant = waterSources.filter(w => w.current_status === 'COMPLIANT').length;
  const unfit = waterSources.filter(w => w.current_status === 'UNFIT' || w.current_status === 'PERSISTENT_FAILURE').length;
  const overdue = waterSources.filter(w => w.current_status === 'OVERDUE').length;
  
  const compRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', overflow: 'hidden' }}>
      
      {/* MAP LAYER */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* OVERLAY: Top Floating Widgets */}
      <div style={{ 
        position: 'absolute', top: 24, left: 24, right: 24, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' 
      }}>
        
        {/* Left Side: Summary Cards */}
        <div style={{ display: 'flex', gap: 16, pointerEvents: 'auto' }}>
          <OverlayCard title="Total Sources" value={total} icon={Droplets} color="#2563eb" bg="#eff6ff" onClick={() => setFilterStatus('ALL')} />
          <OverlayCard title="Compliant Rate" value={`${compRate}%`} icon={ShieldCheck} color="#16a34a" bg="#f0fdf4" onClick={() => setFilterStatus('COMPLIANT')} />
          
          {(unfit > 0 || filterStatus === 'UNFIT') && (
            <OverlayCard title="Unfit Sources" value={unfit} icon={ShieldAlert} color="#dc2626" bg="#fef2f2" onClick={() => setFilterStatus('UNFIT')} />
          )}
          
          {(overdue > 0 || filterStatus === 'OVERDUE') && (
            <OverlayCard title="Overdue" value={overdue} icon={Clock} color="#9333ea" bg="#faf5ff" onClick={() => setFilterStatus('OVERDUE')} />
          )}
        </div>

        {/* Right Side: Alerts & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', pointerEvents: 'auto' }}>
          {alertSummary?.critical > 0 && (
            <Link to="/alerts" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(220, 38, 38, 0.95)', backdropFilter: 'blur(8px)',
                borderRadius: 24, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10,
                color: 'white', fontWeight: 800, fontSize: 13, boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
                border: '1px solid #f87171', transition: 'transform 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'}
              >
                <AlertTriangle size={18} />
                {alertSummary.critical} Critical Alert{alertSummary.critical > 1 ? 's' : ''}
                <ChevronRight size={16} />
              </div>
            </Link>
          )}

          <div style={{
            background: 'white', borderRadius: 16, padding: 6,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
            display: 'flex', gap: 6
          }}>
            <button 
              onClick={fetchData}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10,
                border: 'none', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
            >
              <RefreshCw size={16} /> Refresh Map
            </button>
            <Link to="/healthcard" style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10,
                border: 'none', background: '#1e3a8a', color: 'white', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', textDecoration: 'none'
              }}>
              <Search size={16} /> Registry View
            </Link>
          </div>
        </div>
      </div>

      {/* OVERLAY: Active Filter Notice */}
      {filterStatus !== 'ALL' && (
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)',
          borderRadius: 30, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Filter size={14} color="#94a3b8" />
          <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
            Showing: <span style={{ color: STATUS_COLORS[filterStatus], fontWeight: 800 }}>{filterStatus.replace(/_/g, ' ')}</span>
          </span>
          <button 
            onClick={() => setFilterStatus('ALL')}
            style={{ 
              background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', 
              borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* SIDE DRAWER: Station Detail Panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 440,
        background: 'white', zIndex: 20, boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
        transform: selectedSource ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column'
      }}>
        {selectedSource && (
          <>
            {/* Drawer Header */}
            <div style={{ 
              padding: '24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {selectedSource.station?.name || 'Station'} • {selectedSource.station?.division?.name || 'Division'}
                  </div>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  {selectedSource.source_id_code}
                </h2>
                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: STATUS_BG[selectedSource.current_status] || '#f1f5f9', color: STATUS_COLORS[selectedSource.current_status] || '#475569', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', border: `1px solid ${STATUS_COLORS[selectedSource.current_status]}40` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[selectedSource.current_status] }}></div>
                  {selectedSource.current_status.replace(/_/g, ' ')}
                </div>
              </div>
              <button 
                onClick={() => setSelectedSource(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Drawer Content - Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {/* Section: Details */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Droplets size={16} color="#2563eb" /> Source Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Source Type</div>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700 }}>{selectedSource.source_type || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Population Served</div>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700 }}>{selectedSource.population_served?.toLocaleString() || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Disinfection</div>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700 }}>{selectedSource.disinfection_method || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Last Disinfected</div>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700 }}>
                      {selectedSource.last_disinfection_date ? new Date(selectedSource.last_disinfection_date).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Sampling Compliance */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FlaskConical size={16} color="#059669" /> Sampling Status
                </h3>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Bacteriological</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selectedSource.next_bacteriological_sample_due && new Date(selectedSource.next_bacteriological_sample_due) < new Date() ? '#dc2626' : '#64748b' }}>
                      Due: {selectedSource.next_bacteriological_sample_due ? new Date(selectedSource.next_bacteriological_sample_due).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Chemical</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selectedSource.next_chemical_sample_due && new Date(selectedSource.next_chemical_sample_due) < new Date() ? '#dc2626' : '#64748b' }}>
                      Due: {selectedSource.next_chemical_sample_due ? new Date(selectedSource.next_chemical_sample_due).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to={`/lab/result-entry?source_id=${selectedSource.id}`} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white',
                  textDecoration: 'none', fontWeight: 800, fontSize: 14,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                }}>
                  <FlaskConical size={18} /> Enter Lab Result
                </Link>
                
                {selectedSource.current_status === 'UNFIT' && (
                  <Link to={`/corrective-actions`} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: 'white', color: '#dc2626', border: '1px solid #fecaca',
                    textDecoration: 'none', fontWeight: 800, fontSize: 14,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <ClipboardList size={18} /> Manage Corrective Action
                  </Link>
                )}
              </div>

            </div>
          </>
        )}
      </div>
      
      {/* Backdrop for drawer */}
      {selectedSource && (
        <div 
          onClick={() => setSelectedSource(null)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 15, backdropFilter: 'blur(2px)' }} 
        />
      )}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}</style>
    </div>
  );
}
