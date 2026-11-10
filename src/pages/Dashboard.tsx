import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Train,
  Droplets,
  Sparkles,
  FlaskConical,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Layers,
  Flame,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  DEMO_STATIONS,
  DEMO_ALERTS,
  DEMO_DASHBOARD_SUMMARY,
  type DemoStation,
} from '../data/mockDemoData';
import {
  INDIA_SVG_STATES,
  INDIA_SVG_VIEWBOX,
  geoToSvgCoords,
  IRI_ATLAS_STATE_COLORS,
} from '../data/indiaSvgData';
import { INDIAN_RAILWAY_TRUNK_CORRIDORS } from '../data/indiaRailwayCorridors';

// Count-up helper component for KPIs
function TabularCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 900;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayVal(value);
        clearInterval(timer);
      } else {
        setDisplayVal(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums font-display font-bold">
      {displayVal.toLocaleString()}
      {suffix}
    </span>
  );
}

const STATE_REGIONAL_HUB_MAP: Record<string, string> = {
  'Tamil Nadu': 'MAS',
  'Delhi': 'NDLS',
  'Maharashtra': 'CSMT',
  'West Bengal': 'HWH',
  'Karnataka': 'SBC',
  'Gujarat': 'ADI',
  'Uttar Pradesh': 'LKO',
  'Rajasthan': 'JP',
  'Telangana': 'SC',
  'Andhra Pradesh': 'BZA',
  'Kerala': 'TVC',
  'Punjab': 'ASR',
  'Bihar': 'PNBE',
  'Assam': 'GHY',
  'Odisha': 'BBS',
  'Madhya Pradesh': 'BPL',
  'Jammu and Kashmir': 'JAT',
  'Haryana': 'UMB',
  'Jharkhand': 'RNC',
  'Chhattisgarh': 'BSP',
  'Uttarakhand': 'DDN',
};

