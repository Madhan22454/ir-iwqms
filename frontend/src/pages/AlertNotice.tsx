import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:8000/api/v1';

export default function AlertNotice() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (id) axios.get(`${API}/alerts/${id}/notice`).then(r => setData(r.data));
  }, [id]);

  if (!data) return <div className="p-8 text-center">Loading notice...</div>;

  const a = data.alert;
  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
  const fmtTime = (d: string) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
        @page { size: A4; margin: 20mm; }
      `}</style>

      {/* Print Button */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium">
          🖨 Print / Save as PDF
        </button>
        <button onClick={() => window.close()} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          Close
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8 bg-white text-black" style={{ fontFamily: 'Georgia, serif', minHeight: '100vh' }}>
        {/* Header */}
        <div className="text-center border-b-4 border-double border-gray-800 pb-6 mb-6">
          <div className="text-3xl font-black tracking-widest text-blue-900 mb-1">भारतीय रेलवे · INDIAN RAILWAYS</div>
          <div className="text-sm font-bold tracking-[0.3em] text-gray-600 mb-3">IR-IWQMS · INTEGRATED WATER QUALITY MONITORING & SURVEILLANCE SYSTEM</div>
          <div className="inline-block border-2 border-red-700 px-8 py-2">
            <div className="text-xl font-black text-red-700 tracking-widest">URGENT WATER QUALITY ALERT NOTICE</div>
          </div>
        </div>

        {/* Alert Meta */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div className="space-y-2">
            <Row label="Alert Number" value={a.alert_id} bold />
            <Row label="Severity" value={a.severity} bold red />
            <Row label="Date & Time" value={fmtTime(a.created_at)} />
            <Row label="Zone" value={a.zone_name} />
            <Row label="Division" value={a.division_name} />
            <Row label="Station" value={a.station_name} />
          </div>
          <div className="space-y-2">
            <Row label="Water Source ID" value={a.source_id_code} bold />
            <Row label="Source Type" value={a.source_type} />
            <Row label="Sample ID" value={a.source_id_code} />
            <Row label="Laboratory" value={a.lab_name} />
            <Row label="Sample Date" value={fmt(a.sample_date)} />
            <Row label="Report Date" value={fmt(a.report_date)} />
          </div>
        </div>

        {/* Result */}
        <div className="border-2 border-red-700 p-4 mb-6 bg-red-50 text-center">
          <div className="text-sm font-bold text-gray-700 mb-1 tracking-widest">WATER QUALITY TEST RESULT</div>
          <div className="text-4xl font-black text-red-700">{a.sample_result}</div>
          <div className="text-sm text-gray-600 mt-1">Source {a.source_id_code} has been declared {a.sample_result} for human consumption.</div>
        </div>

        {/* Failed Parameters */}
        {a.failed_parameters?.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-bold text-gray-800 border-b border-gray-400 pb-1 mb-3 tracking-wider">FAILED PARAMETERS</div>
            <table className="w-full text-sm border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  {['S.No', 'Parameter', 'Observed Value', 'Acceptable Limit', 'Result'].map(h => (
                    <th key={h} className="border border-gray-400 px-3 py-2 text-left font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.failed_parameters.map((fp: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-400 px-3 py-2">{i + 1}</td>
                    <td className="border border-gray-400 px-3 py-2 font-bold">{fp.name}</td>
                    <td className="border border-gray-400 px-3 py-2 text-red-700 font-bold">{fp.observed}</td>
                    <td className="border border-gray-400 px-3 py-2">{fp.limit || 'As per BIS IS 10500'}</td>
                    <td className="border border-gray-400 px-3 py-2 font-bold text-red-700">FAILED</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Responsible Officers */}
        {data.notifications?.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-bold text-gray-800 border-b border-gray-400 pb-1 mb-3 tracking-wider">RESPONSIBLE OFFICERS — NOTIFIED</div>
            <table className="w-full text-sm border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  {['S.No', 'Name', 'Designation / Role', 'Email'].map(h => (
                    <th key={h} className="border border-gray-400 px-3 py-2 text-left font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.notifications.map((n: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-400 px-3 py-2">{i + 1}</td>
                    <td className="border border-gray-400 px-3 py-2 font-bold">{n.name}</td>
                    <td className="border border-gray-400 px-3 py-2">{n.role?.replace(/_/g, ' ')}</td>
                    <td className="border border-gray-400 px-3 py-2 text-blue-800">{n.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Required Action */}
        <div className="mb-6 border border-gray-800 p-4 bg-yellow-50">
          <div className="text-sm font-bold text-gray-800 mb-3 tracking-wider">REQUIRED IMMEDIATE ACTION</div>
          <ol className="text-sm space-y-1 list-decimal list-inside text-gray-700">
            <li>Immediately stop usage of the affected water source ({a.source_id_code}) for drinking purposes.</li>
            <li>Investigate root cause of contamination / parameter failure.</li>
            <li>Initiate corrective action — disinfection, repair or infrastructure remedy.</li>
            <li>Arrange repeat sample collection from the same source.</li>
            <li>Submit repeat sample results to laboratory for verification.</li>
            <li>Update IR-IWQMS system with corrective action details and evidence.</li>
            <li>Alert shall be closed only upon satisfactory repeat sample result and officer verification.</li>
            <li>Escalate to higher authority if not resolved within 48 hours.</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-4 text-xs text-gray-600">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="font-bold mb-6">Issued By</div>
              <div className="border-t border-gray-600 pt-1">IR-IWQMS System / Central Admin</div>
            </div>
            <div className="text-center">
              <div className="font-bold mb-6">Verified By</div>
              <div className="border-t border-gray-600 pt-1">Authorised Officer</div>
            </div>
            <div className="text-right">
              <div className="font-bold mb-6">Received By</div>
              <div className="border-t border-gray-600 pt-1">Responsible Officer</div>
            </div>
          </div>
          <div className="text-center text-gray-400 mt-4">
            CONFIDENTIAL · IR-IWQMS · Generated: {new Date().toLocaleString('en-IN')} · Alert: {a.alert_id}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, bold, red }: { label: string; value: string; bold?: boolean; red?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-600 font-medium min-w-[130px]">{label}:</span>
      <span className={`${bold ? 'font-bold' : ''} ${red ? 'text-red-700' : ''}`}>{value}</span>
    </div>
  );
}
