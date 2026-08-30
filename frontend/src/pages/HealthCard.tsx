import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Clock,
  Search, Filter, QrCode, FlaskConical, X, ChevronLeft, ChevronRight
} from 'lucide-react';

import { API_URL } from '../config/api';

const STATUS_CONFIG: Record<string, { icon: any; bg: string; text: string; border: string; label: string }> = {
  COMPLIANT: { icon: ShieldCheck, bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'Compliant' },
  UNFIT: { icon: ShieldAlert, bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Unfit' },
  UNSATISFACTORY: { icon: AlertTriangle, bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Unsatisfactory' },
  OVERDUE: { icon: Clock, bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff', label: 'Overdue' },
  DUE: { icon: Clock, bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'Due' },
  PERSISTENT_FAILURE: { icon: ShieldAlert, bg: '#fff1f2', text: '#7f1d1d', border: '#fecdd3', label: 'Persistent Failure' },
};

const DEFAULT_STATUS = { icon: AlertTriangle, bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: 'Unknown' };

export function HealthCard() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  const [qrModalItem, setQrModalItem] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wsRes, stnRes] = await Promise.all([
          axios.get(`${API_URL}/hierarchy/water-sources/`),
          axios.get(`${API_URL}/hierarchy/stations/`)
        ]);
        
        const stationMap: Record<number, any> = {};
        stnRes.data.forEach((s: any) => { stationMap[s.id] = s; });
        
        const enriched = wsRes.data.map((ws: any) => ({
          ...ws,
          station: stationMap[ws.station_id] || {}
        }));
        
        setSources(enriched);
      } catch (err) {
        console.error('Failed to load registry data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return sources.filter(item => {
      const matchesSearch = 
        item.source_id_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.station?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.station?.code?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = statusFilter === 'ALL' || item.current_status === statusFilter;
      const matchesType = typeFilter === 'ALL' || item.source_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [sources, searchTerm, statusFilter, typeFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(sources.map(s => s.source_type).filter(Boolean));
    return Array.from(types);
  }, [sources]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
      
      {/* Header & Controls */}
      <div style={{ padding: '24px 28px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              Water Source Registry
            </h2>
            <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 4 }}>
              Enterprise view of all monitored water sources across the network
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
              <input 
                type="text" 
                placeholder="Search ID, Station..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid #cbd5e1',
                  fontSize: 13, outline: 'none', width: 220, fontFamily: 'inherit'
                }}
              />
            </div>
            
            {/* Status Filter */}
            <div style={{ position: 'relative' }}>
              <Filter size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid #cbd5e1',
                  fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLIANT">Compliant</option>
                <option value="UNFIT">Unfit</option>
                <option value="UNSATISFACTORY">Unsatisfactory</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PERSISTENT_FAILURE">Persistent Failure</option>
              </select>
            </div>

            {/* Type Filter */}
            <div style={{ position: 'relative' }}>
              <Filter size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 11 }} />
              <select 
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={{
                  padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid #cbd5e1',
                  fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                <option value="ALL">All Source Types</option>
                {uniqueTypes.map((t: any) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div style={{ flex: 1, padding: '24px 28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden'
        }}>
          
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                <tr>
                  {['Source ID', 'Station', 'Type', 'Disinfection', 'Status', 'Last Sample', 'Next Due', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '14px 20px', fontSize: 11.5, fontWeight: 800, color: '#475569',
                      textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px' }}>
                      <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                      No water sources found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => {
                    const cfg = STATUS_CONFIG[row.current_status] || DEFAULT_STATUS;
                    const StatusIcon = cfg.icon;
                    const isDue = (dateStr: string) => dateStr && new Date(dateStr) < new Date();
                    
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafafa')}>
                        
                        <td style={{ padding: '14px 20px', fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
                          {row.source_id_code}
                        </td>
                        
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{row.station?.name || '—'}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{row.station?.code} · {row.station?.division?.name}</div>
                        </td>
                        
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                          {row.source_type || '—'}
                        </td>
                        
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                          {row.disinfection_method || '—'}
                        </td>
                        
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                            background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`
                          }}>
                            <StatusIcon size={12} />
                            {cfg.label}
                          </span>
                        </td>
                        
                        <td style={{ padding: '14px 20px', fontSize: 12.5, color: '#475569' }}>
                          {row.last_bacteriological_sample_date ? new Date(row.last_bacteriological_sample_date).toLocaleDateString() : '—'}
                        </td>
                        
                        <td style={{ padding: '14px 20px', fontSize: 12.5 }}>
                          {row.next_bacteriological_sample_due ? (
                            <span style={{ 
                              color: isDue(row.next_bacteriological_sample_due) ? '#dc2626' : '#475569', 
                              fontWeight: isDue(row.next_bacteriological_sample_due) ? 700 : 500,
                              display: 'flex', alignItems: 'center', gap: 4
                            }}>
                              {isDue(row.next_bacteriological_sample_due) && <Clock size={12} />}
                              {new Date(row.next_bacteriological_sample_due).toLocaleDateString()}
                            </span>
                          ) : '—'}
                        </td>
                        
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              onClick={() => setQrModalItem(row)}
                              style={{ background: '#f1f5f9', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: '#475569' }}
                              title="View QR"
                            >
                              <QrCode size={16} />
                            </button>
                            <Link 
                              to={`/lab/result-entry?source_id=${row.id}`} 
                              style={{ background: '#eff6ff', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: '#2563eb', textDecoration: 'none' }}
                              title="Enter Lab Result"
                            >
                              <FlaskConical size={16} />
                            </Link>
                          </div>
                        </td>
                        
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && (
            <div style={{ 
              padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                Showing <span style={{ fontWeight: 700, color: '#0f172a' }}>{filteredData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</span> to <span style={{ fontWeight: 700, color: '#0f172a' }}>{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> of <span style={{ fontWeight: 700, color: '#0f172a' }}>{filteredData.length}</span> results
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ 
                    display: 'flex', alignItems: 'center', padding: '6px 12px', borderRadius: 6,
                    background: currentPage === 1 ? '#f1f5f9' : 'white', 
                    border: '1px solid #e2e8f0', color: currentPage === 1 ? '#94a3b8' : '#334155',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600
                  }}
                >
                  <ChevronLeft size={16} style={{ marginRight: 4 }} /> Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{ 
                    display: 'flex', alignItems: 'center', padding: '6px 12px', borderRadius: 6,
                    background: currentPage === totalPages || totalPages === 0 ? '#f1f5f9' : 'white', 
                    border: '1px solid #e2e8f0', color: currentPage === totalPages || totalPages === 0 ? '#94a3b8' : '#334155',
                    cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600
                  }}
                >
                  Next <ChevronRight size={16} style={{ marginLeft: 4 }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal (Kept similar to original but cleaned up) */}
      {qrModalItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '28px', maxWidth: 360, width: '90%',
            textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Water Source QR</div>
              <button onClick={() => setQrModalItem(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{
              background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 14,
              padding: '24px', margin: '0 auto 16px', width: 180, height: 180,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <QrCode size={100} color="#1e3a8a" />
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>IR-IWQMS-QR</div>
            </div>

            <div style={{ fontSize: 18, fontWeight: 900, color: '#1e40af' }}>{qrModalItem.source_id_code}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 500 }}>
              {qrModalItem.station?.name} · {qrModalItem.station?.division?.name}
            </div>

            <button onClick={() => window.print()} style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white', 
              fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 24,
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}>
              Print QR Label
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
