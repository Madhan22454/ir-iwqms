import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, X, ChevronRight, AlertTriangle, 
  ShieldAlert, Droplets, Compass,
  RefreshCw, ArrowUpRight, AlertCircle, CheckCircle2, Clock,
  Maximize2, Minimize2, Map as MapIcon, Train, FileText
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { extendLeaflet } from '@india-boundary-corrector/leaflet-layer';

try {
  extendLeaflet(L);
} catch (e) {
  console.warn("IndiaBoundaryCorrector init warning:", e);
}

import { API_URL as API } from '../config/api';
import { 
  FALLBACK_STATIONS, 
  FALLBACK_WATER_SOURCES, 
  FALLBACK_DIVISIONS, 
  FALLBACK_ZONES 
} from '../data/gisFallbackData';
import { INDIA_SOI_BOUNDARY } from '../data/indiaBoundaryGeojson';
import { INDIAN_RAILWAY_TRUNK_CORRIDORS } from '../data/indiaRailwayCorridors';

// Status styling configuration
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

export type BasemapKey = 'satellite' | 'railway' | 'osm' | 'humanitarian' | 'topo';

// Official Survey of India Compliant Basemap Providers (NO API KEY REQUIRED)
const BASEMAP_TILES: Record<string, { name: string; url: string; subdomains: string[]; maxZoom: number; attribution: string }> = {
  satellite: {
    name: 'Satellite Aerial (Compliant)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri World Imagery &mdash; Survey of India Sovereign Boundary'
  },
  railway: {
    name: 'Official Railway Network',
    url: '',
    subdomains: [],
    maxZoom: 18,
    attribution: 'Official Indian Railways Map &copy; Indian Railways / Maps of India'
  },
  osm: {
    name: 'Street Map (SOI Corrected)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &mdash; Corrected with Survey of India PMTiles'
  },
  humanitarian: {
    name: 'Humanitarian / Terrain',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors, Humanitarian Team'
  },
  topo: {
    name: 'Topographic Relief',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; World Topo Map'
  }
};

