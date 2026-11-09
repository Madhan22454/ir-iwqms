import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  CalendarCheck,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Droplets,
  X,
  FlaskConical
} from 'lucide-react';
import { API_URL } from '../config/api';

interface WaterSource {
  id: number;
  station_id: number;
  source_id_code: string;
  source_type: string;
  current_status: string;
  last_bacteriological_sample_date?: string;
  next_bacteriological_sample_due?: string;
  last_chemical_sample_date?: string;
  next_chemical_sample_due?: string;
}

interface Station {
  id: number;
  name: string;
  code: string;
}

interface LabSample {
  id: number;
  sample_id: string;
  water_source_id: number;
  sample_type: string;
  collection_date: string;
  collection_time?: string;
  collector_name?: string;
  sampling_location?: string;
  remarks?: string;
  status: string;
}

export default function SamplingManagement() {
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [samples, setSamples] = useState<LabSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state: 'due' | 'overdue' | 'upcoming' | 'history'
  const [activeTab, setActiveTab] = useState<'due' | 'overdue' | 'upcoming' | 'history'>('due');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Quick Action Modal: Record Sample Collection
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    water_source_id: '',
    sample_id: '',
    sample_type: 'Bacteriological',
    collection_date: new Date().toISOString().split('T')[0],
    collection_time: new Date().toTimeString().slice(0, 5),
    collector_name: '',
    sampling_location: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wsRes, stnRes, smpRes] = await Promise.all([
        axios.get(`${API_URL}/hierarchy/water-sources/`),
        axios.get(`${API_URL}/hierarchy/stations/`),
        axios.get(`${API_URL}/labs/samples/?limit=300`),
      ]);
      setSources(wsRes.data || []);
      setStations(stnRes.data || []);
      setSamples(smpRes.data || []);
    } catch (err: any) {
      console.error('Failed to load sampling data', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to fetch sampling schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stationMap = useMemo(() => {
    const map = new Map<number, Station>();
    stations.forEach(s => map.set(s.id, s));
    return map;
  }, [stations]);

  // Derive schedule items from water sources
  const scheduleItems = useMemo(() => {
    const now = new Date();
    const items: Array<{
      source: WaterSource;
      station?: Station;
      scheduleType: 'Bacteriological' | 'Chemical';
      dueDate: Date | null;
      lastDate: Date | null;
      status: 'OVERDUE' | 'DUE' | 'UPCOMING';
      daysDiff: number;
    }> = [];

    sources.forEach(src => {
      const stn = stationMap.get(src.station_id);

      // Bacteriological schedule (30-day default rule)
      const nextBac = src.next_bacteriological_sample_due ? new Date(src.next_bacteriological_sample_due) : null;
      const lastBac = src.last_bacteriological_sample_date ? new Date(src.last_bacteriological_sample_date) : null;

      let bacStatus: 'OVERDUE' | 'DUE' | 'UPCOMING' = 'UPCOMING';
      let bacDiff = 0;
      if (!nextBac) {
        bacStatus = 'DUE';
      } else {
        bacDiff = Math.ceil((nextBac.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (bacDiff < 0) bacStatus = 'OVERDUE';
        else if (bacDiff <= 7) bacStatus = 'DUE';
        else bacStatus = 'UPCOMING';
      }

      items.push({
        source: src,
        station: stn,
        scheduleType: 'Bacteriological',
        dueDate: nextBac,
        lastDate: lastBac,
        status: bacStatus,
        daysDiff: bacDiff,
      });

      // Chemical schedule (180-day default rule)
      const nextChem = src.next_chemical_sample_due ? new Date(src.next_chemical_sample_due) : null;
      const lastChem = src.last_chemical_sample_date ? new Date(src.last_chemical_sample_date) : null;

      let chemStatus: 'OVERDUE' | 'DUE' | 'UPCOMING' = 'UPCOMING';
      let chemDiff = 0;
      if (!nextChem) {
        chemStatus = 'DUE';
      } else {
        chemDiff = Math.ceil((nextChem.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (chemDiff < 0) chemStatus = 'OVERDUE';
        else if (chemDiff <= 14) chemStatus = 'DUE';
        else chemStatus = 'UPCOMING';
      }

      items.push({
        source: src,
        station: stn,
        scheduleType: 'Chemical',
        dueDate: nextChem,
        lastDate: lastChem,
        status: chemStatus,
        daysDiff: chemDiff,
      });
    });

    return items;
  }, [sources, stationMap]);

  // Filter items
  const filteredSchedule = useMemo(() => {
    return scheduleItems.filter(item => {
      if (item.status.toLowerCase() !== activeTab) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const codeMatch = item.source.source_id_code?.toLowerCase().includes(term);
        const stnMatch = item.station?.name?.toLowerCase().includes(term) || item.station?.code?.toLowerCase().includes(term);
        if (!codeMatch && !stnMatch) return false;
      }

      if (selectedStation !== 'ALL') {
        const stnId = parseInt(selectedStation, 10);
        if (item.source.station_id !== stnId) return false;
      }

      if (selectedType !== 'ALL') {
        if (item.source.source_type !== selectedType) return false;
      }

      return true;
    });
  }, [scheduleItems, activeTab, searchTerm, selectedStation, selectedType]);

  const counts = useMemo(() => {
    let overdue = 0;
    let due = 0;
    let upcoming = 0;
    scheduleItems.forEach(item => {
      if (item.status === 'OVERDUE') overdue++;
      else if (item.status === 'DUE') due++;
      else if (item.status === 'UPCOMING') upcoming++;
    });
    return { overdue, due, upcoming, history: samples.length };
  }, [scheduleItems, samples]);

  const openSampleModal = (source?: WaterSource, sampleType: 'Bacteriological' | 'Chemical' = 'Bacteriological') => {
    const sourceCode = source ? source.source_id_code : 'SRC';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const autoId = `SMP-${sourceCode}-${randNum}`;

    setForm({
      water_source_id: source ? String(source.id) : '',
      sample_id: autoId,
      sample_type: sampleType,
      collection_date: new Date().toISOString().split('T')[0],
      collection_time: new Date().toTimeString().slice(0, 5),
      collector_name: 'Railway Health Inspector',
      sampling_location: 'Direct Tapping Point / Main Reservoir',
      remarks: 'Scheduled surveillance sample collection under IR-IWQMS guidelines',
    });
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!form.water_source_id) {
      setModalError('Please select a water source.');
      return;
    }
    if (!form.sample_id.trim()) {
      setModalError('Sample ID is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sample_id: form.sample_id.trim().toUpperCase(),
        water_source_id: parseInt(form.water_source_id, 10),
        sample_type: form.sample_type,
        collection_date: `${form.collection_date}T${form.collection_time || '09:00'}:00`,
        collection_time: form.collection_time,
        collector_name: form.collector_name,
        sampling_location: form.sampling_location,
        remarks: form.remarks,
      };

      await axios.post(`${API_URL}/labs/samples/`, payload);
      setModalSuccess(`Sample ${payload.sample_id} recorded successfully!`);

      await fetchData();

      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(null);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create lab sample', err);
      setModalError(err?.response?.data?.detail || err?.message || 'Failed to record sample.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f8fafc', padding: '24px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          background: '#ffffff',
          padding: '20px 24px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              padding: 12,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(30,58,138,0.2)'
            }}>
              <CalendarCheck size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Water Sampling Management
                </h1>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: counts.overdue > 0 ? '#fef2f2' : '#f0fdf4',
                  color: counts.overdue > 0 ? '#dc2626' : '#16a34a',
                  border: `1px solid ${counts.overdue > 0 ? '#fecaca' : '#bbf7d0'}`
                }}>
                  {counts.overdue} Overdue
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                Operational surveillance schedules, collection logs, and field sampling dispatch for railway stations
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => openSampleModal()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                background: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(30,58,138,0.25)'
              }}
            >
              <Plus size={16} />
              Record Sample Collection
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#991b1b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Policy Notice Cards (Configurable frequency rules) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ background: '#eff6ff', padding: 10, borderRadius: 10, border: '1px solid #bfdbfe' }}>
              <FlaskConical size={20} color="#1d4ed8" />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Bacteriological Testing Frequency
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Mandated every <strong>30 calendar days</strong> per IS 10500 standards for all drinking water points
              </div>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ background: '#fdf4ff', padding: 10, borderRadius: 10, border: '1px solid #f0abfc' }}>
              <Droplets size={20} color="#a21caf" />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Chemical & Physical Testing Frequency
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Mandated every <strong>180 calendar days</strong> (semi-annually) across all division borewells
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          borderRadius: 10,
          padding: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          gap: 6
        }}>
          {[
            { key: 'due', label: 'Due for Collection', count: counts.due, color: '#d97706', bg: '#fffbeb' },
            { key: 'overdue', label: 'Overdue Samples', count: counts.overdue, color: '#dc2626', bg: '#fef2f2' },
            { key: 'upcoming', label: 'Upcoming Schedule', count: counts.upcoming, color: '#2563eb', bg: '#eff6ff' },
            { key: 'history', label: 'Collected Samples Log', count: counts.history, color: '#475569', bg: '#f1f5f9' },
          ].map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? '#1e3a8a' : 'transparent',
                  color: isActive ? '#ffffff' : '#475569',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(255,255,255,0.22)' : tab.bg,
                  color: isActive ? '#ffffff' : tab.color
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{
          background: '#ffffff',
          padding: '14px 18px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search source or station..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            />
          </div>

          <select
            value={selectedStation}
            onChange={e => setSelectedStation(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#f8fafc' }}
          >
            <option value="ALL">All Stations ({stations.length})</option>
            {stations.map(s => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#f8fafc' }}
          >
            <option value="ALL">All Source Types</option>
            <option value="BOREWELL">BOREWELL</option>
            <option value="STORAGE_TANK">STORAGE_TANK</option>
            <option value="MUNICIPAL_SUPPLY">MUNICIPAL_SUPPLY</option>
            <option value="FILTRATION_PLANT">FILTRATION_PLANT</option>
            <option value="WATER_COOLER">WATER_COOLER</option>
          </select>
        </div>

        {/* Content Table */}
        {activeTab === 'history' ? (
          /* Collected Samples History View */
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Sample ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Collection Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Sampling Location</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Collector</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No samples logged yet.</td>
                    </tr>
                  ) : (
                    samples.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace', color: '#1e3a8a' }}>
                          {s.sample_id}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.sample_type}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {s.collection_date ? new Date(s.collection_date).toLocaleString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#0f172a' }}>{s.sampling_location || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{s.collector_name || 'Inspector'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8' }}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Schedule Views: Due / Overdue / Upcoming */
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Source ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Station</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Testing Required</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Last Sample Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Due Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedule.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                        No {activeTab} sampling requirements found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSchedule.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#1e3a8a',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid #bfdbfe'
                          }}>
                            {item.source.source_id_code}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                          {item.station?.name || '—'} ({item.station?.code || '—'})
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{item.source.source_type}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                          {item.scheduleType}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          {item.lastDate ? item.lastDate.toLocaleDateString('en-IN') : <span style={{ color: '#cbd5e1' }}>Never</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: item.status === 'OVERDUE' ? '#dc2626' : '#0f172a', fontWeight: item.status === 'OVERDUE' ? 700 : 500 }}>
                          {item.dueDate ? item.dueDate.toLocaleDateString('en-IN') : 'Immediate'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: item.status === 'OVERDUE' ? '#fef2f2' : item.status === 'DUE' ? '#fffbeb' : '#eff6ff',
                            color: item.status === 'OVERDUE' ? '#dc2626' : item.status === 'DUE' ? '#d97706' : '#1d4ed8',
                            border: `1px solid ${item.status === 'OVERDUE' ? '#fecaca' : item.status === 'DUE' ? '#fde68a' : '#bfdbfe'}`
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => openSampleModal(item.source, item.scheduleType)}
                            style={{
                              background: '#1e3a8a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <CalendarCheck size={13} />
                            Collect Sample
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Quick Action Modal: Record Sample */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#0f172a',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalendarCheck size={20} color="#60a5fa" />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Record Sample Collection</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Water Source *
                  </label>
                  <select
                    required
                    value={form.water_source_id}
                    onChange={e => setForm({ ...form, water_source_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="">Select Water Source</option>
                    {sources.map(src => {
                      const stn = stationMap.get(src.station_id);
                      return (
                        <option key={src.id} value={src.id}>
                          {src.source_id_code} — {stn?.code} ({src.source_type})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Sample ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.sample_id}
                    onChange={e => setForm({ ...form, sample_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Sample Type *
                  </label>
                  <select
                    value={form.sample_type}
                    onChange={e => setForm({ ...form, sample_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="Bacteriological">Bacteriological (IS 10500)</option>
                    <option value="Chemical">Chemical & Physical</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Collector Name / Inspector
                  </label>
                  <input
                    type="text"
                    value={form.collector_name}
                    onChange={e => setForm({ ...form, collector_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Collection Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.collection_date}
                    onChange={e => setForm({ ...form, collection_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Collection Time
                  </label>
                  <input
                    type="time"
                    value={form.collection_time}
                    onChange={e => setForm({ ...form, collection_time: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Exact Sampling Location / Tap Point
                </label>
                <input
                  type="text"
                  placeholder="e.g. Platform 1 Drinking Hydrant #4"
                  value={form.sampling_location}
                  onChange={e => setForm({ ...form, sampling_location: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Remarks / Observations
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Water clear, no odor, residual chlorine field kit test indicated 0.4 ppm"
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1e3a8a', color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Record Sample'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
