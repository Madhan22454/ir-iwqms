import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Flame,
  ArrowUpRight,
  ShieldAlert,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { API_URL } from '../config/api';

interface AlertItem {
  id: number;
  alert_id: string;
  severity: string;
  source_id_code: string;
  station_name: string;
  division_name: string;
  zone_name: string;
  source_type: string;
  sample_result: string;
  sample_date?: string;
  status: string;
  created_at: string;
  due_date: string;
  is_escalated: boolean;
  escalation_level?: number;
  escalated_at?: string;
}

interface EscalationRule {
  id: number;
  name: string;
  alert_type: string;
  severity?: string;
  level: number;
  delay_hours: number;
  escalate_to_role?: string;
  is_active: boolean;
}

export default function Escalations() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tab: 'escalations' | 'rules'
  const [activeTab, setActiveTab] = useState<'escalations' | 'rules'>('escalations');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  // Escalating action state
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertsRes, rulesRes] = await Promise.all([
        axios.get(`${API_URL}/alerts/?limit=300`),
        axios.get(`${API_URL}/workflow/escalation-rules/`),
      ]);

      const allAlerts: AlertItem[] = alertsRes.data || [];
      // Filter alerts that have been escalated or are in ESCALATED status
      const escalatedAlerts = allAlerts.filter(a => a.is_escalated || a.status === 'ESCALATED' || (a.escalation_level && a.escalation_level > 0));
      setAlerts(escalatedAlerts);
      setRules(rulesRes.data || []);
    } catch (err: any) {
      console.error('Failed to load escalations data', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load escalations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Action: Escalate alert to higher level
  const handleEscalateHigher = async (alertId: number) => {
    setActionLoadingId(alertId);
    setActionMessage(null);
    try {
      const res = await axios.post(`${API_URL}/alerts/${alertId}/escalate`);
      setActionMessage({ text: `Alert escalated to Level ${res.data.escalation_level} successfully!`, type: 'success' });
      await fetchData();
    } catch (err: any) {
      console.error('Failed to escalate alert', err);
      setActionMessage({ text: err?.response?.data?.detail || 'Failed to escalate alert.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper for badge display
  const getLevelBadge = (level?: number) => {
    const lvl = level || 1;
    switch (lvl) {
      case 1:
        return { label: 'Level 1: Division', color: '#b45309', bg: '#fef3c7', border: '#fcd34d' };
      case 2:
        return { label: 'Level 2: Zonal HQ', color: '#c2410c', bg: '#ffedd5', border: '#fdba74' };
      case 3:
      default:
        return { label: 'Level 3: Central Board', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' };
    }
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const codeMatch = a.alert_id?.toLowerCase().includes(term) || a.source_id_code?.toLowerCase().includes(term);
        const stnMatch = a.station_name?.toLowerCase().includes(term) || a.zone_name?.toLowerCase().includes(term);
        if (!codeMatch && !stnMatch) return false;
      }

      if (selectedLevel !== 'ALL') {
        const lvl = a.escalation_level || 1;
        if (lvl !== parseInt(selectedLevel, 10)) return false;
      }

      if (selectedSeverity !== 'ALL') {
        if (a.severity !== selectedSeverity) return false;
      }

      return true;
    });
  }, [alerts, searchTerm, selectedLevel, selectedSeverity]);

  // Counts
  const counts = useMemo(() => {
    let l1 = 0;
    let l2 = 0;
    let l3 = 0;
    alerts.forEach(a => {
      const lvl = a.escalation_level || 1;
      if (lvl === 1) l1++;
      else if (lvl === 2) l2++;
      else l3++;
    });
    return { total: alerts.length, l1, l2, l3 };
  }, [alerts]);

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
              <Flame size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Water Quality Escalation Control
                </h1>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)'
                }}>
                  {counts.total} Escalated Incidents
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Multi-tier escalation hierarchy: Divisional DRM → Zonal GM/PCMD → Railway Board (Ministry of Railways)
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

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {actionMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: actionMessage.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: actionMessage.type === 'success' ? '#10b981' : '#ef4444',
            border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
          }}>
            {actionMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {actionMessage.text}
          </div>
        )}

        {/* Level Counter Cards */}
        <div className="ir-stat-grid">
          <div className="ir-stat-card">
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Escalated</span>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {counts.total}
              </div>
              <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2, fontWeight: 600 }}>
                Active escalated alerts
              </div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.15)', padding: 10, borderRadius: 10 }}>
              <ShieldAlert size={20} color="#ef4444" />
            </div>
          </div>

          <div className="ir-stat-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Level 1: Division</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '1px 5px', borderRadius: 4 }}>48h</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                {counts.l1}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Sr. DEN / CMS / DRM
              </div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.15)', padding: 10, borderRadius: 10 }}>
              <Flame size={20} color="#f59e0b" />
            </div>
          </div>

          <div className="ir-stat-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Level 2: Zonal HQ</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(249,115,22,0.2)', color: '#f97316', padding: '1px 5px', borderRadius: 4 }}>96h</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#f97316', marginTop: 4 }}>
                {counts.l2}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                PCE / PCMD / GM
              </div>
            </div>
            <div style={{ background: 'rgba(249,115,22,0.15)', padding: 10, borderRadius: 10 }}>
              <Flame size={20} color="#f97316" />
            </div>
          </div>

          <div className="ir-stat-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Level 3: Central Board</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '1px 5px', borderRadius: 4 }}>144h</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
                {counts.l3}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Executive Director / Member (Infra)
              </div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.15)', padding: 10, borderRadius: 10 }}>
              <ShieldAlert size={20} color="#ef4444" />
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div className="ir-card" style={{
          display: 'flex',
          padding: 4,
          gap: 6
        }}>
          <button
            onClick={() => setActiveTab('escalations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'escalations' ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : 'transparent',
              color: activeTab === 'escalations' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: activeTab === 'escalations' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            <Flame size={16} />
            Escalated Alerts Queue ({filteredAlerts.length})
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'rules' ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : 'transparent',
              color: activeTab === 'rules' ? '#ffffff' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: activeTab === 'rules' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            <Sliders size={16} />
            Escalation Policy & Rules ({rules.length})
          </button>
        </div>

        {activeTab === 'rules' ? (
          /* Escalation Rules View */
          <div className="ir-card overflow-hidden">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Railway Automatic Escalation Timers & Protocol Matrix
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  If water quality incidents or corrective action milestones remain unresolved, alerts escalate automatically.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="ir-table">
                <thead>
                  <tr>
                    <th>Rule Name</th>
                    <th>Alert Category</th>
                    <th>Trigger Severity</th>
                    <th>Escalation Level</th>
                    <th>Delay Window</th>
                    <th>Escalate To Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No escalation rules configured.
                      </td>
                    </tr>
                  ) : (
                    rules.map(rule => (
                      <tr key={rule.id}>
                        <td style={{ fontWeight: 700 }}>{rule.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{rule.alert_type}</td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                            {rule.severity || 'CRITICAL'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>Level {rule.level}</td>
                        <td style={{ fontWeight: 700 }}>{rule.delay_hours} Hours</td>
                        <td style={{ color: '#38bdf8', fontWeight: 600 }}>{rule.escalate_to_role || 'ADMIN'}</td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: rule.is_active ? 'rgba(16,185,129,0.15)' : 'var(--border-subtle)', color: rule.is_active ? '#10b981' : 'var(--text-muted)' }}>
                            {rule.is_active ? 'ACTIVE' : 'DISABLED'}
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
          /* Escalated Alerts Queue */
          <>
            {/* Filters */}
            <div className="ir-card" style={{
              padding: '14px 18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12
            }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search alert ID, source, or station..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="ir-input"
                  style={{ width: '100%', paddingLeft: 36 }}
                />
              </div>

              <select
                value={selectedLevel}
                onChange={e => setSelectedLevel(e.target.value)}
                className="ir-input"
              >
                <option value="ALL">All Escalation Levels</option>
                <option value="1">Level 1: Division (DRM)</option>
                <option value="2">Level 2: Zonal HQ (GM)</option>
                <option value="3">Level 3: Central Board</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={e => setSelectedSeverity(e.target.value)}
                className="ir-input"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>

            {/* Table */}
            <div className="ir-card overflow-hidden">
              <div style={{ overflowX: 'auto' }}>
                <table className="ir-table">
                  <thead>
                    <tr>
                      <th>Alert ID</th>
                      <th>Current Escalation Level</th>
                      <th>Station / Zone</th>
                      <th>Source ID</th>
                      <th>Sample Result</th>
                      <th>Severity</th>
                      <th>Escalated Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                          No escalated alerts found.
                        </td>
                      </tr>
                    ) : (
                      filteredAlerts.map(a => {
                        const lvlBadge = getLevelBadge(a.escalation_level);
                        const isActionLoading = actionLoadingId === a.id;
                        return (
                          <tr key={a.id}>
                            <td>
                              <Link
                                to={`/alerts/${a.id}`}
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  color: '#ef4444',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                {a.alert_id}
                                <ExternalLink size={12} />
                              </Link>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: 6,
                                color: lvlBadge.color,
                                background: lvlBadge.bg,
                                border: `1px solid ${lvlBadge.border}`,
                                whiteSpace: 'nowrap'
                              }}>
                                {lvlBadge.label}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{a.station_name}</div>
                              <div style={{ fontSize: 11.5, color: '#64748b' }}>{a.zone_name} • {a.division_name}</div>
                            </td>
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>
                              {a.source_id_code}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: '#dc2626' }}>
                              {a.sample_result}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: '#fef2f2', color: '#dc2626' }}>
                                {a.severity}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>
                              {a.escalated_at ? new Date(a.escalated_at).toLocaleString('en-IN') : (a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—')}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  onClick={() => handleEscalateHigher(a.id)}
                                  disabled={isActionLoading || (a.escalation_level ?? 1) >= 3}
                                  title="Escalate to next level authority"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '5px 10px',
                                    borderRadius: 6,
                                    border: '1px solid #fecaca',
                                    background: (a.escalation_level ?? 1) >= 3 ? '#f1f5f9' : '#fef2f2',
                                    color: (a.escalation_level ?? 1) >= 3 ? '#94a3b8' : '#dc2626',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: (a.escalation_level ?? 1) >= 3 || isActionLoading ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  <ArrowUpRight size={13} />
                                  {(a.escalation_level ?? 1) >= 3 ? 'Max Level' : 'Escalate Up'}
                                </button>

                                <Link
                                  to={`/alerts/${a.id}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '5px 10px',
                                    borderRadius: 6,
                                    border: '1px solid #bfdbfe',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textDecoration: 'none'
                                  }}
                                >
                                  Resolve
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
