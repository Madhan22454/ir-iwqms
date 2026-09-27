import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import {
  AlertTriangle, CheckCircle,
  Droplets, Search, Maximize, Minimize, Crosshair,
  X, FlaskConical, ClipboardList, MapPin
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

export function Dashboard() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersMapRef = useRef<Map<number, L.Marker>>(new Map());
  
  const [loading, setLoading] = useState(true);
  
  // Master Data
  const [zones, setZones] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [waterSources, setWaterSources] = useState<any[]>([]);
  
  // UI State
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Filters
  const [filterZone, setFilterZone] = useState('ALL');
  const [filterDivision, setFilterDivision] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [z, d, s, ws] = await Promise.all([
          axios.get(`${API_URL}/hierarchy/zones/`),
          axios.get(`${API_URL}/hierarchy/divisions/`),
          axios.get(`${API_URL}/hierarchy/stations/`),
          axios.get(`${API_URL}/hierarchy/water-sources/`),
        ]);
        
        setZones(z.data);
        setDivisions(d.data);
        
        const stnMap: Record<number, any> = {};
        s.data.forEach((stn: any) => { stnMap[stn.id] = stn; });
        
        const mappedSources = ws.data.map((source: any) => ({
          ...source,
          station: stnMap[source.station_id]
        }));
        setWaterSources(mappedSources);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to load GIS data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Data
  const filteredSources = useMemo(() => {
    return waterSources.filter(ws => {
      if (filterStatus !== 'ALL' && ws.current_status !== filterStatus) return false;
      if (filterZone !== 'ALL' && ws.station?.division?.zone_id !== parseInt(filterZone)) return false;
      if (filterDivision !== 'ALL' && ws.station?.division_id !== parseInt(filterDivision)) return false;
      return true;
    });
  }, [waterSources, filterStatus, filterZone, filterDivision]);

  // Init Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || loading) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([22.5, 79.0], 5); // Center of India

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: function(cluster) {
        const children = cluster.getAllChildMarkers();
        let hasUnfit = false;
        let hasOverdue = false;
        
        children.forEach((marker: any) => {
          const status = marker.options.sourceData?.current_status;
          if (status === 'UNFIT' || status === 'PERSISTENT_FAILURE') hasUnfit = true;
          if (status === 'OVERDUE') hasOverdue = true;
        });

        let className = 'custom-cluster ';
        if (hasUnfit) className += 'cluster-critical';
        else if (hasOverdue) className += 'cluster-warning';
        else className += 'cluster-compliant';

        return L.divIcon({
          html: `<div>${children.length}</div>`,
          className: className,
          iconSize: L.point(40, 40)
        });
      }
    });

    map.addLayer(clusterGroup);
    mapRef.current = map;
    clusterGroupRef.current = clusterGroup;

  }, [loading]);

  // Update Markers
  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    markersMapRef.current.clear();

    const markers: L.Marker[] = [];

    filteredSources.forEach(ws => {
      const lat = ws.gps_lat || ws.station?.gps_lat;
      const lng = ws.gps_long || ws.station?.gps_long;
      if (!lat || !lng) return;

      const color = STATUS_COLORS[ws.current_status] || '#94a3b8';
      const isCritical = ws.current_status === 'UNFIT' || ws.current_status === 'PERSISTENT_FAILURE';

      const tooltipHtml = `
        <div style="padding: 14px; min-width: 240px; font-family: 'Outfit', sans-serif;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
            ${ws.current_status.replace(/_/g, ' ')}
          </div>
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">
            ${ws.source_id_code}
          </div>
          <div style="font-size: 12px; color: #475569; font-weight: 600; margin-bottom: 12px;">
            ${ws.station?.name || 'Unknown Station'}
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            <div>
              <div style="font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Type</div>
              <div style="font-size: 12px; color: #1e293b; font-weight: 700;">${ws.source_type || '—'}</div>
            </div>
            <div>
              <div style="font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Last Tested</div>
              <div style="font-size: 12px; color: #1e293b; font-weight: 700;">${ws.last_bacteriological_sample_date ? new Date(ws.last_bacteriological_sample_date).toLocaleDateString() : '—'}</div>
            </div>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            width: ${isCritical ? '24px' : '16px'}; 
            height: ${isCritical ? '24px' : '16px'}; 
            border-radius: 50%;
            background: ${color}; 
            border: 2px solid white;
            box-shadow: 0 0 10px ${color}80, 0 2px 4px rgba(0,0,0,0.3);
            ${isCritical ? 'animation: pulse-border 1.5s infinite;' : ''}
          "></div>
        `,
        iconAnchor: [isCritical ? 12 : 8, isCritical ? 12 : 8],
      });

      const marker = L.marker([lat, lng], { 
        icon,
        // @ts-ignore - custom property for cluster logic
        sourceData: ws 
      });
      
      marker.bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -10], opacity: 1 });
      
      marker.on('click', () => {
        setSelectedSource(ws);
        map.flyTo([lat, lng], 14, { duration: 1.5 });
      });

      markers.push(marker);
      markersMapRef.current.set(ws.id, marker);
    });

    clusterGroup.addLayers(markers);

  }, [filteredSources, loading]);

  // Controls
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleFitBounds = () => {
    if (clusterGroupRef.current && filteredSources.length > 0) {
      mapRef.current?.fitBounds(clusterGroupRef.current.getBounds(), { padding: [50, 50] });
    } else {
      mapRef.current?.setView([22.5, 79.0], 5);
    }
  };
  
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    const lowerQ = searchQuery.toLowerCase();
    const source = waterSources.find(s => 
      s.source_id_code?.toLowerCase().includes(lowerQ) || 
      s.station?.name?.toLowerCase().includes(lowerQ)
    );
    
    if (source) {
      const lat = source.gps_lat || source.station?.gps_lat;
      const lng = source.gps_long || source.station?.gps_long;
      if (lat && lng) {
        mapRef.current?.flyTo([lat, lng], 15, { duration: 2 });
        setSelectedSource(source);
        
        // Open tooltip
        setTimeout(() => {
          const marker = markersMapRef.current.get(source.id);
          if (marker) {
             // In cluster it might not be visible immediately, but flyTo will spiderfy/zoom
             clusterGroupRef.current?.zoomToShowLayer(marker, () => {
               marker.openTooltip();
             });
          }
        }, 2000);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#f8fafc' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const unfitCount = filteredSources.filter(w => w.current_status === 'UNFIT' || w.current_status === 'PERSISTENT_FAILURE').length;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', overflow: 'hidden', background: '#e2e8f0' }}>
      
      {/* 1. MAP CANVAS */}
      <div ref={mapContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }} />

      {/* 2. TOP HEADER (Floating) */}
      <div style={{ 
        position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none'
      }}>
        
        {/* Top Left: Title & Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'auto', maxWidth: 400, width: '100%' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
            padding: '16px 20px', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={20} color="#1e3a8a" /> GIS Command Centre
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 12px 0', fontWeight: 600 }}>
              Indian Railways Water Quality Surveillance
            </p>
            
            <form onSubmit={handleSearch} style={{ position: 'relative' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input 
                type="text" 
                placeholder="Search Station, Source ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
                  border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 13,
                  outline: 'none', fontWeight: 500, transition: 'all 0.2s'
                }}
                onFocus={e => e.target.style.background = 'white'}
                onBlur={e => e.target.style.background = '#f8fafc'}
              />
            </form>
          </div>
        </div>

        {/* Top Right: Filter Bar & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', pointerEvents: 'auto' }}>
          
          <div style={{ 
            display: 'flex', gap: 8, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
            padding: '8px', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            <select value={filterZone} onChange={e => { setFilterZone(e.target.value); setFilterDivision('ALL'); }} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700, outline: 'none', cursor: 'pointer', background: '#f8fafc' }}>
              <option value="ALL">All Zones</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            
            <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} disabled={filterZone === 'ALL'} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700, outline: 'none', cursor: 'pointer', background: filterZone === 'ALL' ? '#f1f5f9' : '#f8fafc', opacity: filterZone === 'ALL' ? 0.5 : 1 }}>
              <option value="ALL">All Divisions</option>
              {divisions.filter(d => d.zone_id === parseInt(filterZone)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {unfitCount > 0 && (
            <button 
              onClick={() => setFilterStatus('UNFIT')}
              style={{
                background: 'rgba(220, 38, 38, 0.95)', backdropFilter: 'blur(8px)',
                borderRadius: 24, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10,
                color: 'white', fontWeight: 800, fontSize: 13, boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
                border: '1px solid #f87171', cursor: 'pointer'
              }}
            >
              <AlertTriangle size={18} />
              {unfitCount} Critical Source{unfitCount > 1 ? 's' : ''}
            </button>
          )}

        </div>
      </div>

      {/* 3. LEFT FLOATING LEGEND */}
      <div style={{
        position: 'absolute', bottom: 40, left: 16, zIndex: 10, pointerEvents: 'auto',
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        padding: '16px', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255,255,255,0.8)', minWidth: 200
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Status Legend
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'ALL', label: 'All Sources', color: '#64748b' },
            { id: 'COMPLIANT', label: 'Compliant', color: '#16a34a' },
            { id: 'DUE', label: 'Due Soon', color: '#2563eb' },
            { id: 'OVERDUE', label: 'Overdue', color: '#9333ea' },
            { id: 'UNFIT', label: 'Unfit / Persistent', color: '#dc2626' }
          ].map(status => (
            <button
              key={status.id}
              onClick={() => setFilterStatus(status.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer',
                opacity: filterStatus === status.id || filterStatus === 'ALL' ? 1 : 0.4,
                transition: 'opacity 0.2s'
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: status.color, boxShadow: `0 0 6px ${status.color}80` }} />
              <span style={{ fontSize: 13, fontWeight: filterStatus === status.id ? 800 : 600, color: '#334155' }}>
                {status.label}
              </span>
              {filterStatus === status.id && <CheckCircle size={14} color={status.color} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* 4. RIGHT FLOATING CONTROLS */}
      <div style={{
        position: 'absolute', bottom: 40, right: 16, zIndex: 10, pointerEvents: 'auto',
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <button onClick={handleZoomIn} style={{ width: 40, height: 40, background: 'white', border: 'none', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}><span style={{ fontSize: 24, fontWeight: 300 }}>+</span></button>
          <button onClick={handleZoomOut} style={{ width: 40, height: 40, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}><span style={{ fontSize: 24, fontWeight: 300 }}>−</span></button>
        </div>
        
        <button onClick={handleFitBounds} title="Fit all sources" style={{ width: 40, height: 40, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
          <Crosshair size={18} />
        </button>

        <button onClick={toggleFullScreen} title="Fullscreen" style={{ width: 40, height: 40, background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
          {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {/* 5. BOTTOM STATUS BAR */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'none',
        display: 'flex', justifyContent: 'center', paddingBottom: 12
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          padding: '6px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f8fafc', fontSize: 11, fontWeight: 700 }}>
            <Droplets size={12} color="#60a5fa" /> Sources Displayed: {filteredSources.length}
          </div>
          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f8fafc', fontSize: 11, fontWeight: 600 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            LIVE • Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* 6. RIGHT CONTEXTUAL DRAWER (Detail Panel) */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 420,
        background: 'white', zIndex: 20, boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
        transform: selectedSource ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column', pointerEvents: 'auto'
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

            {/* Drawer Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {/* Info Box */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                  Source Characteristics
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f8fafc', padding: '16px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Type</div>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700 }}>{selectedSource.source_type || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Capacity</div>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700 }}>{selectedSource.capacity || '—'}</div>
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

              {/* Sampling Schedule */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                  Sampling Compliance
                </h3>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>
                      <FlaskConical size={14} color="#059669" /> Bacteriological
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedSource.next_bacteriological_sample_due && new Date(selectedSource.next_bacteriological_sample_due) < new Date() ? '#dc2626' : '#64748b' }}>
                      Due: {selectedSource.next_bacteriological_sample_due ? new Date(selectedSource.next_bacteriological_sample_due).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#334155' }}>
                      <FlaskConical size={14} color="#0284c7" /> Chemical
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedSource.next_chemical_sample_due && new Date(selectedSource.next_chemical_sample_due) < new Date() ? '#dc2626' : '#64748b' }}>
                      Due: {selectedSource.next_chemical_sample_due ? new Date(selectedSource.next_chemical_sample_due).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
                <Link to={`/lab/result-entry?source_id=${selectedSource.id}`} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white',
                  textDecoration: 'none', fontWeight: 800, fontSize: 14,
                  boxShadow: '0 4px 15px rgba(37,99,235,0.3)', transition: 'transform 0.2s'
                }}>
                  <FlaskConical size={18} /> Record New Test Result
                </Link>
                
                {selectedSource.current_status === 'UNFIT' && (
                  <Link to={`/corrective-actions`} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: 'white', color: '#dc2626', border: '1px solid #fecaca',
                    textDecoration: 'none', fontWeight: 800, fontSize: 14,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}>
                    <ClipboardList size={18} /> Manage Corrective Action
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
    </div>
  );
}
