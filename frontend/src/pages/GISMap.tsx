import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin } from 'lucide-react';

const API = 'http://localhost:8000/api/v1';

const STATUS_COLORS: Record<string, string> = {
  COMPLIANT: '#22c55e',
  UNSATISFACTORY: '#f59e0b',
  CORRECTIVE_ACTION: '#f97316',
  UNFIT: '#ef4444',
  OVERDUE: '#ef4444',
  PERSISTENT_FAILURE: '#7f1d1d',
  DUE: '#eab308',
};

const STATUS_LEGEND = [
  { label: 'Compliant', color: '#22c55e' },
  { label: 'Unsatisfactory', color: '#f59e0b' },
  { label: 'Unfit', color: '#ef4444' },
  { label: 'Overdue', color: '#ef4444' },
  { label: 'Persistent Failure', color: '#7f1d1d' },
  { label: 'Due Soon', color: '#eab308' },
];

export default function GISMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load Leaflet CSS + JS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const [wsRes, stnRes] = await Promise.all([
        axios.get(`${API}/hierarchy/water-sources/`),
        axios.get(`${API}/hierarchy/stations/`),
      ]);
      const stationMap: Record<number, any> = {};
      stnRes.data.forEach((s: any) => { stationMap[s.id] = s; });
      const mapped = wsRes.data.map((ws: any) => ({
        ...ws,
        station: stationMap[ws.station_id],
      }));
      setSources(mapped);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || sources.length === 0) return;
    if (mapInstanceRef.current) return; // Already initialized

    const L = (window as any).L;
    const map = L.map(mapRef.current).setView([12.5, 80.0], 7);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    sources.forEach(ws => {
      const lat = ws.gps_lat || ws.station?.gps_lat;
      const lng = ws.gps_long || ws.station?.gps_long;
      if (!lat || !lng) return;

      const color = STATUS_COLORS[ws.current_status] || '#6b7280';

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:18px; height:18px; border-radius:50%;
          background:${color}; border:2px solid white;
          box-shadow:0 0 6px ${color};
          ${ws.current_status === 'PERSISTENT_FAILURE' ? 'animation:pulse 1s infinite;' : ''}
        "></div>`,
        iconAnchor: [9, 9],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.on('click', () => setSelected(ws));
      marker.bindTooltip(`<b>${ws.source_id_code}</b><br/>${ws.current_status}`, { permanent: false });
    });
  }, [leafletLoaded, sources]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30">
            <MapPin className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">GIS Surveillance Map</h1>
            <p className="text-blue-300 text-sm">Real-time water source status across Southern Railway network</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {STATUS_LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}` }} />
              <span className="text-white/60 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Side panel */}
      <div className="flex-1 flex gap-4 px-6 pb-6">
        <div ref={mapRef} className="flex-1 rounded-2xl overflow-hidden" style={{ minHeight: '500px', border: '1px solid rgba(255,255,255,0.1)' }} />

        {selected && (
          <div className="w-72 rounded-2xl p-5 space-y-4 overflow-y-auto"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between">
              <h3 className="text-white font-bold">{selected.source_id_code}</h3>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white text-lg">×</button>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: `${STATUS_COLORS[selected.current_status]}20`,
                  color: STATUS_COLORS[selected.current_status],
                  border: `1px solid ${STATUS_COLORS[selected.current_status]}60`,
                }}>
                {selected.current_status}
              </div>
            </div>

            {[
              ['Type', selected.source_type],
              ['Station', selected.station?.name],
              ['Capacity', selected.capacity],
              ['Population', selected.population_served ? `${selected.population_served.toLocaleString()} people` : '—'],
              ['Disinfection', selected.disinfection_method],
              ['GPS', selected.gps_lat ? `${selected.gps_lat?.toFixed(4)}, ${selected.gps_long?.toFixed(4)}` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="text-sm">
                <span className="text-white/40">{k}: </span>
                <span className="text-white">{v || '—'}</span>
              </div>
            ))}

            <a href={`/healthcard`}
              className="block w-full py-2 rounded-lg text-center text-sm font-medium text-white transition-all"
              style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }}>
              View Health Card →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
