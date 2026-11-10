import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Droplets,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle
} from 'lucide-react';
import { API_URL } from '../config/api';
import { DEMO_STATIONS, DEMO_DIVISIONS, DEMO_ZONES } from '../data/mockDemoData';

interface WaterSourceItem {
  id: number;
  station_id: number;
  source_id_code: string;
  source_type: string;
  capacity?: string;
  areas_supplied?: string;
  population_served?: number;
  storage_tank?: string;
  treatment_facility?: string;
  disinfection_method?: string;
  disinfection_frequency_days?: number;
  gps_lat?: number;
  gps_long?: number;
  current_status: string;
  consecutive_failures?: number;
  total_failures?: number;
  last_bacteriological_sample_date?: string;
  last_chemical_sample_date?: string;
  next_bacteriological_sample_due?: string;
  next_chemical_sample_due?: string;
  last_disinfection_date?: string;
  next_disinfection_due?: string;
  residual_chlorine_last?: number;
}

interface Station {
  id: number;
  name: string;
  code: string;
  division_id: number;
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

const SOURCE_TYPES = [
  'BOREWELL',
  'TUBEWELL',
  'OPEN_WELL',
  'MUNICIPAL_SUPPLY',
  'STORAGE_TANK',
  'FILTRATION_PLANT',
  'WATER_COOLER',
  'OTHER'
];

const DISINFECTION_METHODS = [
  'CHLORINATION',
  'GAS_CHLORINATION',
  'BLEACHING_POWDER',
  'UV',
  'OZONATION',
  'RO',
  'NONE'
];

export default function WaterSources() {
  const [sources, setSources] = useState<WaterSourceItem[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // New Source Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    station_id: '',
    source_id_code: '',
    source_type: 'BOREWELL',
    capacity: '',
    areas_supplied: '',
    population_served: '',
    storage_tank: '',
    treatment_facility: '',
    disinfection_method: 'CHLORINATION',
    disinfection_frequency_days: '30',
    gps_lat: '',
    gps_long: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wsRes, stnRes, divRes, zoneRes] = await Promise.allSettled([
        axios.get(`${API_URL}/hierarchy/water-sources/`),
        axios.get(`${API_URL}/hierarchy/stations/`),
        axios.get(`${API_URL}/hierarchy/divisions/`),
        axios.get(`${API_URL}/hierarchy/zones/`),
      ]);

      const hasLiveSources = wsRes.status === 'fulfilled' && wsRes.value.data?.length > 15;
      if (hasLiveSources) {
        setSources(wsRes.value.data);
        setStations((stnRes.status === 'fulfilled' && stnRes.value.data) || []);
        setDivisions((divRes.status === 'fulfilled' && divRes.value.data) || []);
        setZones((zoneRes.status === 'fulfilled' && zoneRes.value.data) || []);
      } else {
        // Generate realistic demonstration water sources across Indian Railways stations
        const generatedSources: WaterSourceItem[] = [];
        const sourceTypes = ['BOREWELL', 'STORAGE_TANK', 'FILTRATION_PLANT', 'WATER_COOLER', 'MUNICIPAL_SUPPLY'];
        const dismethods = ['CHLORINATION', 'BLEACHING_POWDER', 'RO', 'UV'];

        DEMO_STATIONS.slice(0, 100).forEach((stn) => {
          for (let i = 1; i <= stn.water_sources_count; i++) {
            const stype = sourceTypes[(stn.id + i) % sourceTypes.length];
            const dmethod = dismethods[(stn.id + i) % dismethods.length];
            generatedSources.push({
              id: stn.id * 10 + i,
              station_id: stn.id,
              source_id_code: `WS-${stn.code}-0${i}`,
              source_type: stype,
              capacity: `${(20 + ((stn.id + i) % 8) * 15) * 1000} L/day`,
              disinfection_method: dmethod,
              current_status: i === 1 ? stn.status : 'COMPLIANT',
              last_disinfection_date: new Date(Date.now() - (i * 3) * 86400000).toISOString().split('T')[0],
              residual_chlorine_last: stn.chlorine_ppm,
              gps_lat: stn.lat,
              gps_long: stn.lng,
            });
          }
        });

        const mappedStations: Station[] = DEMO_STATIONS.map((s, idx) => ({
          id: s.id,
          name: s.name,
          code: s.code,
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

        setSources(generatedSources);
        setStations(mappedStations);
        setDivisions(mappedDivs);
        setZones(mappedZones);
      }
    } catch {
      // Offline fallback
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lookups
  const stationMap = useMemo(() => {
    const map = new Map<number, Station>();
    stations.forEach(s => map.set(s.id, s));
    return map;
  }, [stations]);

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

  const filteredDivisionsList = useMemo(() => {
    if (selectedZone === 'ALL') return divisions;
    const zId = parseInt(selectedZone, 10);
    return divisions.filter(d => d.zone_id === zId);
  }, [divisions, selectedZone]);

  // Filter sources
  const filteredSources = useMemo(() => {
    return sources.filter(src => {
      const station = stationMap.get(src.station_id);
      const division = station ? divisionMap.get(station.division_id) : undefined;
      const zone = division ? zoneMap.get(division.zone_id) : undefined;

      // Search (Source ID, Station Name)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesCode = src.source_id_code?.toLowerCase().includes(term);
        const matchesStation = station?.name?.toLowerCase().includes(term) || station?.code?.toLowerCase().includes(term);
        if (!matchesCode && !matchesStation) return false;
      }

      // Zone filter
      if (selectedZone !== 'ALL') {
        const zId = parseInt(selectedZone, 10);
        if (!zone || zone.id !== zId) return false;
      }

      // Division filter
      if (selectedDivision !== 'ALL') {
        const dId = parseInt(selectedDivision, 10);
        if (!station || station.division_id !== dId) return false;
      }

      // Source Type filter
      if (selectedType !== 'ALL') {
        if (src.source_type !== selectedType) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (src.current_status !== selectedStatus) return false;
      }

      return true;
    });
  }, [sources, searchTerm, selectedZone, selectedDivision, selectedType, selectedStatus, stationMap, divisionMap, zoneMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSources.length / pageSize));
  const paginatedSources = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSources.slice(start, start + pageSize);
  }, [filteredSources, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedZone, selectedDivision, selectedType, selectedStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return { label: 'COMPLIANT', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
      case 'DUE':
        return { label: 'DUE', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
      case 'OVERDUE':
        return { label: 'OVERDUE', color: '#ea580c', bg: '#fff7ed', border: '#fdba74' };
      case 'UNFIT':
        return { label: 'UNFIT', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
      case 'PERSISTENT_FAILURE':
        return { label: 'PERSISTENT FAILURE', color: '#991b1b', bg: '#fef2f2', border: '#fca5a5' };
      default:
        return { label: status || 'UNKNOWN', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' };
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!formData.station_id) {
      setModalError('Please select a station.');
      return;
    }
    if (!formData.source_id_code.trim()) {
      setModalError('Please provide a unique Source ID code.');
      return;
    }

    setModalSubmitting(true);
    try {
      const payload: any = {
        station_id: parseInt(formData.station_id, 10),
        source_id_code: formData.source_id_code.trim().toUpperCase(),
        source_type: formData.source_type,
        capacity: formData.capacity.trim() || undefined,
        areas_supplied: formData.areas_supplied.trim() || undefined,
        population_served: formData.population_served ? parseInt(formData.population_served, 10) : undefined,
        storage_tank: formData.storage_tank.trim() || undefined,
        treatment_facility: formData.treatment_facility.trim() || undefined,
        disinfection_method: formData.disinfection_method,
        disinfection_frequency_days: parseInt(formData.disinfection_frequency_days, 10) || 30,
        gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : undefined,
        gps_long: formData.gps_long ? parseFloat(formData.gps_long) : undefined,
      };

      await axios.post(`${API_URL}/hierarchy/water-sources/`, payload);
      setModalSuccess('Water source created successfully!');
      
      // Refresh list
      await fetchData();

      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(null);
        setFormData({
          station_id: '',
          source_id_code: '',
          source_type: 'BOREWELL',
          capacity: '',
          areas_supplied: '',
          population_served: '',
          storage_tank: '',
          treatment_facility: '',
          disinfection_method: 'CHLORINATION',
          disinfection_frequency_days: '30',
          gps_lat: '',
          gps_long: ''
        });
      }, 1000);
    } catch (err: any) {
      console.error('Failed to create water source', err);
      setModalError(err?.response?.data?.detail || err?.message || 'Failed to create water source. Please check data.');
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="ir-page">
      <div className="ir-container">
        
        {/* Header */}
        <div className="ir-header-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              padding: 12,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              flexShrink: 0
            }}>
              <Droplets size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Water Source Registry
                </h1>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(59,130,246,0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(59,130,246,0.3)'
                }}>
                  {filteredSources.length} Registered Sources
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Complete inventory of Indian Railways borewells, filtration plants, storage reservoirs, and distribution taps
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="ir-btn-primary"
            >
              <Plus size={16} />
              New Water Source
            </button>

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

        {/* Filters */}
        <div className="ir-card" style={{
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12
        }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search Source ID or Station..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="ir-input"
              style={{ width: '100%', paddingLeft: 36 }}
            />
          </div>

          {/* Zone */}
          <select
            value={selectedZone}
            onChange={e => {
              setSelectedZone(e.target.value);
              setSelectedDivision('ALL');
            }}
            className="ir-input"
          >
            <option value="ALL">All Zones ({zones.length})</option>
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.code} - {z.name}</option>
            ))}
          </select>

          {/* Division */}
          <select
            value={selectedDivision}
            onChange={e => setSelectedDivision(e.target.value)}
            className="ir-input"
          >
            <option value="ALL">All Divisions ({filteredDivisionsList.length})</option>
            {filteredDivisionsList.map(d => (
              <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
            ))}
          </select>

          {/* Type */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="ir-input"
          >
            <option value="ALL">All Source Types</option>
            {SOURCE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="ir-input"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLIANT">COMPLIANT</option>
            <option value="DUE">DUE</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="UNFIT">UNFIT</option>
            <option value="PERSISTENT_FAILURE">PERSISTENT FAILURE</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: 36,
              height: 36,
              border: '3px solid #cbd5e1',
              borderTopColor: '#0284c7',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Loading water sources...</p>
          </div>
        ) : error ? (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center'
          }}>
            <AlertCircle size={32} color="#dc2626" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', margin: '0 0 6px 0' }}>Error Loading Registry</h3>
            <p style={{ fontSize: 13, color: '#b91c1c', margin: '0 0 16px 0' }}>{error}</p>
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
        ) : filteredSources.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <Droplets size={36} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>No Water Sources Found</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              No water sources matched your criteria. Try adjusting filters or click "New Water Source" to add one.
            </p>
          </div>
        ) : (
          <div className="ir-card overflow-hidden">
            <div style={{ overflowX: 'auto' }}>
              <table className="ir-table">
                <thead>
                  <tr>
                    <th>Source ID</th>
                    <th>Station</th>
                    <th>Division</th>
                    <th>Zone</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Disinfection</th>
                    <th>Last Sample</th>
                    <th>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSources.map(src => {
                    const stn = stationMap.get(src.station_id);
                    const div = stn ? divisionMap.get(stn.division_id) : undefined;
                    const zone = div ? zoneMap.get(div.zone_id) : undefined;
                    const badge = getStatusBadge(src.current_status);

                    const lastDate = src.last_bacteriological_sample_date || src.last_chemical_sample_date;

                    return (
                      <tr key={src.id}>
                        <td>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#0284c7',
                            background: 'rgba(2, 132, 199, 0.1)',
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid rgba(2, 132, 199, 0.25)'
                          }}>
                            {src.source_id_code}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {stn?.name || '—'} ({stn?.code || '—'})
                        </td>
                        <td>
                          {div?.name || '—'}
                        </td>
                        <td>
                          {zone?.code || '—'}
                        </td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {src.source_type}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {src.capacity || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>
                              {src.disinfection_method || 'CHLORINATION'}
                            </span>
                            {src.residual_chlorine_last !== null && src.residual_chlorine_last !== undefined && (
                              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                                {src.residual_chlorine_last} ppm
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                          {lastDate ? new Date(lastDate).toLocaleDateString('en-IN') : <span style={{ color: 'var(--text-muted)' }}>Never</span>}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: 6,
                            color: badge.color,
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            letterSpacing: '0.04em',
                            whiteSpace: 'nowrap'
                          }}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
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
                <strong style={{ color: 'var(--text-primary)' }}>{Math.min(currentPage * pageSize, filteredSources.length)}</strong> of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{filteredSources.length}</strong> sources
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

      {/* New Water Source Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 10, 23, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div className="ir-card" style={{
            borderRadius: 14,
            width: '100%',
            maxWidth: 680,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 30px -5px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Droplets size={20} color="#60a5fa" />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Register New Water Source</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {modalError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#dc2626" />
                  {modalError}
                </div>
              )}

              {modalSuccess && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#166534', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} color="#16a34a" />
                  {modalSuccess}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Station *
                  </label>
                  <select
                    required
                    value={formData.station_id}
                    onChange={e => setFormData({ ...formData, station_id: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Railway Station</option>
                    {stations.map(stn => (
                      <option key={stn.id} value={stn.id}>{stn.code} — {stn.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Source ID Code * (e.g. MAS-BW-01)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NDLS-BW-01"
                    value={formData.source_id_code}
                    onChange={e => setFormData({ ...formData, source_id_code: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Source Type
                  </label>
                  <select
                    value={formData.source_type}
                    onChange={e => setFormData({ ...formData, source_type: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  >
                    {SOURCE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Design / Pumping Capacity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50,000 Litres/Day"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Areas Supplied
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Platform 1-4 & Waiting Halls"
                    value={formData.areas_supplied}
                    onChange={e => setFormData({ ...formData, areas_supplied: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Population Served
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={formData.population_served}
                    onChange={e => setFormData({ ...formData, population_served: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Disinfection Method
                  </label>
                  <select
                    value={formData.disinfection_method}
                    onChange={e => setFormData({ ...formData, disinfection_method: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  >
                    {DISINFECTION_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Disinfection Frequency (Days)
                  </label>
                  <input
                    type="number"
                    value={formData.disinfection_frequency_days}
                    onChange={e => setFormData({ ...formData, disinfection_frequency_days: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    GPS Latitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 28.6139"
                    value={formData.gps_lat}
                    onChange={e => setFormData({ ...formData, gps_lat: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    GPS Longitude (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 77.2090"
                    value={formData.gps_long}
                    onChange={e => setFormData({ ...formData, gps_long: e.target.value })}
                    className="ir-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="ir-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="ir-btn-primary"
                >
                  {modalSubmitting ? 'Saving...' : 'Register Water Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
