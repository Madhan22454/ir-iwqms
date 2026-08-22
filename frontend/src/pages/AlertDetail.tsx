import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  AlertTriangle, CheckCircle, ArrowRight, FileText,
  User, Building2, Printer, Loader2, ChevronLeft, XCircle
} from 'lucide-react';

const API = 'http://localhost:8000/api/v1';

const WORKFLOW_STEPS = [
  { key: 'OPEN', label: 'Alert Created', icon: AlertTriangle, color: 'red' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged', icon: CheckCircle, color: 'amber' },
  { key: 'CORRECTIVE_ACTION', label: 'Corrective Action', icon: Building2, color: 'orange' },
  { key: 'REPEAT_SAMPLE', label: 'Repeat Sample', icon: FileText, color: 'blue' },
  { key: 'VERIFICATION', label: 'Verification', icon: User, color: 'purple' },
  { key: 'CLOSED', label: 'Closed', icon: CheckCircle, color: 'green' },
];
const STEP_ORDER = WORKFLOW_STEPS.map(s => s.key);

const RESULT_CONFIG: Record<string, { bar: string; badge: string }> = {
  UNFIT: { bar: 'bg-red-500', badge: 'bg-red-900/40 text-red-300 border-red-600' },
  UNSATISFACTORY: { bar: 'bg-amber-500', badge: 'bg-amber-900/30 text-amber-300 border-amber-600' },
  FIT: { bar: 'bg-green-500', badge: 'bg-green-900/30 text-green-300 border-green-600' },
};

export default function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<any>(null);
  const [ca, setCa] = useState<any>(null);
  const [rs, setRs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ackRemarks, setAckRemarks] = useState('');
  const [verResult, setVerResult] = useState('FIT');
  const [verRemarks, setVerRemarks] = useState('');
  const [verDecision, setVerDecision] = useState('CLOSE');
  const [caStatus, setCaStatus] = useState('');
  const [caRemarks, setCaRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    const [alertRes, caRes, rsRes] = await Promise.all([
      axios.get(`${API}/alerts/${id}`),
      axios.get(`${API}/workflow/corrective-actions/?alert_id=${id}`),
      axios.get(`${API}/workflow/repeat-samples/?alert_id=${id}`),
    ]);
    setAlert(alertRes.data);
    setCa(caRes.data[0] || null);
    setRs(rsRes.data[0] || null);
    if (caRes.data[0]) setCaStatus(caRes.data[0].status);
    setLoading(false);
  };

  useEffect(() => { if (id) load(); }, [id]);

  const currentStepIdx = STEP_ORDER.indexOf(alert?.status);
  const isEscalated = alert?.is_escalated && alert?.status === 'ESCALATED';

  const acknowledge = async () => {
    setSaving(true);
    await axios.post(`${API}/alerts/${id}/acknowledge`, { remarks: ackRemarks });
    setMsg('Alert acknowledged successfully.');
    load();
    setSaving(false);
  };

  const updateCA = async () => {
    if (!ca) return;
    setSaving(true);
    await axios.patch(`${API}/workflow/corrective-actions/${ca.id}`, {
      status: caStatus, remarks: caRemarks,
    });
    setMsg('Corrective action updated.');
    load();
    setSaving(false);
  };

  const submitVerification = async () => {
    setSaving(true);
    await axios.post(`${API}/workflow/verifications/`, {
      alert_id: Number(id),
      repeat_result: verResult,
      remarks: verRemarks,
      decision: verDecision,
    });
    setMsg(verDecision === 'CLOSE' ? 'Alert closed successfully.' : 'Alert escalated.');
    load();
    setSaving(false);
  };

  const fmt = (d: string) => d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );
  if (!alert) return null;

  const rc = RESULT_CONFIG[alert.sample_result] || RESULT_CONFIG['UNFIT'];

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to="/alerts" className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white font-mono">{alert.alert_id}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${rc.badge}`}>{alert.sample_result}</span>
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-900/50 text-red-400 border border-red-600/40">{alert.severity}</span>
                {isEscalated && (
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-900 text-red-300 border border-red-500 animate-pulse">ESCALATED L{alert.escalation_level}</span>
                )}
              </div>
              <p className="text-blue-300 text-sm mt-1">{alert.source_id_code} · {alert.zone_name} · {alert.division_name} · {alert.station_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/alerts/${id}/notice`} target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white border border-white/20 hover:bg-white/10 transition-all">
              <Printer className="w-4 h-4" /> Print Notice
            </Link>
          </div>
        </div>

        {msg && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-green-900/30 border border-green-500/40 text-green-300">
            <CheckCircle className="w-4 h-4" /> {msg}
          </div>
        )}

        {/* Workflow Timeline */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-white font-semibold mb-6">Workflow Progress</h2>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {WORKFLOW_STEPS.map((step, i) => {
              const done = isEscalated ? false : currentStepIdx > i;
              const current = isEscalated ? false : currentStepIdx === i;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex flex-col items-center ${i === 0 ? '' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      done ? 'bg-green-600 border-green-500' :
                      current ? `bg-${step.color}-600 border-${step.color}-400 shadow-lg shadow-${step.color}-500/30` :
                      'bg-gray-800 border-gray-600'
                    }`}>
                      <Icon className={`w-5 h-5 ${done ? 'text-white' : current ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className={`text-xs mt-2 text-center whitespace-nowrap ${current ? 'text-white font-medium' : done ? 'text-green-400' : 'text-white/30'}`}>
                      {step.label}
                    </div>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className={`h-0.5 w-12 mx-1 mb-5 flex-shrink-0 ${done ? 'bg-green-500' : 'bg-gray-700'}`} />
                  )}
                </div>
              );
            })}
            {isEscalated && (
              <div className="flex items-center ml-4">
                <div className="h-0.5 w-8 bg-red-500" />
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-red-700 border-2 border-red-500 flex items-center justify-center animate-pulse">
                    <ArrowRight className="w-5 h-5 text-red-200" />
                  </div>
                  <div className="text-xs text-red-400 mt-2 font-bold">ESCALATED</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Alert Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Source + Lab Info */}
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-white font-semibold mb-4">Alert Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Source ID', alert.source_id_code],
                  ['Source Type', alert.source_type],
                  ['Station', alert.station_name],
                  ['Division', alert.division_name],
                  ['Zone', alert.zone_name],
                  ['Laboratory', alert.lab_name],
                  ['Sample Date', fmtDate(alert.sample_date)],
                  ['Report Date', fmtDate(alert.report_date)],
                  ['Alert Created', fmt(alert.created_at)],
                  ['Due Date', fmtDate(alert.due_date)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-white/40 text-xs uppercase tracking-wider">{k}</div>
                    <div className="text-white mt-0.5">{v || '—'}</div>
                  </div>
                ))}
              </div>
              {alert.remarks && <p className="text-white/60 text-sm mt-4 pt-4 border-t border-white/10">{alert.remarks}</p>}
            </div>

            {/* Failed Parameters */}
            {alert.failed_parameters?.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-6 py-4 bg-red-900/20 border-b border-red-800/30">
                  <h3 className="text-red-300 font-semibold flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Failed Parameters
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {['Parameter', 'Observed', 'Limit', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-white/40 text-xs uppercase font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alert.failed_parameters.map((fp: any, i: number) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="px-4 py-3 text-white font-medium">{fp.name}</td>
                        <td className="px-4 py-3 text-red-400 font-mono font-bold">{fp.observed}</td>
                        <td className="px-4 py-3 text-white/50">{fp.limit || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-900/50 text-red-400 border border-red-700">FAIL</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notifications */}
            <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-white font-semibold mb-4">Officers Notified ({alert.notifications?.length || 0})</h3>
              <div className="space-y-2">
                {(alert.notifications || []).map((n: any) => (
                  <div key={n.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div>
                      <div className="text-white text-sm font-medium">{n.recipient_name}</div>
                      <div className="text-white/40 text-xs">{n.recipient_role} · {n.recipient_email}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      n.status === 'SENT' ? 'bg-green-900/40 text-green-400' :
                      n.status === 'SIMULATED' ? 'bg-blue-900/40 text-blue-400' :
                      'bg-gray-900/40 text-gray-400'
                    }`}>{n.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Action Panel */}
          <div className="space-y-4">
            {/* Corrective Action */}
            {ca && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.25)' }}>
                <h3 className="text-orange-300 font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Corrective Action
                </h3>
                <div className="text-xs text-white/40 mb-1">ID: <span className="text-orange-400 font-mono">{ca.action_id}</span></div>
                <div className="text-white/70 text-sm mb-3">{ca.problem_description}</div>
                <div className="text-xs text-white/40 mb-1">Action Description:</div>
                <div className="text-white/60 text-sm whitespace-pre-line mb-3">{ca.corrective_action_description}</div>
                <div className="space-y-2">
                  <select value={caStatus} onChange={e => setCaStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'rgba(30,20,10,0.8)', border: '1px solid rgba(249,115,22,0.3)' }}>
                    {['OPEN','ASSIGNED','IN_PROGRESS','COMPLETED','VERIFICATION_PENDING'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <textarea value={caRemarks} onChange={e => setCaRemarks(e.target.value)}
                    placeholder="Update remarks / evidence..."
                    rows={2} className="w-full px-3 py-2 rounded-lg text-white text-sm resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <button onClick={updateCA} disabled={saving}
                    className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'rgba(249,115,22,0.4)' }}>
                    {saving ? 'Saving...' : 'Update Status'}
                  </button>
                </div>
              </div>
            )}

            {/* Repeat Sample */}
            {rs && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <h3 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Repeat Sample
                </h3>
                <div className="text-xs text-white/40 mb-1">ID: <span className="text-blue-400 font-mono">{rs.repeat_sample_id}</span></div>
                <div className="text-sm text-white/60">
                  Scheduled: <span className="text-white">{fmtDate(rs.scheduled_date)}</span>
                </div>
                <div className="text-sm text-white/60 mt-1">
                  Status: <span className={`font-bold ${rs.status === 'VERIFIED' ? 'text-green-400' : 'text-blue-400'}`}>{rs.status}</span>
                </div>
                {rs.repeat_result && (
                  <div className="text-sm text-white/60 mt-1">
                    Result: <span className={rs.repeat_result === 'FIT' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{rs.repeat_result}</span>
                  </div>
                )}
              </div>
            )}

            {/* Acknowledge (if OPEN) */}
            {alert.status === 'OPEN' && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <h3 className="text-amber-300 font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Acknowledge Alert
                </h3>
                <textarea value={ackRemarks} onChange={e => setAckRemarks(e.target.value)}
                  placeholder="Acknowledgement remarks..."
                  rows={3} className="w-full px-3 py-2 rounded-lg text-white text-sm resize-none mb-3"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={acknowledge} disabled={saving}
                  className="w-full py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'rgba(245,158,11,0.4)' }}>
                  {saving ? 'Saving...' : 'Acknowledge Alert'}
                </button>
              </div>
            )}

            {/* Acknowledgement info */}
            {alert.status !== 'OPEN' && alert.acknowledged_at && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Acknowledged</div>
                <div className="text-white text-sm">{fmt(alert.acknowledged_at)}</div>
                {alert.acknowledgement_remarks && (
                  <div className="text-white/50 text-sm mt-1">"{alert.acknowledgement_remarks}"</div>
                )}
              </div>
            )}

            {/* Verification (if corrective action completed) */}
            {['CORRECTIVE_ACTION','REPEAT_SAMPLE','VERIFICATION','ACKNOWLEDGED'].includes(alert.status) && alert.status !== 'CLOSED' && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <h3 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Verification & Closure
                </h3>
                <div className="space-y-2">
                  <select value={verResult} onChange={e => setVerResult(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'rgba(30,10,50,0.8)', border: '1px solid rgba(139,92,246,0.3)' }}>
                    <option value="FIT">Repeat Result: FIT</option>
                    <option value="UNFIT">Repeat Result: UNFIT</option>
                    <option value="UNSATISFACTORY">Repeat Result: UNSATISFACTORY</option>
                  </select>
                  <textarea value={verRemarks} onChange={e => setVerRemarks(e.target.value)}
                    placeholder="Verification remarks..."
                    rows={2} className="w-full px-3 py-2 rounded-lg text-white text-sm resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setVerDecision('CLOSE'); submitVerification(); }} disabled={saving}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: 'rgba(34,197,94,0.4)' }}>
                      {saving ? '...' : '✓ Close'}
                    </button>
                    <button onClick={() => { setVerDecision('ESCALATE'); submitVerification(); }} disabled={saving}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: 'rgba(239,68,68,0.4)' }}>
                      {saving ? '...' : '↑ Escalate'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {alert.status === 'CLOSED' && (
              <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <div className="text-green-300 font-bold">Alert Closed</div>
                <div className="text-white/50 text-sm mt-1">{fmt(alert.closed_at)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
