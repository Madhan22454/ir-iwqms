import { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, RefreshCw } from 'lucide-react';

import { API_URL } from '../config/api';

export function MasterData() {
  const [activeTab, setActiveTab] = useState('zones');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'zones', label: '1. Zones', endpoint: '/hierarchy/zones/' },
    { id: 'divisions', label: '2. Divisions', endpoint: '/hierarchy/divisions/' },
    { id: 'stations', label: '3. Stations', endpoint: '/hierarchy/stations/' },
    { id: 'water-sources', label: '4. Water Sources', endpoint: '/hierarchy/water-sources/' },
    { id: 'laboratories', label: '5. Laboratories', endpoint: '/labs/laboratories/' },
    { id: 'users', label: '6. Users & Officers', endpoint: '/users/' },
    { id: 'parameters', label: '7. Water Parameters', endpoint: '/master/parameters/' },
    { id: 'standards', label: '8. Quality Standards', endpoint: '/master/standards/' },
    { id: 'escalation-rules', label: '9. Escalation Rules', endpoint: '/workflow/escalation-rules/' },
    { id: 'responsibilities', label: '10. Officer Mapping', endpoint: '/alerts/officers/responsibilities' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeEndpoint = tabs.find(t => t.id === activeTab)?.endpoint;
      const res = await axios.get(`${API_URL}${activeEndpoint}`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#eff6ff', padding: 10, borderRadius: 12, border: '1px solid #bfdbfe' }}>
            <Database size={22} color="#1e40af" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
              Master Data Management
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Configure Railway zones, divisions, water sources, parameters, BIS standards, and officer assignments
            </p>
          </div>
        </div>
        <button onClick={fetchData} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
          border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 8,
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
              background: activeTab === tab.id ? '#1e3a8a' : 'white',
              color: activeTab === tab.id ? 'white' : '#475569',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(30,58,138,0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div style={{
        background: 'white', borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
            {tabs.find(t => t.id === activeTab)?.label} ({data.length} records)
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
            <div style={{
              width: 36, height: 36, border: '3px solid #e2e8f0',
              borderTopColor: '#2563eb', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: 14 }}>
            No records found for this master entity.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                  {Object.keys(data[0] || {}).map(key => (
                    <th key={key} style={{
                      padding: '12px 18px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
                      whiteSpace: 'nowrap',
                    }}>
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={idx} style={{
                    borderBottom: '1px solid #f8fafc',
                    background: idx % 2 === 0 ? 'white' : '#fafafa',
                  }}>
                    {Object.values(item).map((val: any, vIdx) => (
                      <td key={vIdx} style={{
                        padding: '12px 18px', fontSize: 12.5, color: '#334155',
                        whiteSpace: 'nowrap',
                      }}>
                        {val === null || val === undefined ? (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        ) : typeof val === 'boolean' ? (
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 800,
                            background: val ? '#f0fdf4' : '#fef2f2',
                            color: val ? '#16a34a' : '#dc2626',
                          }}>
                            {val ? 'TRUE' : 'FALSE'}
                          </span>
                        ) : typeof val === 'object' ? (
                          JSON.stringify(val)
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
