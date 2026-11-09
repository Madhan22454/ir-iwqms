import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, X, ChevronRight, AlertTriangle, 
  ShieldAlert, Droplets, Compass,
  RefreshCw, ArrowUpRight, AlertCircle, CheckCircle2, Clock,
  Maximize2, Minimize2, Train, Plus, Minus, RotateCcw
} from 'lucide-react';

import { API_URL as API } from '../config/api';
import { 
  FALLBACK_STATIONS, 
  FALLBACK_WATER_SOURCES, 
  FALLBACK_DIVISIONS, 
  FALLBACK_ZONES 
} from '../data/gisFallbackData';
import { INDIA_SVG_STATES, INDIA_SVG_VIEWBOX, geoToSvgCoords, IRI_ATLAS_STATE_COLORS } from '../data/indiaSvgData';
import { INDIAN_RAILWAY_TRUNK_CORRIDORS } from '../data/indiaRailwayCorridors';
import { ALL_INDIAN_RAIL_STATIONS, type NetworkStationNode } from '../data/allIndianRailStations';

// Water quality status styling configuration
const STATUS_CONFIG: Record<string, { color: string; label: string; priority: number; bg: string; border: string }> = {
  PERSISTENT_FAILURE: { 
    color: '#ef4444', 
    label: 'Persistent Failure', 
    priority: 6,
    bg: 'rgba(239, 68, 68, 0.15)',
    border: '#ef4444'
  },
  UNFIT: { 
    color: '#f43f5e', 
    label: 'Critical / Unfit', 
    priority: 5,
    bg: 'rgba(244, 63, 94, 0.15)',
    border: '#f43f5e'
  },
  OVERDUE: { 
    color: '#f97316', 
    label: 'Sampling Overdue', 
    priority: 4,
    bg: 'rgba(249, 115, 22, 0.15)',
    border: '#f97316'
  },
  ATTENTION: { 
    color: '#eab308', 
    label: 'Attention Needed', 
    priority: 3,
    bg: 'rgba(234, 179, 8, 0.15)',
    border: '#eab308'
  },
  COMPLIANT: { 
    color: '#10b981', 
    label: 'IS 10500 Compliant', 
    priority: 2,
    bg: 'rgba(16, 185, 129, 0.15)',
    border: '#10b981'
  },
  NO_SOURCES: { 
    color: '#94a3b8', 
    label: 'No Sources Monitored', 
    priority: 1,
    bg: 'rgba(148, 163, 184, 0.12)',
    border: '#94a3b8'
  },
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

function getStationDisplayName(fullName: string): string {
  if (fullName.includes('Shri Mata Vaishno Devi')) return 'Katra';
  if (fullName.includes('Hazrat Nizamuddin')) return 'Nizamuddin';
  if (fullName.includes('Chhatrapati Shivaji')) return 'CSMT';
  return fullName
    .replace(/\s+(Jn|Junction|Cantt|City|Central|Terminus|Trm)$/i, '')
    .trim();
}

export default function GISMap() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Data state
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [stations, setStations] = useState<any[]>([]);
  const [waterSources, setWaterSources] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  // UI state
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [hoveredStation, setHoveredStation] = useState<any>(null);
  const [hoveredRegularStation, setHoveredRegularStation] = useState<NetworkStationNode | null>(null);
  const [showAllNetworkStations, setShowAllNetworkStations] = useState(true);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDivision, setFilterDivision] = useState<string>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCorridors, setShowCorridors] = useState(true);
  const [mapTheme, setMapTheme] = useState<'iri' | 'dark'>('iri');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [markerSizeMode, setMarkerSizeMode] = useState<'adaptive' | 'compact' | 'minimal'>('adaptive');

  // Pan and Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Zoom-adaptive scale factor for monitored station icons so they never obstruct neighboring stations when zooming in
  const highlightIconScale = useMemo(() => {
    // zoom ranges from 0.7 to 4.0
    // At zoom 1.0 -> 1.0 (pan-India prominence)
    // At zoom 1.5 -> 0.78
    // At zoom 2.0 -> 0.62
    // At zoom 3.0 -> 0.48
    // At zoom 4.0 -> 0.38
    const baseInverse = Math.max(0.32, Math.min(1.0, 1 / Math.pow(zoom, 0.75)));
    const modeMultiplier = markerSizeMode === 'minimal' ? 0.62 : (markerSizeMode === 'compact' ? 0.78 : 1.0);
    return baseInverse * modeMultiplier;
  }, [zoom, markerSizeMode]);

  // Toggle true Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Fullscreen request failed", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error("Exit fullscreen failed", err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.3, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.3, 0.7));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(z => Math.min(Math.max(z * factor, 0.7), 4));
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Fetch or fallback data loading
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stnRes, wsRes, divRes, zoneRes] = await Promise.all([
        axios.get(`${API}/hierarchy/stations/`, { timeout: 4000 }),
        axios.get(`${API}/hierarchy/water-sources/`, { timeout: 4000 }),
        axios.get(`${API}/hierarchy/divisions/`, { timeout: 4000 }),
        axios.get(`${API}/hierarchy/zones/`, { timeout: 4000 }),
      ]);
      
      const loadedStations = stnRes.data || [];
      if (loadedStations.length > 0) {
        setStations(loadedStations);
        setWaterSources(wsRes.data || []);
        setDivisions(divRes.data || []);
        setZones(zoneRes.data || []);
        setUsingFallback(false);
      } else {
        setStations(FALLBACK_STATIONS);
        setWaterSources(FALLBACK_WATER_SOURCES);
        setDivisions(FALLBACK_DIVISIONS);
        setZones(FALLBACK_ZONES);
        setUsingFallback(true);
      }
    } catch (err) {
      console.warn("API offline. Loading Pan-India GIS demonstration network.", err);
      setStations(FALLBACK_STATIONS);
      setWaterSources(FALLBACK_WATER_SOURCES);
      setDivisions(FALLBACK_DIVISIONS);
      setZones(FALLBACK_ZONES);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Process and compute worst-status for each station
  const processedStations = useMemo(() => {
    if (!stations.length) return [];
    
    const divMap = new Map(divisions.map(d => [d.id, d]));
    const zoneMap = new Map(zones.map(z => [z.id, z]));
    
    return stations.map(stn => {
      const div = divMap.get(stn.division_id) || stn.division;
      const zone = div ? (zoneMap.get(div.zone_id) || div.zone || stn.zone) : stn.zone;
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

      // Calculate SVG projection coordinates from real lat/long
      const coords = (stn.gps_lat && stn.gps_long) ? geoToSvgCoords(stn.gps_lat, stn.gps_long) : { x: 0, y: 0 };

      return {
        ...stn,
        division: div,
        zone: zone,
        sources: stnSources,
        status: stnStatus,
        color: STATUS_CONFIG[stnStatus]?.color || '#94a3b8',
        svgX: coords.x,
        svgY: coords.y
      };
    });
  }, [stations, waterSources, divisions, zones]);

  // Set of station codes that have active telemetry records in IWQMS
  const monitoredCodes = useMemo(() => {
    return new Set(processedStations.map(s => s.code?.toUpperCase()));
  }, [processedStations]);

  // Regular railway network stations across India without telemetry records (rendered as small black dots with names)
  const regularNetworkStations = useMemo(() => {
    return ALL_INDIAN_RAIL_STATIONS
      .filter(s => !monitoredCodes.has(s.code.toUpperCase()))
      .map(s => {
        const { x, y } = geoToSvgCoords(s.lat, s.lng);
        return {
          ...s,
          svgX: x,
          svgY: y,
          hasRecords: false
        };
      });
  }, [monitoredCodes]);

  // Pre-calculate SVG points for Indian Railways Broad Gauge Trunk Corridors
  const projectedCorridors = useMemo(() => {
    return INDIAN_RAILWAY_TRUNK_CORRIDORS.map(corridor => {
      const points = corridor.coordinates.map(([lat, lng]) => {
        const { x, y } = geoToSvgCoords(lat, lng);
        return `${x},${y}`;
      }).join(' ');

      return {
        ...corridor,
        points
      };
    });
  }, []);

  // Filtered station list based on search, division, and status
  const filteredStations = useMemo(() => {
    return processedStations.filter(stn => {
      if (filterStatus !== 'ALL' && stn.status !== filterStatus) return false;
      if (filterDivision !== 'ALL' && stn.division?.id?.toString() !== filterDivision) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = stn.name?.toLowerCase().includes(q);
        const matchesCode = stn.code?.toLowerCase().includes(q);
        const matchesDiv = stn.division?.name?.toLowerCase().includes(q) || stn.division?.code?.toLowerCase().includes(q);
        const matchesSource = stn.sources?.some((ws: any) => ws.source_id_code?.toLowerCase().includes(q));
        return matchesName || matchesCode || matchesDiv || matchesSource;
      }
      return true;
    });
  }, [processedStations, filterStatus, filterDivision, searchQuery]);

  // Real-time surveillance KPI counts
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

  // Quick focus on highest severity station
  const handleFocusCritical = () => {
    const critical = filteredStations.find(s => s.status === 'PERSISTENT_FAILURE' || s.status === 'UNFIT');
    if (critical) {
      setSelectedStation(critical);
      setZoom(1.8);
      // Pan to center of SVG space (w=612, h=696)
      setPan({
        x: -(critical.svgX - 306) * 1.8,
        y: -(critical.svgY - 348) * 1.8
      });
    }
  };

  // Copy GPS coords
  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative flex flex-col w-full h-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* ----------------- TOP OPERATIONAL HEADER BAR ----------------- */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-20 px-4 py-2.5 shadow-xl shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Branding & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Train className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
                  <span>Pan-India Railway Water Surveillance GIS Command</span>
                </h1>
                {usingFallback && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold tracking-tight">
                    DEMO SIMULATION
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold">
                  SURVEY OF INDIA COMPLIANT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Exclusive Sovereign Indian Railways Infrastructure • Integrated Water Quality Monitoring System
              </p>
            </div>
          </div>

          {/* Middle: Live Filter & Search Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search station input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search station (e.g. MAS, NDLS, HWH)..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Division Selector */}
            <div className="relative">
              <select
                aria-label="Filter by Railway Division"
                className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-medium"
                value={filterDivision}
                onChange={e => setFilterDivision(e.target.value)}
              >
                <option value="ALL">All Divisions ({divisions.length})</option>
                {divisions.map(d => (
                  <option key={d.id} value={d.id.toString()}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Quick Tools */}
          <div className="flex items-center gap-1.5">
            {/* THEME SWITCHER: IRI ATLAS (PRIORITIZED) vs DARK COMMAND (BACKUP) */}
            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-700/80 shrink-0">
              <button
                onClick={() => setMapTheme('iri')}
                title="Switch to IndiaRailInfo (IRI) Atlas Style (Prioritized)"
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  mapTheme === 'iri'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🗺️ IRI Atlas</span>
                <span className="text-[9px] bg-emerald-700/60 px-1 py-0.2 rounded font-mono hidden md:inline">DEFAULT</span>
              </button>
              <button
                onClick={() => setMapTheme('dark')}
                title="Switch to Dark Ops Cyber Command (Backup)"
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                  mapTheme === 'dark'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⚡ Dark Ops</span>
              </button>
            </div>

            <button
              onClick={handleResetView}
              title="Reset to Pan-India view"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Reset View</span>
            </button>

            {kpis.unfit + kpis.persistent > 0 && (
              <button
                onClick={handleFocusCritical}
                title="Locate highest severity alert"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold text-rose-300 transition-all animate-pulse"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Critical Alert</span>
              </button>
            )}

            {/* RAILWAY TRUNK CORRIDORS TOGGLE BUTTON */}
            <button
              onClick={() => setShowCorridors(!showCorridors)}
              title={showCorridors ? "Hide Railway Trunk Lines" : "Show Railway Trunk Lines"}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${showCorridors ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 shadow-sm' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              <Train className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Railway Lines</span>
            </button>

            {/* ALL NETWORK STATIONS TOGGLE BUTTON */}
            <button
              onClick={() => setShowAllNetworkStations(!showAllNetworkStations)}
              title={showAllNetworkStations ? "Hide Regular Network Stations" : "Show Regular Network Stations"}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${showAllNetworkStations ? 'bg-teal-600/30 text-teal-200 border-teal-500/50 shadow-sm' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-900 border border-white shrink-0"></span>
              <span className="hidden xl:inline">All Rail Stations ({ALL_INDIAN_RAIL_STATIONS.length})</span>
            </button>

            {/* HIGHLIGHTED MARKER SIZE TOGGLE */}
            <button
              onClick={() => {
                setMarkerSizeMode(prev => prev === 'adaptive' ? 'compact' : (prev === 'compact' ? 'minimal' : 'adaptive'));
              }}
              title={`Record Station Icon Size: ${markerSizeMode.toUpperCase()} (Click to cycle Adaptive / Compact / Minimal)`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700 transition-all"
            >
              <span className={`w-2 h-2 rounded-full ${markerSizeMode === 'minimal' ? 'bg-emerald-400' : (markerSizeMode === 'compact' ? 'bg-amber-400' : 'bg-rose-500')} shadow-sm shrink-0`}></span>
              <span className="hidden md:inline text-slate-400">Markers:</span>
              <span className="text-amber-300 font-mono capitalize">{markerSizeMode}</span>
            </button>

            {/* FULLSCREEN TOGGLE BUTTON */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Map"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-xs font-bold text-blue-200 transition-all"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-blue-300" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-blue-300" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>

            <button
              onClick={() => loadData()}
              disabled={loading}
              title="Refresh telemetry"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

        </div>

        {/* Status KPI Metric Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 mt-1 border-t border-slate-800/60 no-scrollbar">
          <button 
            onClick={() => setFilterStatus('ALL')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${filterStatus === 'ALL' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'}`}
          >
            <span>ALL STATIONS</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded text-[10px] font-mono">{kpis.total}</span>
          </button>

          <button 
            onClick={() => setFilterStatus('COMPLIANT')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${filterStatus === 'COMPLIANT' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/70 border border-emerald-800/40'}`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>COMPLIANT</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded text-[10px] font-mono text-emerald-300">{kpis.compliant}</span>
          </button>

          <button 
            onClick={() => setFilterStatus('ATTENTION')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${filterStatus === 'ATTENTION' ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20' : 'bg-amber-950/40 text-amber-300 hover:bg-amber-950/70 border border-amber-800/40'}`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>ATTENTION</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded text-[10px] font-mono text-amber-200">{kpis.attention}</span>
          </button>

          <button 
            onClick={() => setFilterStatus('OVERDUE')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${filterStatus === 'OVERDUE' ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' : 'bg-orange-950/40 text-orange-400 hover:bg-orange-950/70 border border-orange-800/40'}`}
          >
            <AlertCircle className="w-3 h-3 text-orange-400" />
            <span>OVERDUE</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded text-[10px] font-mono text-orange-200">{kpis.overdue}</span>
          </button>

          <button 
            onClick={() => setFilterStatus('UNFIT')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${filterStatus === 'UNFIT' ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' : 'bg-rose-950/50 text-rose-300 hover:bg-rose-950/80 border border-rose-800/50'}`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>CRITICAL UNFIT</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded text-[10px] font-mono text-rose-200">{kpis.unfit}</span>
          </button>

          <button 
            onClick={() => setFilterStatus('PERSISTENT_FAILURE')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${filterStatus === 'PERSISTENT_FAILURE' ? 'bg-red-700 text-white shadow-md shadow-red-600/30' : 'bg-red-950/60 text-red-400 hover:bg-red-950/90 border border-red-800/60'}`}
          >
            <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
            <span>PERSISTENT FAILURE</span>
            <span className="bg-slate-900/60 px-1.5 py-0.2 rounded text-[10px] font-mono text-red-200">{kpis.persistent}</span>
          </button>
        </div>
      </header>

      {/* ----------------- MAIN SOVEREIGN INDIA VECTOR WORKSPACE ----------------- */}
      <div 
        className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center transition-colors duration-300"
        style={{
          background: mapTheme === 'iri' 
            ? 'radial-gradient(ellipse at center, #bce4f2 0%, #9ecfe0 60%, #83bdd2 100%)' 
            : '#020617'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Subtle Background Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: mapTheme === 'iri' 
              ? `radial-gradient(rgba(14, 116, 144, 0.3) 1px, transparent 1px)`
              : `radial-gradient(rgba(56, 189, 248, 0.25) 1px, transparent 1px)`,
            backgroundSize: '28px 28px'
          }}
        />

        {/* LOADING OVERLAY */}
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping"></div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Compass className="w-5 h-5 text-white animate-spin" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Initializing Pan-India Railway GIS Map</h3>
            <p className="text-xs text-slate-400 mt-1">Survey of India Sovereign Vector Baseline...</p>
          </div>
        )}

        {/* TOP LEFT BADGE */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-2 text-xs font-bold text-sky-200 w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>{mapTheme === 'iri' ? 'INDIARAILINFO (IRI) ATLAS STYLE • SURVEY OF INDIA COMPLIANT' : 'OFFICIAL MAP OF INDIA • SURVEY OF INDIA COMPLIANT'}</span>
          </div>
          {hoveredState && (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg px-2.5 py-1 shadow-xl text-xs font-semibold text-slate-300 w-fit animate-in fade-in duration-150">
              <span className="text-sky-400 mr-1.5">🇮🇳</span>
              <span>{hoveredState}</span>
            </div>
          )}
        </div>

        {/* ZOOM & PAN CONTROLS (BOTTOM RIGHT) */}
        <div className="absolute bottom-6 right-6 z-10 flex flex-col items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-xl shadow-2xl">
          <button 
            onClick={handleZoomIn} 
            title="Zoom In"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="text-[10px] font-mono text-slate-400 py-0.5">
            {Math.round(zoom * 100)}%
          </div>
          <button 
            onClick={handleZoomOut} 
            title="Zoom Out"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={handleResetView} 
            title="Reset Pan & Zoom"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors border-t border-slate-700/80 mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MAP LEGEND BADGE (BOTTOM LEFT) */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl hidden md:block max-w-sm pointer-events-auto">
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>{mapTheme === 'iri' ? 'IndiaRailInfo (IRI) Atlas Legend' : 'Water Quality Status'}</span>
            <span className="text-[9px] text-blue-400 font-mono">IS 10500:2012</span>
          </div>

          {mapTheme === 'iri' && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] pb-2 mb-2 border-b border-slate-700/80">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 rounded bg-red-600"></span>
                <span className="text-slate-200">Electrified Double</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 rounded bg-green-600"></span>
                <span className="text-slate-200">Broad Gauge Main</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 rounded bg-purple-600"></span>
                <span className="text-slate-200">Deccan / Central</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-1 rounded bg-blue-600"></span>
                <span className="text-slate-200">East Coast Main</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              <span className="text-slate-300">Compliant (IS 10500)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
              <span className="text-slate-300">Attention Needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
              <span className="text-slate-300">Testing Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
              <span className="text-rose-300 font-medium">Critical Unfit</span>
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT CREDITS BADGE */}
        <div className="absolute bottom-4 right-20 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xl hidden sm:flex items-center gap-2 text-[11px] text-slate-300 font-semibold tracking-wide pointer-events-none">
          <span className="text-blue-400">IR-IWQMS</span>
          <span className="text-slate-500">&bull;</span>
          <span>DONE BY NIRANJAN.R | ARUN KARTHICK .P | MADHAN KUMAR .S</span>
        </div>

        {/* ----------------- THE INTERACTIVE SOVEREIGN INDIA SVG MAP ----------------- */}
        <div 
          className="transition-transform duration-75 ease-out origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '612px',
            height: '696px'
          }}
        >
          <svg
            viewBox={INDIA_SVG_VIEWBOX}
            className="w-full h-full drop-shadow-[0_10px_35px_rgba(2,132,199,0.2)] overflow-visible"
          >
            <defs>
              {/* Radiant Glow Filter for Monitored Stations with Records */}
              <filter id="station-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. RENDER ALL 36 STATES AND UNION TERRITORIES */}
            <g id="india-states-layer">
              {INDIA_SVG_STATES.map(state => {
                const isHovered = hoveredState === state.name;
                const iriPastel = IRI_ATLAS_STATE_COLORS[state.id] || '#fde8d7';

                const fillColor = mapTheme === 'iri'
                  ? (isHovered ? '#ffffff' : iriPastel)
                  : (isHovered ? '#1e293b' : '#0f172a');

                const strokeColor = mapTheme === 'iri'
                  ? (isHovered ? '#1d4ed8' : '#57436e')
                  : (isHovered ? '#38bdf8' : '#334155');

                const strokeWidth = mapTheme === 'iri'
                  ? (isHovered ? 1.6 : 0.8)
                  : (isHovered ? 1.6 : 0.85);

                return (
                  <path
                    key={state.id}
                    id={state.id}
                    d={state.d}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    className="transition-colors duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredState(state.name)}
                    onMouseLeave={() => setHoveredState(null)}
                  >
                    <title>{state.name}</title>
                  </path>
                );
              })}
            </g>

            {/* 2. RENDER INDIAN RAILWAYS BROAD GAUGE TRUNK CORRIDORS */}
            {showCorridors && (
              <g id="india-railway-corridors-layer" className="pointer-events-none">
                {projectedCorridors.map(corridor => {
                  if (mapTheme === 'iri') {
                    // IndiaRailInfo Atlas Style Track Rendering
                    return (
                      <g key={corridor.id}>
                        {/* High-visibility white casing for contrast over pastel states */}
                        <polyline
                          points={corridor.points}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.4"
                          strokeOpacity="0.85"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Vibrant Railway Track */}
                        <polyline
                          points={corridor.points}
                          fill="none"
                          stroke={corridor.color}
                          strokeWidth="1.9"
                          strokeOpacity="0.95"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Center dashed line for Electrified Double Tracks */}
                        {corridor.trackType === 'ELECTRIFIED_DOUBLE' && (
                          <polyline
                            points={corridor.points}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="0.8"
                            strokeDasharray="3 4"
                            strokeOpacity="0.95"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </g>
                    );
                  }

                  // Dark Command Cyber corridor style (Backup)
                  return (
                    <g key={corridor.id}>
                      <polyline
                        points={corridor.points}
                        fill="none"
                        stroke={corridor.color || '#3b82f6'}
                        strokeWidth="3.2"
                        strokeOpacity="0.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={corridor.points}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.4"
                        strokeDasharray="4, 5"
                        strokeOpacity="0.95"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* 3. REGULAR RAILWAY NETWORK STATIONS (Small Black Dot with Name) */}
            {showAllNetworkStations && (
              <g id="regular-railway-stations-layer">
                {regularNetworkStations.map(stn => {
                  const isHovered = hoveredRegularStation?.code === stn.code;
                  const displayName = getStationDisplayName(stn.name);

                  return (
                    <g
                      key={stn.code}
                      className="cursor-pointer"
                      transform={`translate(${stn.svgX}, ${stn.svgY})`}
                      onMouseEnter={() => setHoveredRegularStation(stn)}
                      onMouseLeave={() => setHoveredRegularStation(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHoveredRegularStation(stn);
                      }}
                    >
                      {/* Small Black Dot */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isHovered ? 2.8 : 1.8}
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 1.0 : 0.6}
                      />

                      {/* Station Name in Cartographic Halo */}
                      <text
                        x={0}
                        y={-3.4}
                        textAnchor="middle"
                        fill={mapTheme === 'iri' ? '#1e293b' : '#cbd5e1'}
                        fontSize={zoom >= 2.5 ? "4.4" : "4.8"}
                        fontWeight="700"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        paintOrder="stroke"
                        stroke={mapTheme === 'iri' ? '#ffffff' : '#090e17'}
                        strokeWidth={zoom >= 2.5 ? "1.4" : "1.8"}
                        strokeLinejoin="round"
                        className="pointer-events-none select-none"
                        opacity={zoom >= 1.1 ? 1 : 0.85}
                      >
                        {displayName}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* 4. MONITORED STATIONS WITH TELEMETRY RECORDS (GLOWING WITH ZOOM-ADAPTIVE PROPORTIONS) */}
            <g id="monitored-stations-layer">
              {filteredStations.map(stn => {
                const isSelected = selectedStation?.id === stn.id;
                const isHovered = hoveredStation?.id === stn.id;
                const isUrgent = stn.status === 'UNFIT' || stn.status === 'PERSISTENT_FAILURE' || stn.status === 'OVERDUE';
                const statusColor = stn.color;

                const hoverFactor = isHovered ? 1.25 : 1.0;
                const activeScale = highlightIconScale * hoverFactor;

                return (
                  <g 
                    key={stn.id}
                    className="cursor-pointer"
                    transform={`translate(${stn.svgX}, ${stn.svgY})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStation(stn);
                    }}
                    onMouseEnter={() => setHoveredStation(stn)}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    <g 
                      transform={`scale(${activeScale})`}
                      style={{ transition: 'transform 0.12s ease-out' }}
                    >
                      {/* Radiant Glowing Aura */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isSelected ? 10.0 : 7.2}
                        fill={statusColor}
                        fillOpacity={mapTheme === 'iri' ? 0.32 : 0.42}
                        filter="url(#station-glow)"
                      />

                      {/* Concentric Steady Alert Halo Ring for Urgent Stations */}
                      {isUrgent && (
                        <circle
                          cx={0}
                          cy={0}
                          r={isSelected ? 8.2 : 6.0}
                          fill="none"
                          stroke={statusColor}
                          strokeWidth="1.1"
                          strokeOpacity="0.85"
                          strokeDasharray="2.2 2.2"
                        />
                      )}

                      {/* Prominent Station Junction Ring */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isSelected ? 4.8 : 3.4}
                        fill="#ffffff"
                        stroke={statusColor}
                        strokeWidth={isSelected ? 2.2 : 1.6}
                      />

                      {/* Glowing Inner Telemetry Dot */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isSelected ? 2.4 : 1.6}
                        fill={statusColor}
                      />

                      {/* Station Code Badge Pill */}
                      {markerSizeMode !== 'minimal' && (
                        <g transform="translate(0, -6.0)">
                          <rect
                            x="-10.5"
                            y="-4.8"
                            width="21"
                            height="8.2"
                            rx="2.2"
                            fill="#090e17"
                            stroke={statusColor}
                            strokeWidth="0.9"
                          />
                          <text
                            x="0"
                            y="1.1"
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="5.0"
                            fontWeight="800"
                            fontFamily="ui-monospace, monospace"
                          >
                            {stn.code}
                          </text>
                        </g>
                      )}
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* HOVER TOOLTIP CARD */}
        {hoveredStation && !selectedStation && (
          <div 
            className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl max-w-xs text-xs animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: Math.min(Math.max(hoveredStation.svgX * zoom + pan.x + (containerRef.current?.clientWidth || 0) / 2 - 306 * zoom + 15, 20), (containerRef.current?.clientWidth || 600) - 240),
              top: Math.min(Math.max(hoveredStation.svgY * zoom + pan.y + (containerRef.current?.clientHeight || 0) / 2 - 348 * zoom - 80, 20), (containerRef.current?.clientHeight || 600) - 140)
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-mono font-bold text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded">
                {hoveredStation.code}
              </span>
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border"
                style={{ 
                  color: STATUS_CONFIG[hoveredStation.status]?.color,
                  borderColor: `${STATUS_CONFIG[hoveredStation.status]?.color}40`,
                  backgroundColor: STATUS_CONFIG[hoveredStation.status]?.bg
                }}
              >
                {STATUS_CONFIG[hoveredStation.status]?.label}
              </span>
            </div>
            <div className="font-bold text-white text-sm leading-tight mb-1">
              {hoveredStation.name}
            </div>
            <div className="text-[11px] text-slate-400">
              {hoveredStation.division?.name || 'Railway Hub'} • {hoveredStation.zone?.name || 'Indian Railways'}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
              <span>Monitored Water Sources:</span>
              <span className="font-bold text-white">{hoveredStation.sources?.length || 0}</span>
            </div>
            <div className="text-[10px] text-blue-400 font-semibold mt-1">
              Click station to view detailed laboratory telemetry &rarr;
            </div>
          </div>
        )}

        {/* REGULAR STATION MINI TOOLTIP CARD */}
        {hoveredRegularStation && hoveredRegularStation.svgX != null && hoveredRegularStation.svgY != null && !hoveredStation && !selectedStation && (
          <div 
            className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 shadow-2xl text-xs animate-in fade-in duration-100"
            style={{
              left: Math.min(Math.max(hoveredRegularStation.svgX * zoom + pan.x + (containerRef.current?.clientWidth || 0) / 2 - 306 * zoom + 15, 20), (containerRef.current?.clientWidth || 600) - 220),
              top: Math.min(Math.max(hoveredRegularStation.svgY * zoom + pan.y + (containerRef.current?.clientHeight || 0) / 2 - 348 * zoom - 45, 20), (containerRef.current?.clientHeight || 600) - 80)
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="font-bold text-white text-xs">{hoveredRegularStation.name}</span>
              <span className="font-mono text-[10px] text-sky-400 font-bold bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                {hoveredRegularStation.code}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Indian Railways Network Station &bull; Standard Track Junction
            </div>
          </div>
        )}

        {/* ----------------- SLIDE-OVER STATION DETAIL DRAWER ----------------- */}
        <div 
          className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 overflow-y-auto flex flex-col ${selectedStation ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {selectedStation && (
            <>
              {/* Drawer Header */}
              <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-5 z-10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                      {selectedStation.code}
                    </span>
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                      style={{ 
                        backgroundColor: STATUS_CONFIG[selectedStation.status]?.bg || '#334155',
                        color: STATUS_CONFIG[selectedStation.status]?.color || '#ffffff',
                        borderColor: `${STATUS_CONFIG[selectedStation.status]?.color}50`
                      }}
                    >
                      {STATUS_CONFIG[selectedStation.status]?.label || 'Monitored'}
                    </span>
                  </div>
                  
                  <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
                    {selectedStation.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedStation.division?.name || 'Divisional Hub'} &bull; {selectedStation.zone?.name || 'Indian Railways'}
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedStation(null)} 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 space-y-5 flex-1">
                {/* Station Coordinates & Category */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/80 p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Station Category:</span>
                    <span className="font-bold text-slate-200">{selectedStation.category || 'NSG Category Standard'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">GPS Coordinates:</span>
                    <button 
                      onClick={() => handleCopyCoords(selectedStation.gps_lat, selectedStation.gps_long)}
                      className="font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                      title="Click to copy coordinates"
                    >
                      <span>{selectedStation.gps_lat?.toFixed(4)}, {selectedStation.gps_long?.toFixed(4)}</span>
                      <span className="text-[10px] text-slate-400">{copiedCoords ? '(Copied!)' : ''}</span>
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700/50">
                    <span className="text-slate-400">Data Provenance:</span>
                    <span className="text-emerald-400 font-mono font-medium">IR-IWQMS Live Telemetry</span>
                  </div>
                </div>

                {/* Monitored Water Sources Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <span>Monitored Water Sources ({selectedStation.sources?.length || 0})</span>
                    </h3>
                  </div>

                  {(!selectedStation.sources || selectedStation.sources.length === 0) ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center">
                      <Droplets className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No active water sources configured for this station.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedStation.sources.map((ws: any) => {
                        const statusKey = WS_STATUS_MAP[ws.current_status] || 'COMPLIANT';
                        const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.COMPLIANT;

                        return (
                          <div 
                            key={ws.id}
                            className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 transition-all cursor-pointer group"
                            onClick={() => navigate(`/stations/${selectedStation.id}`)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div>
                                <span className="font-mono text-xs font-bold text-blue-400 group-hover:text-blue-300">
                                  {ws.source_id_code}
                                </span>
                                <span className="text-xs text-slate-300 ml-2 font-medium">
                                  {ws.name || ws.source_type}
                                </span>
                              </div>
                              <span 
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0"
                                style={{ 
                                  backgroundColor: cfg.bg, 
                                  color: cfg.color, 
                                  border: `1px solid ${cfg.color}40` 
                                }}
                              >
                                {cfg.label}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 flex items-center justify-between mt-2">
                              <span>Location: {ws.location_description || 'Platform Supply'}</span>
                              <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                                Telemetry <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button
                    onClick={() => navigate(`/stations/${selectedStation.id}`)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>View Complete Station Profile & Laboratory Logs</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
