import { useState, useEffect } from 'react';
import axios from 'axios';
import { FlaskConical, AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';

const API = 'http://localhost:8000/api/v1';

interface Source { id: number; source_id_code: string; source_type: string; station?: any; }
interface Lab { id: number; name: string; code: string; }
interface Parameter { id: number; name: string; unit: string; category: string; is_qualitative: boolean; }

const STATUS_COLORS: Record<string, string> = {
  PASS: 'bg-green-100 text-green-800',
  FAIL: 'bg-red-100 text-red-800',
  ACCEPTABLE: 'bg-yellow-100 text-yellow-800',
  NOT_TESTED: 'bg-gray-100 text-gray-600',
};

const RESULT_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  FIT: { color: 'text-green-400', bg: 'bg-green-900/30 border-green-500', icon: '✓' },
  UNFIT: { color: 'text-red-400', bg: 'bg-red-900/40 border-red-500', icon: '✗' },
  UNSATISFACTORY: { color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-500', icon: '⚠' },
};

export default function LabResultEntry() {
  const [sources, setSources] = useState<Source[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>([]);

  // Form state
  const [sampleId, setSampleId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [sampleType, setSampleType] = useState('Bacteriological');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0, 16));
  const [collectorName, setCollectorName] = useState('');
  const [labId, setLabId] = useState('');
  const [labReportNumber, setLabReportNumber] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportRemarks, setReportRemarks] = useState('');

  // Parameter entries
  const [entries, setEntries] = useState<{ parameterId: string; value: string }[]>([
    { parameterId: '', value: '' },
  ]);

  // Result state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/hierarchy/water-sources/`).then(r => setSources(r.data));
    axios.get(`${API}/labs/laboratories/`).then(r => setLabs(r.data));
    axios.get(`${API}/master/parameters/`).then(r => setParameters(r.data));
  }, []);

  const addEntry = () => setEntries([...entries, { parameterId: '', value: '' }]);
  const removeEntry = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: 'parameterId' | 'value', val: string) => {
    const updated = [...entries];
    updated[i][field] = val;
    setEntries(updated);
  };

  const getParam = (id: string) => parameters.find(p => p.id === Number(id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !labId || !sampleId || !labReportNumber) {
      setError('Please fill in all required fields.');
      return;
    }
    const validEntries = entries.filter(e => e.parameterId && e.value.trim());
    if (validEntries.length === 0) {
      setError('Please add at least one parameter result.');
      return;
    }

    setError('');
    setSubmitting(true);
    setResult(null);

    try {
      // Step 1: Create sample
      const sampleRes = await axios.post(`${API}/labs/samples/`, {
        sample_id: sampleId,
        water_source_id: Number(sourceId),
        sample_type: sampleType,
        collection_date: new Date(collectionDate).toISOString(),
        collector_name: collectorName,
      });

      // Step 2: Submit report with results
      const reportPayload = {
        sample_id: sampleRes.data.id,
        laboratory_id: Number(labId),
        lab_report_number: labReportNumber,
        report_date: new Date(reportDate).toISOString(),
        remarks: reportRemarks,
        result_entries: validEntries.map(e => {
          const param = getParam(e.parameterId);
          return {
            parameter_id: Number(e.parameterId),
            observed_value: e.value.trim(),
            is_qualitative: param?.is_qualitative || false,
          };
        }),
      };

      const evalRes = await axios.post(`${API}/labs/reports/`, reportPayload);
      setResult(evalRes.data);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null); setError(''); setSampleId(''); setSourceId('');
    setLabId(''); setLabReportNumber(''); setCollectorName('');
    setEntries([{ parameterId: '', value: '' }]);
  };

  const rc = result ? RESULT_CONFIG[result.overall_result] : null;

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <FlaskConical className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Laboratory Result Entry</h1>
            <p className="text-blue-300 text-sm">Submit water sample test results — automatic evaluation & alert generation</p>
          </div>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sample Info */}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3">Sample Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-blue-300 font-medium block mb-1">Sample ID *</label>
                  <input value={sampleId} onChange={e => setSampleId(e.target.value)} placeholder="e.g. SMP-MAS-OW-2024-001"
                    className="w-full px-3 py-2 rounded-lg text-white text-sm" required
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }} />
                </div>
                <div>
                  <label className="text-xs text-blue-300 font-medium block mb-1">Water Source *</label>
                  <select value={sourceId} onChange={e => setSourceId(e.target.value)} required
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'rgba(30,27,75,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <option value="">Select Water Source</option>
                    {sources.map(s => (
                      <option key={s.id} value={s.id}>{s.source_id_code} — {s.source_type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-blue-300 font-medium block mb-1">Sample Type *</label>
                  <select value={sampleType} onChange={e => setSampleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'rgba(30,27,75,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <option>Bacteriological</option>
                    <option>Chemical</option>
                    <option>Physical</option>
                    <option>Comprehensive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-blue-300 font-medium block mb-1">Collection Date & Time *</label>
                  <input type="datetime-local" value={collectionDate} onChange={e => setCollectionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }} />
                </div>
                <div>
                  <label className="text-xs text-blue-300 font-medium block mb-1">Collector Name</label>
                  <input value={collectorName} onChange={e => setCollectorName(e.target.value)} placeholder="Name of field collector"
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }} />
                </div>
              </div>
            </div>

            {/* Lab Report Info */}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3">Laboratory Report Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-blue-300 font-medium block mb-1">Laboratory *</label>
                  <select value={labId} onChange={e => setLabId(e.target.value)} required
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'rgba(30,27,75,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <option value="">Select Laboratory</option>
                    {labs.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-blue-300 font-medium block mb-1">Lab Report Number *</label>
                  <input value={labReportNumber} onChange={e => setLabReportNumber(e.target.value)} placeholder="e.g. SR-WTL/2024/B/001"
                    className="w-full px-3 py-2 rounded-lg text-white text-sm" required
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }} />
                </div>
                <div>
                  <label className="text-xs text-blue-300 font-medium block mb-1">Report Date *</label>
                  <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }} />
                </div>
                <div>
                  <label className="text-xs text-blue-300 font-medium block mb-1">Remarks</label>
                  <input value={reportRemarks} onChange={e => setReportRemarks(e.target.value)} placeholder="Any additional remarks"
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }} />
                </div>
              </div>
            </div>

            {/* Parameter Results */}
            <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-lg font-semibold text-white">Parameter Results</h2>
                <button type="button" onClick={addEntry}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/20 transition-colors">
                  <Plus className="w-4 h-4" /> Add Parameter
                </button>
              </div>

              <div className="space-y-3">
                {entries.map((entry, i) => {
                  const param = getParam(entry.parameterId);
                  return (
                    <div key={i} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-blue-300 mb-1 block">Parameter</label>
                        <select value={entry.parameterId} onChange={e => updateEntry(i, 'parameterId', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-white text-sm"
                          style={{ background: 'rgba(30,27,75,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <option value="">Select Parameter</option>
                          {parameters.map(p => (
                            <option key={p.id} value={p.id}>{p.name} {p.unit ? `(${p.unit})` : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-blue-300 mb-1 block">
                          Observed Value {param?.is_qualitative ? '— qualitative' : param?.unit ? `(${param.unit})` : ''}
                        </label>
                        {param?.is_qualitative ? (
                          <select value={entry.value} onChange={e => updateEntry(i, 'value', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-white text-sm"
                            style={{ background: 'rgba(30,27,75,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}>
                            <option value="">Select</option>
                            <option value="NOT DETECTED">NOT DETECTED (Absent)</option>
                            <option value="DETECTED">DETECTED (Present)</option>
                          </select>
                        ) : (
                          <input type="text" value={entry.value} onChange={e => updateEntry(i, 'value', e.target.value)}
                            placeholder="Numeric value"
                            className="w-full px-3 py-2 rounded-lg text-white text-sm"
                            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }} />
                        )}
                      </div>
                      <button type="button" onClick={() => removeEntry(i)} disabled={entries.length === 1}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-900/30 border border-red-500/40 text-red-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: submitting ? '#4b5563' : 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Evaluating...</> : 'Submit Laboratory Report'}
            </button>
          </form>
        ) : (
          /* Result Panel */
          <div className="space-y-6">
            {/* Overall Result Banner */}
            <div className={`rounded-2xl p-6 border-2 ${rc?.bg}`}>
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${rc?.color}`}>{rc?.icon}</div>
                <div>
                  <div className="text-sm text-white/60 uppercase tracking-widest">Overall Result</div>
                  <div className={`text-3xl font-bold ${rc?.color}`}>{result.overall_result}</div>
                  <div className="text-white/70 text-sm mt-1">{result.evaluation_summary}</div>
                </div>
                {result.alert_created && (
                  <div className="ml-auto text-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/50 border border-red-500">
                      <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                      <span className="text-red-300 font-bold text-sm">CRITICAL ALERT GENERATED</span>
                    </div>
                    <div className="text-red-400 font-mono text-lg mt-1">{result.alert_id}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-created records */}
            {result.alert_created && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Alert', value: result.alert_id, color: 'red' },
                  { label: 'Corrective Action', value: result.corrective_action_id, color: 'amber' },
                  { label: 'Repeat Sample', value: result.repeat_sample_id, color: 'blue' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-4 text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">{item.label}</div>
                    <div className={`font-mono font-bold text-${item.color}-400`}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
            )}

            {result.alert_created && (
              <div className="rounded-xl p-4 bg-amber-900/20 border border-amber-500/30 text-amber-300 text-sm">
                <strong>{result.officers_notified} officer(s)</strong> have been automatically notified (SIMULATED).
                Corrective action and repeat sample tasks have been created automatically.
              </div>
            )}

            {/* Parameter Table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="px-6 py-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <h3 className="text-white font-semibold">Parameter Evaluation Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Parameter', 'Observed Value', 'Acceptable Limit', 'Permissible Limit', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-blue-300 font-medium text-xs uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.parameter_results.map((pr: any, i: number) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="px-4 py-3 text-white font-medium">{pr.parameter_name}
                          {pr.unit && <span className="text-white/40 text-xs ml-1">({pr.unit})</span>}
                        </td>
                        <td className={`px-4 py-3 font-mono font-bold ${pr.status === 'FAIL' ? 'text-red-400' : 'text-white'}`}>
                          {pr.observed}
                        </td>
                        <td className="px-4 py-3 text-white/60">{pr.acceptable_limit || '—'}</td>
                        <td className="px-4 py-3 text-white/60">{pr.permissible_limit || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[pr.status] || 'bg-gray-100 text-gray-600'}`}>
                            {pr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={resetForm}
                className="flex-1 py-3 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-all">
                Submit Another Report
              </button>
              {result.alert_created && (
                <a href="/alerts"
                  className="flex-1 py-3 rounded-xl font-semibold text-white text-center transition-all"
                  style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)' }}>
                  View Alert Centre →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