export function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeMapFilter, setActiveMapFilter] = useState<'ALL' | 'UNFIT' | 'OVERDUE'>('ALL');
  
  // Default to central national hub (New Delhi) instead of Baramulla
  const [selectedStation, setSelectedStation] = useState<DemoStation | null>(
    () => DEMO_STATIONS.find((s) => s.code === 'NDLS') || DEMO_STATIONS.find((s) => s.code === 'MAS') || DEMO_STATIONS[0]
  );
  const [hoveredStation, setHoveredStation] = useState<DemoStation | null>(null);
  const [actionDoneMap, setActionDoneMap] = useState<Record<string, boolean>>({});

  const svgRef = useRef<SVGSVGElement>(null);

  // Summary statistics from realistic seeded dataset
  const summary = DEMO_DASHBOARD_SUMMARY;
  const totalStations = summary.infrastructure.stations;
  const compliantCount = summary.water_quality.compliant;
  const compliancePct = Math.round((compliantCount / totalStations) * 100);

  // Filter stations shown on the map
  const mapStations = useMemo(() => {
    if (activeMapFilter === 'UNFIT') {
      return DEMO_STATIONS.filter((s) => s.status === 'UNFIT' || s.status === 'PERSISTENT');
    }
    if (activeMapFilter === 'OVERDUE') {
      return DEMO_STATIONS.filter((s) => s.status === 'OVERDUE' || s.status === 'DUE');
    }
    return DEMO_STATIONS;
  }, [activeMapFilter]);

  // Pre-calculate SVG coordinates for ultra-fast cursor proximity lookup
  const stationPoints = useMemo(() => {
    return mapStations.map((stn) => {
      const pt = geoToSvgCoords(stn.lat, stn.lng);
      return { stn, x: pt.x, y: pt.y };
    });
  }, [mapStations]);

  // Dynamic proximity hover tracker across the entire map canvas
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const cursorSvg = pt.matrixTransform(ctm.inverse());

    let nearest: DemoStation | null = null;
    let minDist = 32; // proximity sensitivity radius
    for (const item of stationPoints) {
      const dist = Math.hypot(item.x - cursorSvg.x, item.y - cursorSvg.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = item.stn;
      }
    }
    if (nearest) {
      setHoveredStation(nearest);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastRefreshed(new Date());
      setLoading(false);
    }, 400);
  };

  const handleTriggerAction = (id: string) => {
    setActionDoneMap((prev) => ({ ...prev, [id]: true }));
  };

  // Inspect station either by hovering or clicking
  const activeStationToDisplay = hoveredStation || selectedStation || DEMO_STATIONS[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[2100px] mx-auto transition-colors">
      
      {/* -------------------------------------------------------------
          1. LIVE ALERT TICKER STRIP (Continuous 60fps marquee)
          ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] py-2.5 px-4 shadow-xs flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0 z-10 bg-[var(--bg-surface)] pr-3 border-r border-[var(--border-base)]">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
          </span>
          <span className="font-display font-bold text-xs uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 fill-current" />
            Live Surveillance Feed
          </span>
        </div>

        <div className="overflow-hidden whitespace-nowrap flex-1 flex items-center">
          <div className="animate-ticker flex items-center gap-8">
            {DEMO_ALERTS.map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate(`/alerts/${alert.id}`)}
                className="inline-flex items-center gap-2 text-xs cursor-pointer hover:underline text-[var(--text-main)]"
              >
                <span
                  className={`status-chip text-[10px] ${
                    alert.severity === 'CRITICAL'
                      ? 'status-chip-unfit'
                      : alert.severity === 'MAJOR'
                      ? 'status-chip-overdue'
                      : 'status-chip-attention'
                  }`}
                >
                  {alert.severity}
                </span>
                <span className="font-semibold">{alert.station_name} ({alert.station_code}):</span>
                <span className="text-[var(--text-muted)]">{alert.parameter_name} ({alert.sample_value})</span>
                <span className="text-[10px] text-orange-500 font-mono font-bold">[{alert.hours_remaining}h to {alert.escalated_to}]</span>
                <span className="text-[var(--text-faint)] text-xs">·</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 z-10 pl-2">
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs font-semibold text-[var(--ir-indigo)] dark:text-[var(--ir-teal)] hover:underline flex items-center gap-0.5"
          >
            All Alerts ({summary.operations.open_alerts}) <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. BENTO ROW 1: LARGE HERO GIS MAP (8 COLS) + STATUS RING (4 COLS)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* HERO TILE: PAN-INDIA RAILWAY WATER SURVEILLANCE MAP */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="col-span-12 xl:col-span-8 ir-tile p-5 flex flex-col justify-between"
        >
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-base)]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                <h2 className="font-display font-bold text-base sm:text-lg text-[var(--text-main)]">
                  Pan-India Water Surveillance Map
                </h2>
                <span className="status-chip status-chip-compliant text-[10px]">
                  Survey of India Demarcation
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Real-time geographic distribution of station water sampling points & trunk railway corridors
              </p>
            </div>

            {/* Filter Pills & GIS Link */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-[var(--border-base)] p-0.5 bg-[var(--bg-subtle)]">
                <button
                  onClick={() => setActiveMapFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeMapFilter === 'ALL'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-2xs font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  All ({DEMO_STATIONS.length})
                </button>
                <button
                  onClick={() => setActiveMapFilter('UNFIT')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeMapFilter === 'UNFIT'
                      ? 'bg-red-500 text-white font-semibold'
                      : 'text-[var(--text-muted)] hover:text-red-500'
                  }`}
                >
                  Unfit / Critical ({summary.water_quality.unfit + summary.water_quality.persistent_failure})
                </button>
                <button
                  onClick={() => setActiveMapFilter('OVERDUE')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeMapFilter === 'OVERDUE'
                      ? 'bg-amber-500 text-white font-semibold'
                      : 'text-[var(--text-muted)] hover:text-amber-500'
                  }`}
                >
                  Due / Overdue ({summary.water_quality.overdue + summary.water_quality.due})
                </button>
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-main)] transition-colors"
                title="Refresh Live Telemetry"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>

              <Link
                to="/gis"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-main)] transition-colors"
              >
                <span>Full Atlas</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Map Canvas with SVG Survey of India Boundaries & Railway Tracks */}
          <div className="relative w-full h-[400px] sm:h-[460px] my-4 rounded-xl overflow-hidden border border-[var(--border-base)] bg-[var(--bg-subtle)]/70 flex items-center justify-center">
            
            <svg
              ref={svgRef}
              viewBox={INDIA_SVG_VIEWBOX}
              onMouseMove={handleSvgMouseMove}
              className="w-full h-full max-h-[440px] drop-shadow-md select-none cursor-crosshair"
            >
              <defs>
                <filter id="station-glow-unfit" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 36 Survey of India States in Soft Tones */}
              <g id="dashboard-states">
                {INDIA_SVG_STATES.map((state) => (
                  <path
                    key={state.id}
                    d={state.d}
                    fill={isDark ? '#0c1527' : IRI_ATLAS_STATE_COLORS[state.id] || '#e8f0fe'}
                    stroke={isDark ? '#1e2e4f' : '#cbd5e1'}
                    strokeWidth="0.75"
                    strokeLinejoin="round"
                    onMouseEnter={() => {
                      const hubCode = STATE_REGIONAL_HUB_MAP[state.name];
                      if (hubCode) {
                        const hubStn = DEMO_STATIONS.find(s => s.code === hubCode);
                        if (hubStn) {
                          setHoveredStation(hubStn);
                          setSelectedStation(hubStn);
                        }
                      }
                    }}
                    className="transition-colors duration-200 hover:opacity-90 cursor-pointer"
                  >
                    <title>{state.name}</title>
                  </path>
                ))}
              </g>

              {/* Indian Railways Trunk Corridors */}
              <g id="dashboard-corridors">
                {INDIAN_RAILWAY_TRUNK_CORRIDORS.map((corridor) => {
                  const points = corridor.coordinates
                    .map(([lat, lng]) => {
                      const { x, y } = geoToSvgCoords(lat, lng);
                      return `${x.toFixed(2)},${y.toFixed(2)}`;
                    })
                    .join(' ');

                  return (
                    <g key={corridor.id}>
                      <polyline
                        points={points}
                        fill="none"
                        stroke={isDark ? '#080f1e' : '#ffffff'}
                        strokeWidth="2.5"
                        strokeOpacity="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={points}
                        fill="none"
                        stroke={corridor.color}
                        strokeWidth="1.4"
                        strokeOpacity="0.85"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}
              </g>

              {/* Station Status Markers */}
              <g id="dashboard-station-pins">
                {mapStations.map((stn) => {
                  const { x, y } = geoToSvgCoords(stn.lat, stn.lng);
                  const isUnfit = stn.status === 'UNFIT' || stn.status === 'PERSISTENT';
                  const isAttention = stn.status === 'OVERDUE' || stn.status === 'DUE';
                  const isSelected = activeStationToDisplay?.code === stn.code;

                  const pinColor = isUnfit
                    ? '#E5384B'
                    : isAttention
                    ? '#FFB020'
                    : '#1FB86B';

                  return (
                    <g
                      key={stn.code}
                      onClick={() => {
                        setSelectedStation(stn);
                        setHoveredStation(stn);
                      }}
                      onMouseEnter={() => {
                        setHoveredStation(stn);
                        setSelectedStation(stn);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Generous 32px invisible hit target for effortless cursor hover */}
                      <circle
                        cx={x}
                        cy={y}
                        r="16"
                        fill="transparent"
                        className="cursor-pointer"
                      />

                      {/* SVG-native pulsing ring for critical stations (strictly anchored to cx, cy, NO transform drift) */}
                      {isUnfit && (
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill="none"
                          stroke="#E5384B"
                          strokeWidth="1.5"
                          pointerEvents="none"
                        >
                          <animate attributeName="r" values="4;13;4" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.85;0.12;0.85" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Selected halo */}
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r="9"
                          fill="none"
                          stroke={isDark ? '#38bdf8' : '#1e3a8a'}
                          strokeWidth="2.5"
                          opacity="0.95"
                          pointerEvents="none"
                        />
                      )}

                      {/* Outer border & Core Pin */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? '6' : isUnfit ? '5' : '4'}
                        fill={pinColor}
                        stroke={isDark ? '#0a1020' : '#ffffff'}
                        strokeWidth="1.5"
                        filter={isUnfit ? 'url(#station-glow-unfit)' : undefined}
                        pointerEvents="none"
                      />
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Floating Live Station Hover / Inspect Card */}
            {activeStationToDisplay && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={activeStationToDisplay.code}
                className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm p-3.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)]/95 backdrop-blur-md shadow-xl text-xs z-20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                      <Train className="h-4 w-4 text-[var(--ir-indigo)] dark:text-[var(--ir-teal)]" />
                      <span>{activeStationToDisplay.name}</span>
                      <span className="font-mono text-xs text-[var(--text-faint)]">
                        ({activeStationToDisplay.code})
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {activeStationToDisplay.division_code} Division · {activeStationToDisplay.zone_code} · {activeStationToDisplay.category}
                    </div>
                  </div>
                  <span
                    className={`status-chip text-[10px] ${
                      activeStationToDisplay.status === 'COMPLIANT'
                        ? 'status-chip-compliant'
                        : activeStationToDisplay.status === 'DUE'
                        ? 'status-chip-attention'
                        : activeStationToDisplay.status === 'OVERDUE'
                        ? 'status-chip-overdue'
                        : 'status-chip-unfit'
                    }`}
                  >
                    {activeStationToDisplay.status}
                  </span>
                </div>

                {/* Telemetry Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-[var(--border-base)] text-[11px]">
                  <div>
                    <span className="text-[10px] text-[var(--text-faint)] block uppercase">Free Chlorine</span>
                    <span className={`font-mono font-bold ${activeStationToDisplay.chlorine_ppm < 0.2 ? 'text-red-500 font-extrabold' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {activeStationToDisplay.chlorine_ppm} ppm
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-faint)] block uppercase">Coliform</span>
                    <span className={`font-mono font-bold ${activeStationToDisplay.coliform_cfu > 0 ? 'text-red-500 font-extrabold' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {activeStationToDisplay.coliform_cfu} CFU
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-faint)] block uppercase">Water Sources</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">
                      {activeStationToDisplay.water_sources_count} active
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Map Footer Microcopy */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-base)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Compliant ({summary.water_quality.compliant})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Due / Overdue ({summary.water_quality.due + summary.water_quality.overdue})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" /> Unfit ({summary.water_quality.unfit + summary.water_quality.persistent_failure})
              </span>
            </div>
            <span className="font-mono text-[11px] text-[var(--text-faint)]">
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </motion.div>

        {/* STATUS RING TILE: OVERALL COMPLIANCE PERCENTAGE & BREAKDOWN */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="col-span-12 xl:col-span-4 ir-tile p-5 flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-base)]">
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-[var(--text-main)]">
                Water Safety Index
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                IS 10500:2012 Drinking Water Standard
              </p>
            </div>
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          </div>

          {/* Big Status Circular Gauge / Ring */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-[var(--border-base)]"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-emerald-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - compliancePct / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Center Content */}
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-4xl font-display font-extrabold text-[var(--text-main)] tracking-tight">
                  <TabularCounter value={compliancePct} suffix="%" />
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">
                  Potable & Safe
                </span>
              </div>
            </div>

            {/* Plain-Language Microcopy */}
            <div className="text-center mt-3 max-w-xs">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                {compliantCount} stations are safe to drink from today
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {summary.water_quality.unfit} critical and {summary.water_quality.persistent_failure} persistent advisories active across the network.
              </p>
            </div>
          </div>

          {/* Progress Breakdown Bars */}
          <div className="space-y-2.5 pt-3 border-t border-[var(--border-base)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Safe & Tested
              </span>
              <span className="font-mono font-bold text-[var(--text-main)]">
                {compliantCount} ({compliancePct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden flex">
              <div
                style={{ width: `${(compliantCount / totalStations) * 100}%` }}
                className="bg-emerald-500 h-full"
              />
              <div
                style={{ width: `${(summary.water_quality.due / totalStations) * 100}%` }}
                className="bg-amber-400 h-full"
              />
              <div
                style={{ width: `${(summary.water_quality.overdue / totalStations) * 100}%` }}
                className="bg-orange-500 h-full"
              />
              <div
                style={{ width: `${((summary.water_quality.unfit + summary.water_quality.persistent_failure) / totalStations) * 100}%` }}
                className="bg-red-500 h-full"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)] pt-1">
              <span>{summary.water_quality.due} Due in 48h</span>
              <span>{summary.water_quality.overdue} Overdue</span>
              <span className="text-red-500 font-semibold">{summary.water_quality.unfit} Unfit</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* -------------------------------------------------------------
          3. BENTO ROW 2: ASYMMETRIC COMPACT KPI TILES WITH SPARKLINES
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-12 gap-5">
        
        {/* KPI Tile 1: Zones Active */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          onClick={() => navigate('/master-data')}
          className="col-span-6 md:col-span-3 ir-tile p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold">Railway Zones</span>
            <Layers className="h-4 w-4 text-[var(--ir-indigo)] dark:text-[var(--ir-teal)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
            <TabularCounter value={summary.infrastructure.zones} />
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between">
            <span>100% Zonal coverage</span>
            <span className="text-[10px] text-[var(--text-faint)]">16 HQ Hubs</span>
          </div>
        </motion.div>

        {/* KPI Tile 2: Monitored Stations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          onClick={() => navigate('/stations')}
          className="col-span-6 md:col-span-3 ir-tile p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold">Monitored Stations</span>
            <Train className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
            <TabularCounter value={summary.infrastructure.stations} />
          </div>
          <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center justify-between">
            <span>68 Operating divisions</span>
            <span className="text-[10px] text-[var(--text-faint)]">NSG1-NSG6</span>
          </div>
        </motion.div>

        {/* KPI Tile 3: Registered Water Sources */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          onClick={() => navigate('/water-sources')}
          className="col-span-6 md:col-span-3 ir-tile p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold">Water Sources</span>
            <Droplets className="h-4 w-4 text-[var(--ir-teal)]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--text-main)]">
            <TabularCounter value={summary.infrastructure.water_sources} />
          </div>
          <div className="mt-1 text-xs text-[var(--ir-teal)] font-medium flex items-center justify-between">
            <span>Borewells & RO plants</span>
            <span className="text-[10px] text-[var(--text-faint)]">Avg 3.6/station</span>
          </div>
        </motion.div>

        {/* KPI Tile 4: Disinfections Scheduled */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.25 }}
          onClick={() => navigate('/disinfection')}
          className="col-span-6 md:col-span-3 ir-tile p-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold">Disinfections Due</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            <TabularCounter value={summary.operations.disinfection_due} />
          </div>
          <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center justify-between">
            <span>Scheduled for today</span>
            <span className="text-[10px] text-[var(--text-faint)]">19 Tanks</span>
          </div>
        </motion.div>

      </div>

      {/* -------------------------------------------------------------
          4. BENTO ROW 3: "NEEDS ACTION TODAY" (7 COLS) + "LAB AUDIT" (5 COLS)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* NEEDS ACTION TODAY: URGENT OPERATIONAL DISPATCH QUEUE */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="col-span-12 lg:col-span-7 ir-tile p-5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-base)]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <h3 className="font-display font-bold text-base text-[var(--text-main)]">
                Needs Action Today
              </h3>
              <span className="status-chip status-chip-unfit text-[10px]">
                {DEMO_ALERTS.length} Escalations Pending
              </span>
            </div>
            <button
              onClick={() => navigate('/corrective-actions')}
              className="text-xs font-semibold text-[var(--ir-indigo)] dark:text-[var(--ir-teal)] hover:underline flex items-center gap-1"
            >
              Action Desk <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[var(--border-base)] mt-2">
            {DEMO_ALERTS.slice(0, 4).map((alert) => {
              const isDone = actionDoneMap[alert.alert_id];

              return (
                <div key={alert.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`status-chip text-[10px] ${
                          alert.severity === 'CRITICAL'
                            ? 'status-chip-unfit'
                            : 'status-chip-overdue'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[var(--text-faint)]">
                        {alert.alert_id}
                      </span>
                      <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 font-mono">
                        ⏱ {alert.hours_remaining}h left
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[var(--text-main)] truncate">
                      {alert.station_name} ({alert.station_code}) · {alert.source_type}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Issue: <strong className="text-red-600 dark:text-red-400">{alert.parameter_name} ({alert.sample_value})</strong> · Limit: {alert.permissible_limit}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleTriggerAction(alert.alert_id)}
                      disabled={isDone}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isDone
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-[var(--ir-indigo)] hover:bg-indigo-900 text-white shadow-2xs'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Dispatched</span>
                        </>
                      ) : (
                        <span>Isolate & Treat</span>
                      )}
                    </button>

                    <button
                      onClick={() => navigate(`/alerts/${alert.id}`)}
                      className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                      title="Inspect Details"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[var(--border-base)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Automated alert escalation timer governed by Railway Board Manual</span>
            <Link to="/escalations" className="text-[var(--ir-indigo)] dark:text-[var(--ir-teal)] font-semibold hover:underline">
              View 3-Level Ladder →
            </Link>
          </div>
        </motion.div>

        {/* VERIFIED LAB REPORTS & SAMPLING AUDIT FEED */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="col-span-12 lg:col-span-5 ir-tile p-5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-base)]">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[var(--ir-indigo)] dark:text-[var(--ir-teal)]" />
              <h3 className="font-display font-bold text-base text-[var(--text-main)]">
                Recent Lab Validations
              </h3>
            </div>
            <Link
              to="/lab/result-entry"
              className="text-xs font-semibold text-[var(--ir-indigo)] dark:text-[var(--ir-teal)] hover:underline flex items-center gap-1"
            >
              Enter Results <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3 my-2">
            {[
              {
                id: 'LAB-SR-2026-1142',
                station: 'Puratchi Thalaivar Dr. M.G.R. Central (MAS)',
                result: 'FIT',
                cl: '0.45 ppm',
                coliform: '0 CFU',
                date: 'Today, 09:30 AM',
              },
              {
                id: 'LAB-NR-2026-0985',
                station: 'New Delhi (NDLS)',
                result: 'FIT',
                cl: '0.52 ppm',
                coliform: '0 CFU',
                date: 'Today, 08:15 AM',
              },
              {
                id: 'LAB-ER-2026-0411',
                station: 'Howrah Jn (HWH)',
                result: 'UNFIT',
                cl: '0.04 ppm',
                coliform: '18 CFU',
                date: 'Yesterday, 05:40 PM',
              },
              {
                id: 'LAB-CR-2026-0819',
                station: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)',
                result: 'FIT',
                cl: '0.38 ppm',
                coliform: '0 CFU',
                date: 'Yesterday, 02:10 PM',
              },
            ].map((lab) => (
              <div
                key={lab.id}
                className="p-3 rounded-lg border border-[var(--border-base)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[var(--text-faint)]">
                      {lab.id}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {lab.date}
                    </span>
                  </div>
                  <div className="font-semibold text-[var(--text-main)] truncate mt-0.5">
                    {lab.station}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 flex gap-3">
                    <span>Cl: <strong className="text-[var(--text-main)] font-mono">{lab.cl}</strong></span>
                    <span>Coliform: <strong className="text-[var(--text-main)] font-mono">{lab.coliform}</strong></span>
                  </div>
                </div>

                <span
                  className={`status-chip text-[10px] flex-shrink-0 ${
                    lab.result === 'FIT' ? 'status-chip-compliant' : 'status-chip-unfit'
                  }`}
                >
                  {lab.result}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border-base)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Verified against ISO 17025 accredited railway lab protocols</span>
            <Link to="/reports" className="text-[var(--ir-indigo)] dark:text-[var(--ir-teal)] font-semibold hover:underline">
              Generate Audit Report →
            </Link>
          </div>
        </motion.div>

      </div>

    </div>
  );
}