export default function GISMap() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const railwayOverlayRef = useRef<L.ImageOverlay | null>(null);
  const railwayCorridorsRef = useRef<L.LayerGroup | null>(null);
  const northernLabelsRef = useRef<L.LayerGroup | null>(null);

  // Data state
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
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
  const [activeBasemap, setActiveBasemap] = useState<BasemapKey>('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showOfficialMapModal, setShowOfficialMapModal] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Toggle true Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      }).catch(err => {
        console.error("Fullscreen request failed", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
      }).catch(err => {
        console.error("Exit fullscreen failed", err);
      });
    }
  };

  // Sync fullscreen change with Esc key or browser shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
        // Fallback to Pan-India demonstration network
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

      return {
        ...stn,
        division: div,
        zone: zone,
        sources: stnSources,
        status: stnStatus,
        color: STATUS_CONFIG[stnStatus]?.color || '#94a3b8'
      };
    });
  }, [stations, waterSources, divisions, zones]);

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

  // 1. Initialize Map ONCE on mount with robust cleanup
  useEffect(() => {
    if (!mapRef.current) return;

    // Pan-India center coordinates [Lat, Lng], Zoom 5
    const map = L.map(mapRef.current, {
      center: [21.5, 79.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    // Custom positioned Zoom Control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer (Esri Satellite Aerial - 100% Free of disputed lines)
    const initialConfig = BASEMAP_TILES.satellite;
    const initialTile = L.tileLayer(initialConfig.url, {
      subdomains: initialConfig.subdomains,
      maxZoom: initialConfig.maxZoom,
      attribution: initialConfig.attribution
    }).addTo(map);
    activeTileLayerRef.current = initialTile;

    // 1. Add Official Survey of India (SOI) Sovereign Boundary
    // Outer Glow / Highlight
    L.geoJSON(INDIA_SOI_BOUNDARY as any, {
      style: {
        color: '#0284c7',
        weight: 6,
        opacity: 0.45,
        fill: false,
      }
    }).addTo(map);

    // Official Sovereign Boundary Stroke
    L.geoJSON(INDIA_SOI_BOUNDARY as any, {
      style: {
        color: '#0369a1',
        weight: 3,
        opacity: 0.95,
        fillColor: '#0284c7',
        fillOpacity: 0.03,
      }
    }).addTo(map);

    // Official Survey of India Sovereign Northern Territory Badges
    const labelsGroup = L.layerGroup();
    const NORTHERN_SECTORS = [
      {
        coords: [35.6, 75.2] as [number, number],
        name: 'GILGIT-BALTISTAN SECTOR',
        sub: 'UT of Jammu & Kashmir • Sovereign Republic of India'
      },
      {
        coords: [34.8, 79.2] as [number, number],
        name: 'AKSAI CHIN SECTOR',
        sub: 'UT of Ladakh • Sovereign Republic of India'
      },
      {
        coords: [34.0, 74.8] as [number, number],
        name: 'JAMMU & KASHMIR (UT)',
        sub: 'Sovereign Republic of India'
      },
      {
        coords: [34.2, 77.6] as [number, number],
        name: 'LADAKH (UT)',
        sub: 'Sovereign Republic of India'
      }
    ];

    NORTHERN_SECTORS.forEach(sec => {
      const badge = L.marker(sec.coords, {
        interactive: false,
        icon: L.divIcon({
          className: 'soi-territory-badge',
          html: `
            <div style="background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(6px); border: 1px solid rgba(56, 189, 248, 0.6); border-radius: 6px; padding: 2px 7px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); text-align: center; white-space: nowrap; pointer-events: none;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                <span style="font-size: 10px;">🇮🇳</span>
                <span style="font-size: 9px; font-weight: 800; color: #ffffff; letter-spacing: 0.4px;">${sec.name}</span>
              </div>
              <div style="font-size: 7.5px; font-weight: 600; color: #7dd3fc; margin-top: 1px;">${sec.sub}</div>
            </div>
          `,
          iconSize: [150, 32],
          iconAnchor: [75, 16]
        })
      });
      labelsGroup.addLayer(badge);
    });
    labelsGroup.addTo(map);
    northernLabelsRef.current = labelsGroup;

    // 2. Add Indian Railways Broad Gauge Trunk Corridors
    const corridorLayer = L.layerGroup();
    INDIAN_RAILWAY_TRUNK_CORRIDORS.forEach(corridor => {
      const line = L.polyline(corridor.coordinates, {
        color: corridor.color || '#3b82f6',
        weight: 3.2,
        opacity: 0.75,
      });
      const dash = L.polyline(corridor.coordinates, {
        color: '#ffffff',
        weight: 1.6,
        dashArray: '6, 8',
        opacity: 0.9,
      });
      line.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <strong style="color: #60a5fa;">${corridor.name}</strong><br/>
          <span style="color: #94a3b8;">Indian Railways Broad Gauge Trunk Network</span>
        </div>
      `, { sticky: true, className: 'custom-leaflet-tooltip' });
      corridorLayer.addLayer(line);
      corridorLayer.addLayer(dash);
    });
    corridorLayer.addTo(map);
    railwayCorridorsRef.current = corridorLayer;

    // Marker cluster group setup
    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: function (c: any) {
        const childMarkers = c.getAllChildMarkers();
        let worstPriority = 0;
        let worstColor = '#64748b';

        childMarkers.forEach((m: any) => {
          const priority = m.options.customPriority || 0;
          if (priority > worstPriority) {
            worstPriority = priority;
            worstColor = m.options.customColor || '#64748b';
          }
        });

        const count = c.getChildCount();
        const isCriticalCluster = worstPriority >= 5;

        return L.divIcon({
          html: `
            <div class="custom-gis-cluster ${isCriticalCluster ? 'cluster-pulse' : ''}" style="background: ${worstColor};">
              <span class="cluster-count">${count}</span>
            </div>
          `,
          className: 'custom-cluster-wrapper',
          iconSize: L.point(40, 40)
        });
      }
    });

    map.addLayer(cluster);
    mapInstanceRef.current = map;
    clusterGroupRef.current = cluster;

    // Invalidate size after layout settles to guarantee complete tile rendering
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);

    // Auto resize listener
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
      clusterGroupRef.current = null;
      activeTileLayerRef.current = null;
      railwayOverlayRef.current = null;
      railwayCorridorsRef.current = null;
      northernLabelsRef.current = null;
    };
  }, []);

  // Sync Railway Corridors Visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = railwayCorridorsRef.current;
    if (!map || !layer) return;
    if (showCorridors) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [showCorridors]);

  // 2. Handle Basemap Tile Layer Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up active overlay or tile layer
    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
      activeTileLayerRef.current = null;
    }
    if (railwayOverlayRef.current) {
      map.removeLayer(railwayOverlayRef.current);
      railwayOverlayRef.current = null;
    }

    if (activeBasemap === 'railway') {
      // Official Indian Railways Sovereign Map Image Overlay
      // Calibrated bounding box across India: Lat 6.65 to 37.35, Lng 68.1 to 97.45
      const railwayBounds: L.LatLngBoundsExpression = [[6.65, 68.1], [37.35, 97.45]];
      const overlay = L.imageOverlay('/india-railway-map.jpg', railwayBounds, {
        opacity: 0.98,
        interactive: false,
        zIndex: 1
      }).addTo(map);
      overlay.bringToBack();
      railwayOverlayRef.current = overlay;
    } else {
      const config = BASEMAP_TILES[activeBasemap];
      let newTile: L.TileLayer;

      if (
        (activeBasemap === 'osm' || activeBasemap === 'humanitarian') &&
        typeof (L.tileLayer as any).indiaBoundaryCorrected === 'function'
      ) {
        // Use dynamically corrected tiles (erases de facto lines, paints SOI border)
        newTile = (L.tileLayer as any).indiaBoundaryCorrected(config.url, {
          subdomains: config.subdomains,
          maxZoom: config.maxZoom,
          attribution: config.attribution,
          pmtilesUrl: '/india_boundary_corrections.pmtiles',
          fallbackOnCorrectionFailure: true
        });
      } else {
        newTile = L.tileLayer(config.url, {
          subdomains: config.subdomains,
          maxZoom: config.maxZoom,
          attribution: config.attribution
        });
      }

      newTile.addTo(map);
      newTile.bringToBack();
      activeTileLayerRef.current = newTile;
    }
  }, [activeBasemap]);

  // 3. Update Markers when filteredStations change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const cluster = clusterGroupRef.current;
    if (!map || !cluster) return;

    cluster.clearLayers();
    const markers: L.Marker[] = [];

    filteredStations.forEach(stn => {
      const lat = stn.gps_lat;
      const lng = stn.gps_long;
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const priority = STATUS_CONFIG[stn.status]?.priority || 1;
      const statusColor = stn.color;
      const isUrgent = priority >= 4;

      const icon = L.divIcon({
        className: 'custom-station-pin',
        html: `
          <div class="pin-container">
            ${isUrgent ? `<div class="pin-radar" style="border-color: ${statusColor}; background: ${statusColor}22;"></div>` : ''}
            <div class="pin-core" style="background-color: ${statusColor}; box-shadow: 0 0 10px ${statusColor}99;">
              <span class="pin-dot"></span>
            </div>
            <div class="pin-label">${stn.code}</div>
          </div>
        `,
        iconSize: L.point(32, 32),
        iconAnchor: [16, 16],
        tooltipAnchor: [16, -10]
      });

      const marker = L.marker([lat, lng], {
        icon,
        customPriority: priority,
        customColor: statusColor
      } as any);

      // Glassmorphic rich tooltip
      const tooltipContent = `
        <div class="station-tooltip-card">
          <div class="tooltip-header">
            <span class="tooltip-badge" style="background: ${statusColor}25; color: ${statusColor}; border: 1px solid ${statusColor}60;">
              ${STATUS_CONFIG[stn.status]?.label || 'Standard'}
            </span>
            <span class="tooltip-div">${stn.division?.name || 'IR'}</span>
          </div>
          <div class="tooltip-title">${stn.name}</div>
          <div class="tooltip-meta">
            <div><span class="meta-label">CODE:</span> <strong class="meta-val">${stn.code}</strong></div>
            <div><span class="meta-label">SOURCES:</span> <strong class="meta-val">${stn.sources?.length || 0}</strong></div>
          </div>
          <div class="tooltip-action">Click marker to inspect water surveillance</div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        className: 'custom-leaflet-tooltip',
        offset: [0, -12],
        opacity: 1
      });

      marker.on('click', () => {
        setSelectedStation(stn);
        setSelectedSource(stn.sources?.[0] || null);
        map.setView([lat, lng], 12, { animate: true });
      });

      markers.push(marker);
    });

    cluster.addLayers(markers);

    // Frame the map to markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      if (searchQuery) {
        map.fitBounds(group.getBounds(), { padding: [60, 60], maxZoom: 12 });
      }
    }
  }, [filteredStations, searchQuery]);

  // Pan-India view reset
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([21.5, 79.5], 5, { animate: true });
    setSelectedStation(null);
  };

  // Jump to worst priority station
  const handleFocusCritical = () => {
    const critical = filteredStations.find(s => s.status === 'PERSISTENT_FAILURE' || s.status === 'UNFIT');
    if (critical && mapInstanceRef.current) {
      mapInstanceRef.current.setView([critical.gps_lat, critical.gps_long], 13, { animate: true });
      setSelectedStation(critical);
      setSelectedSource(critical.sources?.[0] || null);
    }
  };

  // Copy GPS Coordinates
  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* ----------------- TOP INTERACTIVE COMMAND HUD ----------------- */}
      <header className="flex-none bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 z-20 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Branding & Status Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <Compass className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-white tracking-wide uppercase">GIS Surveillance Command</h1>
                {usingFallback && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30" title="Backend API is offline or empty. Displaying Pan-India demonstration data.">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Live Network
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Pan-India Water Quality Telematics & Incident Map</p>
            </div>
          </div>

          {/* Middle: Integrated Quick Search & Division Filter */}
          <div className="flex items-center gap-2 flex-1 max-w-xl mx-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search station (e.g. MAS, New Delhi, Howrah, CSMT) or source..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Division Selector */}
            <div className="relative min-w-[150px]">
              <select 
                className="w-full bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-medium"
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
            <button
              onClick={handleResetView}
              title="Reset to Pan-India view"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Pan-India</span>
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

            {/* OFFICIAL RAILWAY CHART BUTTON */}
            <button
              onClick={() => setShowOfficialMapModal(true)}
              title="Inspect Official Indian Railways Sovereign Chart"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-xs font-bold text-emerald-200 transition-all shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Official IR Chart</span>
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

      {/* ----------------- MAIN MAP WORKSPACE ----------------- */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-950">
        
        {/* LEAFLET MAP ELEMENT (ALWAYS MOUNTED IN DOM) */}
        <div ref={mapRef} className="absolute inset-0 z-0 w-full h-full bg-slate-950" />

        {/* LOADING RADAR OVERLAY */}
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300">
            <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping"></div>
              <div className="absolute inset-2 rounded-full border-2 border-indigo-400/40 animate-pulse"></div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Compass className="w-6 h-6 text-white animate-spin" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Initializing Surveillance Network</h3>
            <p className="text-xs text-slate-400 mt-1">Connecting to Railway GIS telemetry feed...</p>
          </div>
        )}

        {/* FLOATING BASEMAP SELECTOR (100% FREE OPEN-SOURCE TILES) */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setActiveBasemap('satellite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeBasemap === 'satellite' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <Compass className="w-3 h-3 text-sky-300" />
              <span>Satellite (Clean)</span>
            </button>
            <button
              onClick={() => setActiveBasemap('railway')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeBasemap === 'railway' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <Train className="w-3 h-3 text-amber-300" />
              <span>Railway Chart</span>
            </button>
            <button
              onClick={() => setActiveBasemap('osm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeBasemap === 'osm' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              <MapIcon className="w-3 h-3" />
              <span>Street (SOI Corrected)</span>
            </button>
            <button
              onClick={() => setActiveBasemap('topo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${activeBasemap === 'topo' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Topographic
            </button>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md border border-sky-500/40 rounded-xl px-2.5 py-1 shadow-2xl flex items-center gap-1.5 text-[11px] font-bold text-sky-200 w-fit">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span>Survey of India Compliant Sovereign Boundary</span>
          </div>
        </div>

        {/* MAP LEGEND BADGE (BOTTOM LEFT) */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl hidden md:block max-w-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Water Quality Status</span>
            <span className="text-[9px] text-blue-400 font-mono">IS 10500:2012</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              <span className="text-slate-300">Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
              <span className="text-slate-300">Attention</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
              <span className="text-slate-300">Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse"></span>
              <span className="text-rose-300 font-medium">Critical Unfit</span>
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT CREDITS BADGE */}
        <div className="absolute bottom-4 right-14 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xl hidden sm:flex items-center gap-2 text-[11px] text-slate-300 font-semibold tracking-wide">
          <span className="text-blue-400">IR-IWQMS</span>
          <span className="text-slate-500">&bull;</span>
          <span>DONE BY NIRANJAN.R | ARUN KARTHICK .P | MADHAN KUMAR .S</span>
        </div>

        {/* ----------------- SLIDE-OVER STATION DETAIL DRAWER ----------------- */}
        <div 
          className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl transform transition-transform duration-300 ease-in-out z-20 overflow-y-auto flex flex-col ${selectedStation ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {selectedStation && (
            <>
              {/* Drawer Sticky Header */}
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

              {/* Drawer Scrollable Body */}
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
                    <span className="text-[11px] text-indigo-300 font-medium truncate max-w-[200px]" title={selectedStation.source_provenance}>
                      {selectedStation.source_provenance || 'Central Railway Registry'}
                    </span>
                  </div>
                </div>

                {/* Quick Action Dispatch Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/stations/${selectedStation.id}`)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                  >
                    <span>Station Profile</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => navigate(`/sampling?station_id=${selectedStation.id}`)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
                  >
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>Record Sample</span>
                  </button>
                </div>

                {/* Water Sources Telemetry List */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      <span>Registered Sources ({selectedStation.sources?.length || 0})</span>
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {selectedStation.sources?.map((ws: any) => {
                      const statusColor = STATUS_CONFIG[WS_STATUS_MAP[ws.current_status] || 'COMPLIANT'].color;
                      const isSelected = selectedSource?.id === ws.id;
                      const chlorine = ws.residual_chlorine_last ?? 0;
                      const chlorineCompliant = chlorine >= 0.2 && chlorine <= 0.5;

                      return (
                        <div 
                          key={ws.id}
                          className={`rounded-xl border transition-all duration-200 overflow-hidden ${isSelected ? 'border-blue-500/80 bg-slate-800/90 shadow-lg' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'}`}
                        >
                          <button
                            onClick={() => setSelectedSource(isSelected ? null : ws)}
                            className="w-full text-left p-3.5 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}90` }}></span>
                              <div>
                                <h4 className="text-xs font-bold text-white font-mono">{ws.source_id_code}</h4>
                                <p className="text-[11px] text-slate-400">{ws.source_type}</p>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-blue-400' : ''}`} />
                          </button>

                          {/* Expanded Telemetry Metrics */}
                          {isSelected && (
                            <div className="p-3.5 pt-0 border-t border-slate-800/80 bg-slate-900/80 space-y-3">
                              
                              {/* Residual Chlorine Gauge */}
                              <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
                                <div className="flex justify-between items-center text-xs mb-1">
                                  <span className="text-slate-400 font-medium flex items-center gap-1">
                                    <Droplets className="w-3 h-3 text-cyan-400" />
                                    Residual Chlorine:
                                  </span>
                                  <span className={`font-mono font-bold ${chlorineCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {chlorine > 0 ? `${chlorine} mg/L` : 'No reading recorded'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                                  <div 
                                    className={`h-full ${chlorineCompliant ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                                    style={{ width: `${Math.min(chlorine * 150, 100)}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                  <span>0.0 mg/L</span>
                                  <span className="text-emerald-500/80">IS 10500 Target: 0.2 - 0.5 mg/L</span>
                                  <span>1.0+ mg/L</span>
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                                  <span className="text-[10px] text-slate-400 block mb-0.5">Disinfection Method</span>
                                  <span className="font-semibold text-slate-200 text-[11px]">{ws.disinfection_method || 'Standard Chlorination'}</span>
                                </div>
                                <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                                  <span className="text-[10px] text-slate-400 block mb-0.5">Capacity</span>
                                  <span className="font-semibold text-slate-200 text-[11px]">{ws.capacity || 'Unspecified'}</span>
                                </div>
                                <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                                  <span className="text-[10px] text-slate-400 block mb-0.5">Last Bact. Sample</span>
                                  <span className="font-mono text-slate-200 text-[11px]">{ws.last_bacteriological_sample_date || 'Pending Test'}</span>
                                </div>
                                <div className="bg-slate-950/40 p-2 rounded border border-slate-800/60">
                                  <span className="text-[10px] text-slate-400 block mb-0.5">Failure History</span>
                                  <span className={`font-bold text-[11px] ${ws.total_failures > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {ws.total_failures || 0} incidents
                                  </span>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}

                    {(!selectedStation.sources || selectedStation.sources.length === 0) && (
                      <div className="p-4 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                        No water sources registered for this station yet.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </div>

      {/* ----------------- INJECTED LEAFLET STYLING OVERRIDES ----------------- */}
      <style>{`
        /* Custom Marker Cluster Style */
        .custom-cluster-wrapper {
          background: transparent !important;
          border: none !important;
        }
        .custom-gis-cluster {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 13px;
          border: 2.5px solid white;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          transition: transform 0.2s ease;
        }
        .custom-gis-cluster:hover {
          transform: scale(1.15);
        }
        .cluster-pulse {
          animation: cluster-radar 2s infinite;
        }
        @keyframes cluster-radar {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        /* Custom Station Pin Style */
        .custom-station-pin {
          background: transparent !important;
          border: none !important;
        }
        .pin-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        }
        .pin-radar {
          position: absolute;
          width: 34px;
          height: 34px;
          top: -8px;
          border-radius: 50%;
          border: 1.5px solid;
          animation: pin-pulse 1.8s ease-out infinite;
          pointer-events: none;
        }
        @keyframes pin-pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .pin-core {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2.5px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease;
        }
        .pin-container:hover .pin-core {
          transform: scale(1.3);
        }
        .pin-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: white;
        }
        .pin-label {
          font-size: 9.5px;
          font-weight: 800;
          color: #ffffff;
          background: rgba(15, 23, 42, 0.85);
          padding: 1px 4px;
          border-radius: 4px;
          margin-top: 2px;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        /* Glassmorphic Tooltip Card */
        .leaflet-tooltip.custom-leaflet-tooltip {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(148, 163, 184, 0.25) !important;
          border-radius: 12px !important;
          padding: 10px 12px !important;
          color: #ffffff !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
        }
        .leaflet-tooltip-top.custom-leaflet-tooltip:before {
          border-top-color: rgba(15, 23, 42, 0.95) !important;
        }
        .station-tooltip-card {
          min-width: 190px;
          font-family: inherit;
        }
        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .tooltip-badge {
          font-size: 9px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .tooltip-div {
          font-size: 9.5px;
          color: #94a3b8;
          font-weight: 600;
        }
        .tooltip-title {
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.25;
          margin-bottom: 6px;
        }
        .tooltip-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .meta-label {
          color: #64748b;
          font-size: 9.5px;
          font-weight: 700;
        }
        .meta-val {
          color: #f1f5f9;
        }
        .tooltip-action {
          font-size: 9.5px;
          color: #60a5fa;
          margin-top: 6px;
          font-weight: 600;
        }

        /* Utility Hide Scrollbar */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ----------------- OFFICIAL RAILWAY MAP FULL-SCREEN MODAL ----------------- */}
      {showOfficialMapModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Train className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Official Indian Railways Integrated Network Chart</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                      SOI COMPLIANT
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ministry of Railways Sovereign Demarcations • Complete Sovereign Boundary of India
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a 
                  href="/india-railway-map.jpg" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Open Full Resolution</span>
                </a>
                <button
                  onClick={() => setShowOfficialMapModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: High Resolution Map Preview */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950/80">
              <div className="relative max-w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-white">
                <img 
                  src="/india-railway-map.jpg" 
                  alt="Official Indian Railways Map" 
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
            </div>

            {/* Modal Footer Note */}
            <div className="p-3 bg-slate-900 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-emerald-400 font-bold">✓ Statutory Verification:</span>
                <span>Includes 100% of Jammu, Kashmir, Ladakh, Aksai Chin, and Arunachal Pradesh without foreign line-of-control alterations.</span>
              </div>
              <button 
                onClick={() => {
                  setShowOfficialMapModal(false);
                  setActiveBasemap('railway');
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
              >
                <span>Apply as Live Map Layer</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
