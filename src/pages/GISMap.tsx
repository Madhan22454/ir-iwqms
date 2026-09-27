import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { 
  MapPin, Search, Filter, X, ChevronRight, AlertTriangle, 
  Info, ShieldAlert, Activity, Droplets
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { API_URL as API } from '../config/api';

const STATUS_CONFIG: Record<string, { color: string, label: string, priority: number }> = {
  PERSISTENT_FAILURE: { color: '#7f1d1d', label: 'Persistent Failure', priority: 6 },
  UNFIT: { color: '#ef4444', label: 'Unfit / Critical', priority: 5 },
  OVERDUE: { color: '#f97316', label: 'Overdue', priority: 4 },
  ATTENTION: { color: '#eab308', label: 'Attention Needed', priority: 3 },
  COMPLIANT: { color: '#22c55e', label: 'Compliant', priority: 2 },
  NO_SOURCES: { color: '#6b7280', label: 'No Registered Sources', priority: 1 },
};

const WS_STATUS_MAP: Record<string, string> = {
  'PERSISTENT_FAILURE': 'PERSISTENT_FAILURE',
  'UNFIT': 'UNFIT',
  'OVERDUE': 'OVERDUE',
  'CORRECTIVE_ACTION': 'OVERDUE',
  'UNSATISFACTORY': 'ATTENTION',
  'DUE': 'ATTENTION',
  'COMPLIANT': 'COMPLIANT'
};

export default function GISMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any>(null);

  // Data state
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<any[]>([]);
  const [waterSources, setWaterSources] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  // UI state
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDivision, setFilterDivision] = useState<string>('ALL');

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [stnRes, wsRes, divRes, zoneRes] = await Promise.all([
          axios.get(`${API}/hierarchy/stations/`),
          axios.get(`${API}/hierarchy/water-sources/`),
          axios.get(`${API}/hierarchy/divisions/`),
          axios.get(`${API}/hierarchy/zones/`),
        ]);
        
        setStations(stnRes.data || []);
        setWaterSources(wsRes.data || []);
        setDivisions(divRes.data || []);
        setZones(zoneRes.data || []);
      } catch (err) {
        console.error("Failed to load GIS data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Processed Data
  const processedStations = useMemo(() => {
    if (!stations.length) return [];
    
    const divMap = new Map(divisions.map(d => [d.id, d]));
    const zoneMap = new Map(zones.map(z => [z.id, z]));
    
    return stations.map(stn => {
      const div = divMap.get(stn.division_id);
      const zone = div ? zoneMap.get(div.zone_id) : null;
      
      const stnSources = waterSources.filter(ws => ws.station_id === stn.id);
      
      let stnStatus = 'NO_SOURCES';
      let maxPriority = 0;
      
      stnSources.forEach(ws => {
        const mappedStatus = WS_STATUS_MAP[ws.current_status] || 'COMPLIANT';
        const priority = STATUS_CONFIG[mappedStatus]?.priority || 0;
        if (priority > maxPriority) {
          maxPriority = priority;
          stnStatus = mappedStatus;
        }
      });

      return {
        ...stn,
        division: div,
        zone: zone,
        sources: stnSources,
        status: stnStatus,
        color: STATUS_CONFIG[stnStatus].color
      };
    });
  }, [stations, waterSources, divisions, zones]);

  const filteredStations = useMemo(() => {
    return processedStations.filter(stn => {
      if (filterStatus !== 'ALL' && stn.status !== filterStatus) return false;
      if (filterDivision !== 'ALL' && stn.division?.id.toString() !== filterDivision) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return stn.name.toLowerCase().includes(q) || 
               stn.code.toLowerCase().includes(q) ||
               stn.sources.some((ws: any) => ws.source_id_code.toLowerCase().includes(q));
      }
      return true;
    });
  }, [processedStations, filterStatus, filterDivision, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    let compliant = 0, overdue = 0, unfit = 0, persistent = 0, noData = 0, attention = 0;
    
    processedStations.forEach(s => {
      if (s.status === 'COMPLIANT') compliant++;
      else if (s.status === 'OVERDUE') overdue++;
      else if (s.status === 'UNFIT') unfit++;
      else if (s.status === 'PERSISTENT_FAILURE') persistent++;
      else if (s.status === 'ATTENTION') attention++;
      else if (s.status === 'NO_SOURCES') noData++;
    });

    return {
      total: processedStations.length,
      withSources: processedStations.length - noData,
      compliant, attention, overdue, unfit, persistent, noData
    };
  }, [processedStations]);

  // Initialize Map
  useEffect(() => {
    if (loading || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false // custom position if needed
      }).setView([20.5937, 78.9629], 5); // India center
      
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Map tile
      const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map);

      clusterGroupRef.current = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: function (cluster: any) {
          const markers = cluster.getAllChildMarkers();
          // Find worst status in cluster
          let worstPriority = 0;
          let worstColor = '#6b7280';
          
          markers.forEach((m: any) => {
            const priority = m.options.customPriority || 0;
            if (priority > worstPriority) {
              worstPriority = priority;
              worstColor = m.options.customColor || '#6b7280';
            }
          });

          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div style="background-color: ${worstColor}dd; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);">${count}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(36, 36)
          });
        }
      });
      
      map.addLayer(clusterGroupRef.current);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const cluster = clusterGroupRef.current;
    
    cluster.clearLayers();
    
    const markers: any[] = [];

    filteredStations.forEach(stn => {
      // Fake coordinates for demo if needed, but we use actuals if present
      const lat = stn.gps_lat;
      const lng = stn.gps_long;
      
      if (!lat || !lng) return;

      const priority = STATUS_CONFIG[stn.status]?.priority || 1;
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 20px; height: 20px; 
            background-color: ${stn.color}; 
            border: 3px solid white; 
            border-radius: 50%;
            box-shadow: 0 0 8px ${stn.color}88;
            ${priority >= 5 ? 'animation: pulse 1.5s infinite;' : ''}
          "></div>
        `,
        iconAnchor: [10, 10],
        tooltipAnchor: [10, 0]
      });

      const marker = L.marker([lat, lng], { 
        icon,
        customPriority: priority,
        customColor: stn.color
      } as any);

      // Tooltip Hover Card
      const tooltipHtml = `
        <div style="font-family: inherit; min-width: 200px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">${stn.division?.name || 'Unknown'} Division</div>
          <div style="font-size: 16px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${stn.name} (${stn.code})</div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 8px;">
            <span style="color: #64748b">Sources:</span>
            <span style="font-weight: 600; color: #0f172a">${stn.sources.length}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            <span style="color: #64748b">Status:</span>
            <span style="font-weight: 700; color: ${stn.color}">${STATUS_CONFIG[stn.status]?.label || 'Unknown'}</span>
          </div>
          ${stn.sources.length === 0 ? '<div style="font-size: 11px; color: #ef4444; margin-top: 6px; font-weight:600;">No registered water sources</div>' : ''}
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        className: 'station-tooltip',
        opacity: 1
      });

      marker.on('click', () => {
        setSelectedStation(stn);
        setSelectedSource(null);
        map.setView([lat, lng], 13, { animate: true });
      });

      markers.push(marker);
    });

    cluster.addLayers(markers);

    if (markers.length > 0 && searchQuery) {
       const group = L.featureGroup(markers);
       map.fitBounds(group.getBounds(), { padding: [50, 50] });
    } else if (markers.length > 0 && map.getZoom() < 6) {
       // Just general view
       const group = L.featureGroup(markers);
       map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 7 });
    }

  }, [filteredStations, loading, searchQuery]);


  if (loading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading GIS Command Centre...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-200 overflow-hidden font-sans">
      
      {/* ----------------- TOP HEADER ----------------- */}
      <header className="flex-none bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
            <MapPin className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">IR-IWQMS GIS Command Centre</h1>
            <p className="text-xs text-blue-400 font-medium">Real-time Water Quality Surveillance Network</p>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search Station, Code, or Source ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ----------------- KPI BAR ----------------- */}
      <div className="flex-none bg-slate-900 border-b border-slate-800 flex overflow-x-auto divide-x divide-slate-800 z-10">
        <div className="px-6 py-3 min-w-max flex flex-col items-start cursor-pointer hover:bg-slate-800/50" onClick={() => setFilterStatus('ALL')}>
          <span className="text-xs font-semibold text-slate-400 tracking-wider">TOTAL STATIONS</span>
          <span className="text-xl font-bold text-white">{kpis.total}</span>
        </div>
        <div className="px-6 py-3 min-w-max flex flex-col items-start cursor-pointer hover:bg-slate-800/50" onClick={() => setFilterStatus('COMPLIANT')}>
          <span className="text-xs font-semibold text-emerald-500 tracking-wider">COMPLIANT</span>
          <span className="text-xl font-bold text-white">{kpis.compliant}</span>
        </div>
        <div className="px-6 py-3 min-w-max flex flex-col items-start cursor-pointer hover:bg-slate-800/50" onClick={() => setFilterStatus('ATTENTION')}>
          <span className="text-xs font-semibold text-yellow-500 tracking-wider">ATTENTION DUE</span>
          <span className="text-xl font-bold text-white">{kpis.attention}</span>
        </div>
        <div className="px-6 py-3 min-w-max flex flex-col items-start cursor-pointer hover:bg-slate-800/50" onClick={() => setFilterStatus('OVERDUE')}>
          <span className="text-xs font-semibold text-orange-500 tracking-wider">OVERDUE</span>
          <span className="text-xl font-bold text-white">{kpis.overdue}</span>
        </div>
        <div className="px-6 py-3 min-w-max flex flex-col items-start cursor-pointer hover:bg-slate-800/50" onClick={() => setFilterStatus('UNFIT')}>
          <span className="text-xs font-semibold text-red-500 tracking-wider">UNFIT SOURCES</span>
          <span className="text-xl font-bold text-white">{kpis.unfit}</span>
        </div>
        <div className="px-6 py-3 min-w-max flex flex-col items-start cursor-pointer hover:bg-slate-800/50" onClick={() => setFilterStatus('PERSISTENT_FAILURE')}>
          <span className="text-xs font-semibold text-red-800 tracking-wider">PERSISTENT FAILURE</span>
          <span className="text-xl font-bold text-white">{kpis.persistent}</span>
        </div>
        <div className="px-6 py-3 min-w-max flex flex-col items-start cursor-pointer hover:bg-slate-800/50" onClick={() => setFilterStatus('NO_SOURCES')}>
          <span className="text-xs font-semibold text-slate-500 tracking-wider">NO SOURCES</span>
          <span className="text-xl font-bold text-slate-300">{kpis.noData}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ----------------- LEFT CONTROL PANEL ----------------- */}
        <aside className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col overflow-y-auto hidden md:flex z-10 shadow-xl">
          
          <div className="p-5 border-b border-slate-700">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Filter By Division
            </h2>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              value={filterDivision}
              onChange={e => setFilterDivision(e.target.value)}
            >
              <option value="ALL">All Divisions</option>
              {divisions.map(d => (
                <option key={d.id} value={d.id.toString()}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div className="p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Surveillance Status</h2>
            <div className="space-y-2">
              <button 
                onClick={() => setFilterStatus('ALL')}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${filterStatus === 'ALL' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
              >
                <span>All Statuses</span>
                <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs">{kpis.total}</span>
              </button>

              {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
                // Special mapping for kpis names
                let countVal = 0;
                if(statusKey === 'COMPLIANT') countVal = kpis.compliant;
                if(statusKey === 'ATTENTION') countVal = kpis.attention;
                if(statusKey === 'OVERDUE') countVal = kpis.overdue;
                if(statusKey === 'UNFIT') countVal = kpis.unfit;
                if(statusKey === 'PERSISTENT_FAILURE') countVal = kpis.persistent;
                if(statusKey === 'NO_SOURCES') countVal = kpis.noData;

                return (
                  <button 
                    key={statusKey}
                    onClick={() => setFilterStatus(statusKey)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors border border-transparent ${filterStatus === statusKey ? 'bg-slate-700 border-slate-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }}></div>
                      <span>{config.label}</span>
                    </div>
                    <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs">{countVal}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-auto p-5 border-t border-slate-700 bg-slate-800/50">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group relative cursor-help">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Data Status</h4>
                <p className="text-sm font-medium text-white mt-0.5">Demonstration Dataset</p>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Station Master records currently shown are demonstration data for system development and validation. They are not an official Indian Railways Station Master dataset.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ----------------- CENTRE MAP ----------------- */}
        <main className="flex-1 relative bg-slate-900">
          <div ref={mapRef} className="absolute inset-0 z-0" />
        </main>

        {/* ----------------- RIGHT DRAWER (STATION DETAIL) ----------------- */}
        <div className={`absolute top-0 right-0 h-full w-full sm:w-[400px] bg-slate-800 border-l border-slate-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-20 overflow-y-auto ${selectedStation ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedStation && (
            <div className="flex flex-col min-h-full">
              
              {/* Drawer Header */}
              <div className="sticky top-0 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 p-6 z-10">
                <button 
                  onClick={() => setSelectedStation(null)} 
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded bg-slate-700 text-slate-300 text-xs font-bold tracking-widest uppercase">
                    {selectedStation.division?.code || 'UNKNOWN'} DIV
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold tracking-widest uppercase"
                    style={{ backgroundColor: `${STATUS_CONFIG[selectedStation.status].color}20`, color: STATUS_CONFIG[selectedStation.status].color, border: `1px solid ${STATUS_CONFIG[selectedStation.status].color}40` }}
                  >
                    {STATUS_CONFIG[selectedStation.status].label}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-white tracking-tight leading-tight mb-1">{selectedStation.name}</h2>
                <div className="text-slate-400 text-sm flex items-center gap-2">
                  <span className="font-mono text-slate-300">{selectedStation.code}</span>
                  <span>•</span>
                  <span>{selectedStation.division?.name || 'Unknown Division'}</span>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6 flex-1">
                
                {/* Overview Section */}
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Overview</h3>
                  <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Category</span>
                      <span className="text-sm font-medium text-white">{selectedStation.category || 'Unclassified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">GPS Coordinates</span>
                      <span className="text-sm font-mono text-slate-300">{selectedStation.gps_lat?.toFixed(4)}, {selectedStation.gps_long?.toFixed(4)}</span>
                    </div>
                  </div>
                </section>

                {/* Data Provenance Section */}
                <section>
                  <h3 className="text-xs font-bold text-indigo-400/80 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5" /> Data Provenance
                  </h3>
                  <div className="bg-indigo-900/10 rounded-xl border border-indigo-500/20 p-4 space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-indigo-300/70">Source</span>
                      <span className="text-sm font-bold text-indigo-300">{selectedStation.source_provenance || 'DEMONSTRATION DATA'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-500/10">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-indigo-300/60 block mb-0.5">Imported</span>
                        <span className="text-xs font-mono text-slate-300">{selectedStation.imported_at ? new Date(selectedStation.imported_at).toISOString().split('T')[0] : 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-indigo-300/60 block mb-0.5">Verified</span>
                        <span className="text-xs font-mono text-slate-300">{selectedStation.last_verified_at ? new Date(selectedStation.last_verified_at).toISOString().split('T')[0] : 'Not verified'}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Water Sources Section */}
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                    <span>Water Sources ({selectedStation.sources.length})</span>
                    {selectedStation.sources.length === 0 && <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-[10px]">NO SOURCES</span>}
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedStation.sources.map((ws: any) => {
                      const statusColor = STATUS_CONFIG[WS_STATUS_MAP[ws.current_status] || 'COMPLIANT'].color;
                      const isSelected = selectedSource?.id === ws.id;
                      
                      return (
                        <div key={ws.id} className="rounded-xl border transition-all duration-200 overflow-hidden"
                             style={{ 
                               borderColor: isSelected ? statusColor : '#334155',
                               backgroundColor: isSelected ? `${statusColor}10` : '#0f172a'
                             }}>
                          
                          {/* Source Header (Clickable) */}
                          <button 
                            onClick={() => setSelectedSource(isSelected ? null : ws)}
                            className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-800/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}80` }}></div>
                              <div>
                                <h4 className="text-sm font-bold text-white leading-none mb-1">{ws.source_id_code}</h4>
                                <p className="text-xs text-slate-400">{ws.source_type || 'Unspecified Type'}</p>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                          </button>

                          {/* Source Drill-down Body */}
                          {isSelected && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-700/50 bg-slate-900/80">
                              
                              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-4">
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Status</span>
                                  <span className="text-xs font-bold" style={{ color: statusColor }}>{ws.current_status}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Capacity</span>
                                  <span className="text-xs text-slate-300">{ws.capacity || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Population</span>
                                  <span className="text-xs text-slate-300">{ws.population_served?.toLocaleString() || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Disinfection</span>
                                  <span className="text-xs text-slate-300">{ws.disinfection_method || '—'}</span>
                                </div>
                              </div>

                              <div className="space-y-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-700 pb-1">Surveillance Schedule</h5>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-400 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Bact. Sample</span>
                                  <span className="text-xs font-mono text-slate-300">
                                    {ws.last_bacteriological_sample_date ? new Date(ws.last_bacteriological_sample_date).toLocaleDateString() : 'No Data'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-400 flex items-center gap-1.5"><Droplets className="w-3 h-3"/> Residual Cl</span>
                                  <span className="text-xs font-mono font-bold text-white">
                                    {ws.residual_chlorine_last ? `${ws.residual_chlorine_last} ppm` : 'No Data'}
                                  </span>
                                </div>
                              </div>

                              {ws.total_failures > 0 && (
                                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                  <h5 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Failure History
                                  </h5>
                                  <div className="flex gap-4 mt-2">
                                    <div>
                                      <span className="text-2xl font-bold text-red-400 leading-none">{ws.consecutive_failures}</span>
                                      <span className="block text-[10px] text-red-400/70 mt-1">Consecutive</span>
                                    </div>
                                    <div>
                                      <span className="text-2xl font-bold text-slate-300 leading-none">{ws.total_failures}</span>
                                      <span className="block text-[10px] text-slate-500 mt-1">Total All Time</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    {selectedStation.sources.length === 0 && (
                      <div className="p-4 border border-dashed border-slate-700 rounded-xl text-center">
                        <p className="text-sm text-slate-500">This station has no registered water sources or sampling points in the database.</p>
                      </div>
                    )}
                  </div>
                </section>
                
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`
        /* Global CSS injection for leaflet tooltip customization */
        .leaflet-tooltip.station-tooltip {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          border-radius: 8px;
          padding: 12px;
          color: #0f172a;
        }
        .leaflet-tooltip-top:before {
          border-top-color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
}
