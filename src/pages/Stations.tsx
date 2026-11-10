import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Train,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  MapPin,
  Droplets
} from 'lucide-react';
import { API_URL } from '../config/api';
import { 
  DEMO_STATIONS,
  DEMO_DIVISIONS,
  DEMO_ZONES,
} from '../data/mockDemoData';

interface Station {
  id: number;
  name: string;
  code: string;
  category?: string;
  gps_lat?: number;
  gps_long?: number;
  division_id: number;
  source_provenance?: string;
}

interface Division {
  id: number;
  name: string;
  code: string;
  zone_id: number;
}

interface Zone {
  id: number;
  name: string;
  code: string;
}

interface WaterSource {
  id: number;
  station_id: number;
  source_id_code: string;
  current_status: string;
}

export default function Stations() {
  const navigate = useNavigate();

  // Data states
  const [stations, setStations] = useState<Station[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stnRes, divRes, zoneRes, wsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/hierarchy/stations/`),
        axios.get(`${API_URL}/hierarchy/divisions/`),
        axios.get(`${API_URL}/hierarchy/zones/`),
        axios.get(`${API_URL}/hierarchy/water-sources/`),
      ]);

      const hasLiveStations = stnRes.status === 'fulfilled' && stnRes.value.data?.length > 10;
      if (hasLiveStations) {
        setStations(stnRes.value.data);
        setDivisions((divRes.status === 'fulfilled' && divRes.value.data) || []);
        setZones((zoneRes.status === 'fulfilled' && zoneRes.value.data) || []);
        setWaterSources((wsRes.status === 'fulfilled' && wsRes.value.data) || []);
      } else {
        // Load rich 280+ stations demo registry
        const mappedStations: Station[] = DEMO_STATIONS.map((s, idx) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          category: s.category,
          gps_lat: s.lat,
          gps_long: s.lng,
          division_id: (idx % DEMO_DIVISIONS.length) + 1,
        }));

        const mappedDivs: Division[] = DEMO_DIVISIONS.map(d => ({
          id: d.id,
          name: d.name,
          code: d.code,
          zone_id: d.zone_id,
        }));

        const mappedZones: Zone[] = DEMO_ZONES.map(z => ({
          id: z.id,
          name: z.name,
          code: z.code,
        }));

        const mappedSources: WaterSource[] = DEMO_STATIONS.map(s => ({
          id: s.id,
          station_id: s.id,
          source_id_code: `WS-${s.code}-01`,
          current_status: s.status,
        }));

        setStations(mappedStations);
        setDivisions(mappedDivs);
        setZones(mappedZones);
        setWaterSources(mappedSources);
      }
    } catch {
      // Fallback
      setStations(DEMO_STATIONS.map((s, idx) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        category: s.category,
        gps_lat: s.lat,
        gps_long: s.lng,
        division_id: (idx % DEMO_DIVISIONS.length) + 1,
      })));
      setDivisions(DEMO_DIVISIONS.map(d => ({ id: d.id, name: d.name, code: d.code, zone_id: d.zone_id })));
      setZones(DEMO_ZONES.map(z => ({ id: z.id, name: z.name, code: z.code })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map divisions and zones for quick lookup
  const divisionMap = useMemo(() => {
    const map = new Map<number, Division>();
    divisions.forEach(d => map.set(d.id, d));
    return map;
  }, [divisions]);

  const zoneMap = useMemo(() => {
    const map = new Map<number, Zone>();
    zones.forEach(z => map.set(z.id, z));
    return map;
  }, [zones]);

  // Aggregate sources per station
  const stationSourcesMap = useMemo(() => {
    const map = new Map<number, WaterSource[]>();
    waterSources.forEach(ws => {
      const list = map.get(ws.station_id) || [];
      list.push(ws);
      map.set(ws.station_id, list);
    });
    return map;
  }, [waterSources]);

  // Derive status for each station based on water sources
  const getStationStatus = (sources: WaterSource[]) => {
    if (!sources || sources.length === 0) return { label: 'NO SOURCES', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' };
    const statuses = sources.map(s => s.current_status);
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
  };

  // Filtered divisions based on selected zone
  const filteredDivisionsList = useMemo(() => {
    if (selectedZone === 'ALL') return divisions;
    const zoneId = parseInt(selectedZone, 10);
    return divisions.filter(d => d.zone_id === zoneId);
  }, [divisions, selectedZone]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [stations]);

  // Filter stations
  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = station.name?.toLowerCase().includes(term);
        const matchesCode = station.code?.toLowerCase().includes(term);
        if (!matchesName && !matchesCode) return false;
      }

      const div = divisionMap.get(station.division_id);

      // Zone filter
      if (selectedZone !== 'ALL') {
        const zoneId = parseInt(selectedZone, 10);
        if (!div || div.zone_id !== zoneId) return false;
      }

      // Division filter
      if (selectedDivision !== 'ALL') {
        const divId = parseInt(selectedDivision, 10);
        if (station.division_id !== divId) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL') {
        if ((station.category || 'Uncategorized') !== selectedCategory) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        const stnSources = stationSourcesMap.get(station.id) || [];
        const statusObj = getStationStatus(stnSources);
        if (statusObj.label !== selectedStatus) return false;
      }

      return true;
    });
  }, [stations, searchTerm, selectedZone, selectedDivision, selectedCategory, selectedStatus, divisionMap, zoneMap, stationSourcesMap]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStations.length / pageSize));
  const paginatedStations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStations.slice(start, start + pageSize);
  }, [filteredStations, currentPage]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedZone, selectedDivision, selectedCategory, selectedStatus]);

  return (
    <div className="ir-page">
      <div className="ir-container">
        
        {/* Header */}
        <div className="ir-header-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              padding: 12,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(30,58,138,0.25)'
            }}>
              <Train size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Railway Station Registry
                </h1>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(37, 99, 235, 0.15)',
                  color: '#3b82f6',
                  border: '1px solid rgba(37, 99, 235, 0.3)'
                }}>
                  {filteredStations.length} Total
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Indian Railways station directory with GIS coordinates, water source distribution, and live surveillance status
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={fetchData}
              disabled={loading}
              className="ir-btn-secondary"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="ir-card" style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search station code or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="ir-input"
                style={{ width: '100%', paddingLeft: 36 }}
              />
            </div>

            {/* Zone Filter */}
            <div>
              <select
                value={selectedZone}
                onChange={e => {
                  setSelectedZone(e.target.value);
                  setSelectedDivision('ALL');
                }}
                className="ir-input"
                style={{ width: '100%' }}
              >
                <option value="ALL">All Railway Zones ({zones.length})</option>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
                ))}
              </select>
            </div>

            {/* Division Filter */}
            <div>
              <select
                value={selectedDivision}
                onChange={e => setSelectedDivision(e.target.value)}
                className="ir-input"
                style={{ width: '100%' }}
              >
                <option value="ALL">All Divisions ({filteredDivisionsList.length})</option>
                {filteredDivisionsList.map(d => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="ir-input"
                style={{ width: '100%' }}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="ir-input"
                style={{ width: '100%' }}
              >
                <option value="ALL">All Surveillance Statuses</option>
                <option value="COMPLIANT">COMPLIANT</option>
                <option value="DUE">DUE</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="UNFIT">UNFIT</option>
                <option value="PERSISTENT FAILURE">PERSISTENT FAILURE</option>
                <option value="NO SOURCES">NO SOURCES</option>
              </select>
            </div>

          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="ir-card" style={{
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: 36,
              height: 36,
              border: '3px solid var(--border-color)',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading railway stations...</p>
          </div>
        ) : error ? (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '28px',
            textAlign: 'center'
          }}>
            <AlertCircle size={32} color="#dc2626" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', margin: '0 0 6px 0' }}>Error Loading Station Registry</h3>
            <p style={{ fontSize: 13, color: '#b91c1c', maxWidth: 500, margin: '0 auto 16px auto' }}>{error}</p>
            <button
              onClick={fetchData}
              style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="ir-card" style={{
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <Train size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>No Stations Found</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              No stations match the selected filters or search terms. Try clearing filters.
            </p>
          </div>
        ) : (
          <div className="ir-card overflow-hidden">
            <div style={{ overflowX: 'auto' }}>
              <table className="ir-table">
                <thead>
                  <tr>
                    <th>Station Code</th>
                    <th>Station Name</th>
                    <th>Zone</th>
                    <th>Division</th>
                    <th>Category</th>
                    <th>GPS Coordinates</th>
                    <th>Water Sources</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStations.map(station => {
                    const div = divisionMap.get(station.division_id);
                    const zone = div ? zoneMap.get(div.zone_id) : undefined;
                    const stnSources = stationSourcesMap.get(station.id) || [];
                    const status = getStationStatus(stnSources);

                    return (
                      <tr
                        key={station.id}
                        onClick={() => navigate(`/stations/${station.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <span style={{
                            fontWeight: 800,
                            color: '#0284c7',
                            fontFamily: 'monospace',
                            background: 'rgba(2, 132, 199, 0.1)',
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid rgba(2, 132, 199, 0.25)'
                          }}>
                            {station.code}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {station.name}
                        </td>
                        <td>
                          {zone?.code || '—'}
                        </td>
                        <td>
                          {div?.name || '—'}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            background: 'var(--badge-neutral-bg)',
                            color: 'var(--badge-neutral-text)',
                            padding: '2px 8px',
                            borderRadius: 4
                          }}>
                            {station.category || 'Standard'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12.5, fontFamily: 'monospace' }}>
                          {station.gps_lat && station.gps_long ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={13} color="var(--text-muted)" />
                              {station.gps_lat.toFixed(4)}, {station.gps_long.toFixed(4)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Not Set</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontWeight: 700,
                            color: stnSources.length > 0 ? '#0284c7' : 'var(--text-muted)'
                          }}>
                            <Droplets size={14} color={stnSources.length > 0 ? '#38bdf8' : 'var(--text-muted)'} />
                            {stnSources.length} Sources
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: 6,
                            color: status.color,
                            background: status.bg,
                            border: `1px solid ${status.border}`,
                            letterSpacing: '0.04em',
                            whiteSpace: 'nowrap'
                          }}>
                            {status.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/stations/${station.id}`);
                            }}
                            className="ir-btn-secondary"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                          >
                            View
                            <ExternalLink size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--table-header-bg)',
              fontSize: 13,
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                Showing <strong style={{ color: 'var(--text-primary)' }}>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{Math.min(currentPage * pageSize, filteredStations.length)}</strong> of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{filteredStations.length}</strong> stations
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="ir-btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: 12.5,
                    opacity: currentPage === 1 ? 0.5 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <span style={{ padding: '0 8px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ir-btn-secondary"
                  style={{
                    padding: '6px 12px',
                    fontSize: 12.5,
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
