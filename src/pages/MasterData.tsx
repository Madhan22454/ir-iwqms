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
    <div className="ir-page">
      <div className="ir-container space-y-6">
        {/* Header */}
        <div className="ir-header-card flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30">
              <Database size={24} className="text-sky-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Master Data Architecture
              </h2>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Configure Railway zones, divisions, water sources, testing parameters, and BIS IS 10500 standards
              </p>
            </div>
          </div>
          <button 
            onClick={fetchData} 
            className="ir-btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'ir-btn-primary' : 'ir-btn-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Card */}
        <div className="ir-card overflow-hidden">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
              {tabs.find(t => t.id === activeTab)?.label} ({data.length} records)
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
              Loading master database records...
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
              No records found for this master entity.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
              <table className="ir-table">
                <thead>
                  <tr>
                    {Object.keys(data[0] || {}).map(key => (
                      <th key={key} className="whitespace-nowrap">
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={idx}>
                      {Object.values(item).map((val: any, vIdx) => (
                        <td key={vIdx} className="whitespace-nowrap">
                          {val === null || val === undefined ? (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          ) : typeof val === 'boolean' ? (
                            <span style={{
                              padding: '2px 8px', borderRadius: 10, fontSize: 10.5, fontWeight: 800,
                              background: val ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: val ? '#10b981' : '#ef4444',
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
    </div>
  );
}
