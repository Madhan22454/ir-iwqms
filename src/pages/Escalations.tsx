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
              background: 'linear-gradient(135deg, #b91c1c, #dc2626)',
              padding: 12,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(185,28,28,0.25)'
            }}>
              <Flame size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Water Quality Escalation Control
                </h1>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca'
                }}>
                  {counts.total} Escalated Incidents
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0' }}>
                Multi-tier escalation hierarchy: Divisional DRM → Zonal GM/PCMD → Railway Board (Ministry of Railways)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

        {actionMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: actionMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: actionMessage.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${actionMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {actionMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {actionMessage.text}
          </div>
        )}

        {/* Level Counter Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Total Escalated</span>
              <ShieldAlert size={18} color="#b91c1c" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
              {counts.total}
            </div>
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>
              Active escalated alerts
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Level 1: Division</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4 }}>48h</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#b45309', marginTop: 8 }}>
              {counts.l1}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Sr. DEN / CMS / DRM
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Level 2: Zonal HQ</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: '#ffedd5', color: '#c2410c', padding: '2px 6px', borderRadius: 4 }}>96h</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#c2410c', marginTop: 8 }}>
              {counts.l2}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              PCE / PCMD / GM
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Level 3: Central Board</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: 4 }}>144h</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#991b1b', marginTop: 8 }}>
              {counts.l3}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Executive Director / Member (Infra)
            </div>
          </div>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          borderRadius: 10,
          padding: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
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
              background: activeTab === 'escalations' ? '#1e3a8a' : 'transparent',
              color: activeTab === 'escalations' ? '#ffffff' : '#475569',
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
              background: activeTab === 'rules' ? '#1e3a8a' : 'transparent',
              color: activeTab === 'rules' ? '#ffffff' : '#475569',
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
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Railway Automatic Escalation Timers & Protocol Matrix
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>
                  If water quality incidents or corrective action milestones remain unresolved, alerts escalate automatically.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Rule Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Alert Category</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Trigger Severity</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Escalation Level</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Delay Window</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Escalate To Role</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                        No escalation rules configured.
                      </td>
                    </tr>
                  ) : (
                    rules.map(rule => (
                      <tr key={rule.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{rule.name}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{rule.alert_type}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#fef2f2', color: '#dc2626' }}>
                            {rule.severity || 'CRITICAL'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>Level {rule.level}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{rule.delay_hours} Hours</td>
                        <td style={{ padding: '12px 16px', color: '#1e3a8a', fontWeight: 600 }}>{rule.escalate_to_role || 'ADMIN'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: rule.is_active ? '#f0fdf4' : '#f1f5f9', color: rule.is_active ? '#16a34a' : '#64748b' }}>
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
                  placeholder="Search alert ID, source, or station..."
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
                value={selectedLevel}
                onChange={e => setSelectedLevel(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#f8fafc' }}
              >
                <option value="ALL">All Escalation Levels</option>
                <option value="1">Level 1: Division (DRM)</option>
                <option value="2">Level 2: Zonal HQ (GM)</option>
                <option value="3">Level 3: Central Board</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={e => setSelectedSeverity(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, background: '#f8fafc' }}
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>

            {/* Table */}
            <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Alert ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Current Escalation Level</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Station / Zone</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Source ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Sample Result</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Severity</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>Escalated Date</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                          No escalated alerts found.
                        </td>
                      </tr>
                    ) : (
                      filteredAlerts.map(a => {
                        const lvlBadge = getLevelBadge(a.escalation_level);
                        const isActionLoading = actionLoadingId === a.id;
                        return (
                          <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <Link
                                to={`/alerts/${a.id}`}
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  color: '#dc2626',
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
