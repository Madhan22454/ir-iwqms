import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import {
  Train,
  Droplets,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  CalendarCheck,
  FlaskConical,
  MapPin,
  FileText,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { API_URL } from '../config/api';

interface DashboardSummaryData {
  infrastructure: {
    zones: number;
    divisions: number;
    stations: number;
    water_sources: number;
  };
  water_quality: {
    compliant: number;
    due: number;
    overdue: number;
    unfit: number;
    persistent_failure: number;
    unsatisfactory: number;
  };
  operations: {
    open_alerts: number;
    escalated_alerts: number;
    open_corrective_actions: number;
    disinfection_due: number;
    repeat_samples_pending: number;
  };
  recent_alerts: Array<{
    id: number;
    alert_id: string;
    severity: string;
    status: string;
    source_id_code: string;
    station_name: string;
    zone_name: string;
    sample_result: string;
    created_at: string;
  }>;
  recent_lab_reports: Array<{
    id: number;
    report_id: string;
    overall_result: string;
    report_date?: string;
    created_at?: string;
  }>;
  generated_at?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, stnRes] = await Promise.allSettled([
        axios.get(`${API_URL}/dashboard/summary`),
        axios.get(`${API_URL}/hierarchy/stations/`),
      ]);

      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value.data);
      }
      if (stnRes.status === 'fulfilled') {
        setStations(stnRes.value.data || []);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize and update compact mini-map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.5, 80.0],
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      const clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      });
      map.addLayer(clusterGroup);

      mapInstanceRef.current = map;
      clusterGroupRef.current = clusterGroup;
    }

    // Populate markers if stations available
    if (clusterGroupRef.current && stations.length > 0) {
      clusterGroupRef.current.clearLayers();

      stations.forEach(stn => {
        if (stn.gps_lat && stn.gps_long) {
          const marker = L.circleMarker([stn.gps_lat, stn.gps_long], {
            radius: 6,
            fillColor: '#1e3a8a',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85,
          });

          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 12px; padding: 4px;">
              <strong style="color: #1e3a8a; font-size: 13px;">${stn.name} (${stn.code})</strong>
              <div style="color: #64748b; margin-top: 4px;">Category: ${stn.category || 'Standard'}</div>
              <div style="margin-top: 6px;">
                <a href="/stations/${stn.id}" style="color: #2563eb; font-weight: 700; text-decoration: none;">
                  View Station Details &rarr;
                </a>
              </div>
            </div>
          `);

          clusterGroupRef.current?.addLayer(marker);
        }
      });
    }

    return () => {
      // Keep map instance alive across rerenders
    };
  }, [stations]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f8fafc', padding: '24px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Top Control Centre Banner & Quick Actions */}
        <div style={{
          background: 'linear-gradient(135deg, #091224 0%, #0f2347 50%, #1e3a8a 100%)',
          borderRadius: 14,
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: 12,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Train size={30} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'white', letterSpacing: '-0.3px' }}>
                    IR-IWQMS Control Centre
                  </h1>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(59,130,246,0.25)',
                    color: '#93c5fd',
                    border: '1px solid rgba(147,197,253,0.3)',
                    letterSpacing: '0.04em'
                  }}>
                    LIVE SURVEILLANCE
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0 0' }}>
                  Indian Railways Integrated Water Quality Monitoring & Rapid Response Surveillance System
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <button
                onClick={fetchData}
                disabled={loading}
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
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.12)'
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick Dispatch:
            </span>

            <button
              onClick={() => navigate('/sampling')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: '#ffffff',
                color: '#1e3a8a',
                fontSize: 12.5,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              <CalendarCheck size={14} color="#1e3a8a" />
              Record Sample
            </button>

            <button
              onClick={() => navigate('/gis')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.25)',
                cursor: 'pointer'
              }}
            >
              <MapPin size={14} />
              View GIS Map
            </button>

            <button
              onClick={() => navigate('/water-sources')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.25)',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} />
              New Water Source
            </button>

            <button
              onClick={() => navigate('/reports')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.25)',
                cursor: 'pointer'
              }}
            >
              <FileText size={14} />
              Generate Report
            </button>
          </div>
        </div>

        {/* Real KPI Cards: Infrastructure Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div
            onClick={() => navigate('/master-data')}
            style={{
              background: '#ffffff',
              padding: '20px 22px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Total Railway Zones</span>
              <Layers size={18} color="#1e3a8a" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', marginTop: 8 }}>
              {summary?.infrastructure?.zones ?? 0}
            </div>
            <div style={{ fontSize: 12, color: '#1e3a8a', marginTop: 4, fontWeight: 600 }}>
              Zonal administrative networks
            </div>
          </div>

          <div
            onClick={() => navigate('/master-data')}
            style={{
              background: '#ffffff',
              padding: '20px 22px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Total Divisions</span>
              <Train size={18} color="#2563eb" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', marginTop: 8 }}>
              {summary?.infrastructure?.divisions ?? 0}
            </div>
            <div style={{ fontSize: 12, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>
              Divisional railway commands
            </div>
          </div>

          <div
            onClick={() => navigate('/stations')}
            style={{
              background: '#ffffff',
              padding: '20px 22px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Monitored Stations</span>
              <MapPin size={18} color="#0d9488" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', marginTop: 8 }}>
              {summary?.infrastructure?.stations ?? 0}
            </div>
            <div style={{ fontSize: 12, color: '#0d9488', marginTop: 4, fontWeight: 600 }}>
              Registered station hubs
            </div>
          </div>

          <div
            onClick={() => navigate('/water-sources')}
            style={{
              background: '#ffffff',
              padding: '20px 22px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Total Water Sources</span>
              <Droplets size={18} color="#0284c7" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', marginTop: 8 }}>
              {summary?.infrastructure?.water_sources ?? 0}
            </div>
            <div style={{ fontSize: 12, color: '#0284c7', marginTop: 4, fontWeight: 600 }}>
              Borewells, plants & reservoirs
            </div>
          </div>
        </div>

        {/* Water Quality & Operational Queue 2-Column Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20 }}>
          
          {/* Water Quality Status Breakdown */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Water Quality Status Breakdown
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>
                  Live surveillance status of all railway water sources
                </p>
              </div>
              <Link to="/water-sources" style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                Full List <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>COMPLIANT</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#166534', marginTop: 4 }}>
                  {summary?.water_quality?.compliant ?? 0}
                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>DUE</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#92400e', marginTop: 4 }}>
                  {summary?.water_quality?.due ?? 0}
                </div>
              </div>

              <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>OVERDUE</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#9a3412', marginTop: 4 }}>
                  {summary?.water_quality?.overdue ?? 0}
                </div>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>UNFIT</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#991b1b', marginTop: 4 }}>
                  {summary?.water_quality?.unfit ?? 0}
                </div>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>PERSISTENT</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#7f1d1d', marginTop: 4 }}>
                  {summary?.water_quality?.persistent_failure ?? 0}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>UNSATISFACTORY</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#334155', marginTop: 4 }}>
                  {summary?.water_quality?.unsatisfactory ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Operational Queue */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Immediate Action Queue
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>
                  Pending tasks and active operational workflows
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                to="/alerts"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={17} color="#dc2626" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Active Open Alerts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#dc2626' }}>
                    {summary?.operations?.open_alerts ?? 0}
                  </span>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </Link>

              <Link
                to="/escalations"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldAlert size={17} color="#b91c1c" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Escalated to Zonal/Central</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#b91c1c' }}>
                    {summary?.operations?.escalated_alerts ?? 0}
                  </span>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </Link>

              <Link
                to="/corrective-actions"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ClipboardList size={17} color="#ea580c" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Open Corrective Actions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#ea580c' }}>
                    {summary?.operations?.open_corrective_actions ?? 0}
                  </span>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </Link>

              <Link
                to="/disinfection"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sparkles size={17} color="#0f766e" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Disinfection & Dosing Due</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0f766e' }}>
                    {summary?.operations?.disinfection_due ?? 0}
                  </span>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* Embedded Compact Mini-Map */}
        <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Pan-India Railway Water Surveillance GIS Map
              </h3>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>
                Real-time geographic distribution of station water sampling points
              </p>
            </div>
            <Link
              to="/gis"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 6,
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid #bfdbfe'
              }}
            >
              Open Full GIS Map <ExternalLink size={12} />
            </Link>
          </div>

          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: 320,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          />
        </div>

        {/* Recent Alerts & Recent Lab Results 2-Column Feed */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20 }}>
          
          {/* Recent Alerts Feed (Last 5) */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} color="#dc2626" />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Recent Water Quality Alerts
                </h3>
              </div>
              <Link to="/alerts" style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
                View All
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(!summary?.recent_alerts || summary.recent_alerts.length === 0) ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No recent alerts generated.
                </div>
              ) : (
                summary.recent_alerts.slice(0, 5).map(a => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/alerts/${a.id}`)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 12, color: '#dc2626' }}>
                          {a.alert_id}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#fef2f2', color: '#dc2626' }}>
                          {a.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', marginTop: 3 }}>
                        {a.station_name} • <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{a.source_id_code}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
                        {a.sample_result}
                      </span>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Lab Results Feed (Last 5) */}
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FlaskConical size={18} color="#2563eb" />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Recent Lab Report Evaluations
                </h3>
              </div>
              <Link to="/lab/result-entry" style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
                Lab Portal
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(!summary?.recent_lab_reports || summary.recent_lab_reports.length === 0) ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No recent lab reports recorded.
                </div>
              ) : (
                summary.recent_lab_reports.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 12, color: '#1e3a8a' }}>
                        {r.report_id}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                        Report Date: {r.report_date ? new Date(r.report_date).toLocaleDateString('en-IN') : '—'}
                      </div>
                    </div>
                    <div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: r.overall_result === 'FIT' ? '#f0fdf4' : '#fef2f2',
                        color: r.overall_result === 'FIT' ? '#16a34a' : '#dc2626',
                        border: `1px solid ${r.overall_result === 'FIT' ? '#bbf7d0' : '#fecaca'}`
                      }}>
                        {r.overall_result || 'EVALUATED'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
