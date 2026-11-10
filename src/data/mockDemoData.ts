// IR-IWQMS Realistic Seeded Demo Dataset
// Covers 16 Zonal Railways, 68 Divisions, 200+ Stations, 30+ Live Alerts, 6-Month Lab Quality Records
import { ALL_INDIAN_RAIL_STATIONS } from './allIndianRailStations';

export interface DemoZone {
  id: number;
  code: string;
  name: string;
  headquarters: string;
}

export interface DemoDivision {
  id: number;
  code: string;
  name: string;
  zone_code: string;
  zone_id: number;
}

export interface DemoStation {
  id: number;
  code: string;
  name: string;
  category: string; // NSG1 - NSG6
  zone_code: string;
  division_code: string;
  lat: number;
  lng: number;
  isJunction?: boolean;
  water_sources_count: number;
  status: 'COMPLIANT' | 'DUE' | 'OVERDUE' | 'UNFIT' | 'PERSISTENT';
  last_test_date: string;
  chlorine_ppm: number;
  coliform_cfu: number;
  ph: number;
  turbidity_ntu: number;
  tds_ppm: number;
}

export interface DemoAlert {
  id: number;
  alert_id: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  source_id_code: string;
  station_code: string;
  station_name: string;
  division_name: string;
  zone_name: string;
  source_type: string;
  parameter_name: string;
  sample_value: string;
  permissible_limit: string;
  sample_date: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  escalation_level: 1 | 2 | 3;
  escalated_to: 'Division (Sr.DEN/DMO)' | 'Zonal HQ (PCE/PCMD)' | 'Railway Board (ED/EnHM)';
  hours_remaining: number;
  max_hours: number;
  created_at: string;
  due_date: string;
  is_escalated: boolean;
}

export interface DemoLabReport {
  id: number;
  report_id: string;
  sample_id: string;
  station_name: string;
  station_code: string;
  source_type: string;
  location_detail: string;
  overall_result: 'FIT' | 'UNFIT' | 'POTABLE_SAFE' | 'CONTAMINATED';
  report_date: string;
  tested_by: string;
  chlorine: number;
  turbidity: number;
  ph: number;
  coliform: number;
  tds: number;
  chlorine_fit: boolean;
  turbidity_fit: boolean;
  ph_fit: boolean;
  coliform_fit: boolean;
}

export const DEMO_ZONES: DemoZone[] = [
  { id: 1, code: 'NR', name: 'Northern Railway', headquarters: 'New Delhi' },
  { id: 2, code: 'SR', name: 'Southern Railway', headquarters: 'Chennai' },
  { id: 3, code: 'CR', name: 'Central Railway', headquarters: 'Mumbai CSMT' },
  { id: 4, code: 'WR', name: 'Western Railway', headquarters: 'Mumbai Churchgate' },
  { id: 5, code: 'ER', name: 'Eastern Railway', headquarters: 'Kolkata' },
  { id: 6, code: 'SER', name: 'South Eastern Railway', headquarters: 'Kolkata' },
  { id: 7, code: 'ECR', name: 'East Central Railway', headquarters: 'Hajipur' },
  { id: 8, code: 'NCR', name: 'North Central Railway', headquarters: 'Prayagraj' },
  { id: 9, code: 'NER', name: 'North Eastern Railway', headquarters: 'Gorakhpur' },
  { id: 10, code: 'NFR', name: 'Northeast Frontier Railway', headquarters: 'Maligaon, Guwahati' },
  { id: 11, code: 'NWR', name: 'North Western Railway', headquarters: 'Jaipur' },
  { id: 12, code: 'SCR', name: 'South Central Railway', headquarters: 'Secunderabad' },
  { id: 13, code: 'SECR', name: 'South East Central Railway', headquarters: 'Bilaspur' },
  { id: 14, code: 'SWR', name: 'South Western Railway', headquarters: 'Hubballi' },
  { id: 15, code: 'WCR', name: 'West Central Railway', headquarters: 'Jabalpur' },
  { id: 16, code: 'ECoR', name: 'East Coast Railway', headquarters: 'Bhubaneswar' },
];

export const DEMO_DIVISIONS: DemoDivision[] = [
  // SR
  { id: 1, code: 'MAS', name: 'Chennai Division', zone_code: 'SR', zone_id: 2 },
  { id: 2, code: 'MDU', name: 'Madurai Division', zone_code: 'SR', zone_id: 2 },
  { id: 3, code: 'TPJ', name: 'Tiruchchirappalli Division', zone_code: 'SR', zone_id: 2 },
  { id: 4, code: 'SA', name: 'Salem Division', zone_code: 'SR', zone_id: 2 },
  { id: 5, code: 'PGT', name: 'Palakkad Division', zone_code: 'SR', zone_id: 2 },
  { id: 6, code: 'TVC', name: 'Thiruvananthapuram Division', zone_code: 'SR', zone_id: 2 },
  // NR
  { id: 7, code: 'DLI', name: 'Delhi Division', zone_code: 'NR', zone_id: 1 },
  { id: 8, code: 'FZR', name: 'Firozpur Division', zone_code: 'NR', zone_id: 1 },
  { id: 9, code: 'LKO', name: 'Lucknow NR Division', zone_code: 'NR', zone_id: 1 },
  { id: 10, code: 'MB', name: 'Moradabad Division', zone_code: 'NR', zone_id: 1 },
  { id: 11, code: 'UMB', name: 'Ambala Division', zone_code: 'NR', zone_id: 1 },
  // CR
  { id: 12, code: 'BB', name: 'Mumbai CR Division', zone_code: 'CR', zone_id: 3 },
  { id: 13, code: 'BSL', name: 'Bhusawal Division', zone_code: 'CR', zone_id: 3 },
  { id: 14, code: 'NGP', name: 'Nagpur CR Division', zone_code: 'CR', zone_id: 3 },
  { id: 15, code: 'PUNE', name: 'Pune Division', zone_code: 'CR', zone_id: 3 },
  { id: 16, code: 'SUR', name: 'Solapur Division', zone_code: 'CR', zone_id: 3 },
  // WR
  { id: 17, code: 'MMCT', name: 'Mumbai WR Division', zone_code: 'WR', zone_id: 4 },
  { id: 18, code: 'BRC', name: 'Vadodara Division', zone_code: 'WR', zone_id: 4 },
  { id: 19, code: 'ADI', name: 'Ahmedabad Division', zone_code: 'WR', zone_id: 4 },
  { id: 20, code: 'RTM', name: 'Ratlam Division', zone_code: 'WR', zone_id: 4 },
  { id: 21, code: 'RJT', name: 'Rajkot Division', zone_code: 'WR', zone_id: 4 },
  { id: 22, code: 'BVP', name: 'Bhavnagar Division', zone_code: 'WR', zone_id: 4 },
  // ER
  { id: 23, code: 'HWH', name: 'Howrah Division', zone_code: 'ER', zone_id: 5 },
  { id: 24, code: 'SDAH', name: 'Sealdah Division', zone_code: 'ER', zone_id: 5 },
  { id: 25, code: 'ASN', name: 'Asansol Division', zone_code: 'ER', zone_id: 5 },
  { id: 26, code: 'MLDT', name: 'Malda Town Division', zone_code: 'ER', zone_id: 5 },
  // SER
  { id: 27, code: 'KGP', name: 'Kharagpur Division', zone_code: 'SER', zone_id: 6 },
  { id: 28, code: 'ADRA', name: 'Adra Division', zone_code: 'SER', zone_id: 6 },
  { id: 29, code: 'CKP', name: 'Chakradharpur Division', zone_code: 'SER', zone_id: 6 },
  { id: 30, code: 'RNC', name: 'Ranchi Division', zone_code: 'SER', zone_id: 6 },
  // ECR
  { id: 31, code: 'DNR', name: 'Danapur Division', zone_code: 'ECR', zone_id: 7 },
  { id: 32, code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Division', zone_code: 'ECR', zone_id: 7 },
  { id: 33, code: 'DHN', name: 'Dhanbad Division', zone_code: 'ECR', zone_id: 7 },
  { id: 34, code: 'SEE', name: 'Sonpur Division', zone_code: 'ECR', zone_id: 7 },
  { id: 35, code: 'SPJ', name: 'Samastipur Division', zone_code: 'ECR', zone_id: 7 },
  // NCR
  { id: 36, code: 'PRYJ', name: 'Prayagraj Division', zone_code: 'NCR', zone_id: 8 },
  { id: 37, code: 'JHS', name: 'Jhansi (Virangana Lakshmibai) Division', zone_code: 'NCR', zone_id: 8 },
  { id: 38, code: 'AGC', name: 'Agra Division', zone_code: 'NCR', zone_id: 8 },
  // NER
  { id: 39, code: 'IZN', name: 'Izzatnagar Division', zone_code: 'NER', zone_id: 9 },
  { id: 40, code: 'LJN', name: 'Lucknow NER Division', zone_code: 'NER', zone_id: 9 },
  { id: 41, code: 'BSB', name: 'Varanasi Division', zone_code: 'NER', zone_id: 9 },
  // NFR
  { id: 42, code: 'KIR', name: 'Katihar Division', zone_code: 'NFR', zone_id: 10 },
  { id: 43, code: 'APDJ', name: 'Alipurduar Division', zone_code: 'NFR', zone_id: 10 },
  { id: 44, code: 'RNY', name: 'Rangiya Division', zone_code: 'NFR', zone_id: 10 },
  { id: 45, code: 'LMG', name: 'Lumding Division', zone_code: 'NFR', zone_id: 10 },
  { id: 46, code: 'TSK', name: 'Tinsukia Division', zone_code: 'NFR', zone_id: 10 },
  // NWR
  { id: 47, code: 'JP', name: 'Jaipur Division', zone_code: 'NWR', zone_id: 11 },
  { id: 48, code: 'AII', name: 'Ajmer Division', zone_code: 'NWR', zone_id: 11 },
  { id: 49, code: 'JU', name: 'Jodhpur Division', zone_code: 'NWR', zone_id: 11 },
  { id: 50, code: 'BKN', name: 'Bikaner Division', zone_code: 'NWR', zone_id: 11 },
  // SCR
  { id: 51, code: 'SC', name: 'Secunderabad Division', zone_code: 'SCR', zone_id: 12 },
  { id: 52, code: 'HYB', name: 'Hyderabad Division', zone_code: 'SCR', zone_id: 12 },
  { id: 53, code: 'BZA', name: 'Vijayawada Division', zone_code: 'SCR', zone_id: 12 },
  { id: 54, code: 'GNT', name: 'Guntur Division', zone_code: 'SCR', zone_id: 12 },
  { id: 55, code: 'GTL', name: 'Guntakal Division', zone_code: 'SCR', zone_id: 12 },
  { id: 56, code: 'NED', name: 'Nanded Division', zone_code: 'SCR', zone_id: 12 },
  // SECR
  { id: 57, code: 'BSP', name: 'Bilaspur Division', zone_code: 'SECR', zone_id: 13 },
  { id: 58, code: 'R', name: 'Raipur Division', zone_code: 'SECR', zone_id: 13 },
  { id: 59, code: 'NGP-SECR', name: 'Nagpur SECR Division', zone_code: 'SECR', zone_id: 13 },
  // SWR
  { id: 60, code: 'UBL', name: 'Hubballi Division', zone_code: 'SWR', zone_id: 14 },
  { id: 61, code: 'SBC', name: 'Bengaluru Division', zone_code: 'SWR', zone_id: 14 },
  { id: 62, code: 'MYS', name: 'Mysuru Division', zone_code: 'SWR', zone_id: 14 },
  // WCR
  { id: 63, code: 'JBP', name: 'Jabalpur Division', zone_code: 'WCR', zone_id: 15 },
  { id: 64, code: 'BPL', name: 'Bhopal Division', zone_code: 'WCR', zone_id: 15 },
  { id: 65, code: 'KOTA', name: 'Kota Division', zone_code: 'WCR', zone_id: 15 },
  // ECoR
  { id: 66, code: 'KUR', name: 'Khurda Road Division', zone_code: 'ECoR', zone_id: 16 },
  { id: 67, code: 'WAT', name: 'Waltair Division', zone_code: 'ECoR', zone_id: 16 },
  { id: 68, code: 'SBP', name: 'Sambalpur Division', zone_code: 'ECoR', zone_id: 16 },
];

// Helper to determine status deterministically for demo stations
const STATUS_DISTRIBUTION: Array<'COMPLIANT' | 'DUE' | 'OVERDUE' | 'UNFIT' | 'PERSISTENT'> = [
  'COMPLIANT', 'COMPLIANT', 'COMPLIANT', 'COMPLIANT', 'COMPLIANT', 'COMPLIANT', 'COMPLIANT',
  'COMPLIANT', 'COMPLIANT', 'COMPLIANT', 'COMPLIANT', 'COMPLIANT', 'COMPLIANT', 'COMPLIANT',
  'DUE', 'DUE', 'DUE',
  'OVERDUE', 'OVERDUE',
  'UNFIT',
  'PERSISTENT',
];

export const DEMO_STATIONS: DemoStation[] = ALL_INDIAN_RAIL_STATIONS.map((stn, idx) => {
  const div = DEMO_DIVISIONS[idx % DEMO_DIVISIONS.length];
  const status = STATUS_DISTRIBUTION[idx % STATUS_DISTRIBUTION.length];
  const catNum = (idx % 6) + 1;
  const chlorine = status === 'UNFIT' ? 0.08 : status === 'PERSISTENT' ? 0.02 : 0.45 + (idx % 5) * 0.1;
  const coliform = status === 'UNFIT' ? 14 : status === 'PERSISTENT' ? 28 : 0;
  const ph = status === 'UNFIT' ? 5.8 : 7.2 + (idx % 6) * 0.1;

  return {
    id: idx + 1,
    code: stn.code,
    name: stn.name,
    category: `NSG${catNum}`,
    zone_code: div.zone_code,
    division_code: div.code,
    lat: stn.lat,
    lng: stn.lng,
    isJunction: stn.isJunction,
    water_sources_count: 3 + (idx % 8),
    status,
    last_test_date: new Date(Date.now() - (idx % 14) * 86400000).toISOString().split('T')[0],
    chlorine_ppm: Number(chlorine.toFixed(2)),
    coliform_cfu: coliform,
    ph: Number(ph.toFixed(1)),
    turbidity_ntu: status === 'UNFIT' ? 7.6 : 1.4 + (idx % 4) * 0.3,
    tds_ppm: 280 + (idx % 12) * 45,
  };
});

export const DEMO_ALERTS: DemoAlert[] = [
  {
    id: 101,
    alert_id: 'ALT-MAS-2026-081',
    severity: 'CRITICAL',
    source_id_code: 'WS-MAS-DW03',
    station_code: 'MAS',
    station_name: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central (Chennai Central)',
    division_name: 'Chennai Division',
    zone_name: 'Southern Railway',
    source_type: 'Deep Borewell #3 (Platform 11-12 Feeder)',
    parameter_name: 'Fecal Coliform & E. Coli',
    sample_value: '18 CFU / 100 mL',
    permissible_limit: '0 CFU / 100 mL (IS 10500:2012)',
    sample_date: '2026-11-09',
    status: 'OPEN',
    escalation_level: 2,
    escalated_to: 'Zonal HQ (PCE/PCMD)',
    hours_remaining: 18,
    max_hours: 96,
    created_at: '2026-11-09T08:30:00Z',
    due_date: '2026-11-11T08:30:00Z',
    is_escalated: true,
  },
  {
    id: 102,
    alert_id: 'ALT-NDLS-2026-042',
    severity: 'CRITICAL',
    source_id_code: 'WS-NDLS-RO01',
    station_code: 'NDLS',
    station_name: 'New Delhi',
    division_name: 'Delhi Division',
    zone_name: 'Northern Railway',
    source_type: 'RO Plant #1 Outlet (Ajmeri Gate Side)',
    parameter_name: 'Free Residual Chlorine',
    sample_value: '0.04 mg/L',
    permissible_limit: 'Min 0.20 mg/L',
    sample_date: '2026-11-09',
    status: 'ESCALATED',
    escalation_level: 3,
    escalated_to: 'Railway Board (ED/EnHM)',
    hours_remaining: 8,
    max_hours: 144,
    created_at: '2026-11-08T14:15:00Z',
    due_date: '2026-11-10T14:15:00Z',
    is_escalated: true,
  },
  {
    id: 103,
    alert_id: 'ALT-HWH-2026-119',
    severity: 'CRITICAL',
    source_id_code: 'WS-HWH-TK02',
    station_code: 'HWH',
    station_name: 'Howrah Jn',
    division_name: 'Howrah Division',
    zone_name: 'Eastern Railway',
    source_type: 'Overhead Reservoir #2 (Cab Road)',
    parameter_name: 'Turbidity & Suspended Solids',
    sample_value: '8.4 NTU',
    permissible_limit: 'Max 5.0 NTU',
    sample_date: '2026-11-09',
    status: 'OPEN',
    escalation_level: 1,
    escalated_to: 'Division (Sr.DEN/DMO)',
    hours_remaining: 32,
    max_hours: 48,
    created_at: '2026-11-09T18:00:00Z',
    due_date: '2026-11-11T18:00:00Z',
    is_escalated: false,
  },
  {
    id: 104,
    alert_id: 'ALT-CSMT-2026-077',
    severity: 'MAJOR',
    source_id_code: 'WS-CSMT-HY08',
    station_code: 'CSMT',
    station_name: 'Chhatrapati Shivaji Maharaj Terminus (Mumbai)',
    division_name: 'Mumbai CR Division',
    zone_name: 'Central Railway',
    source_type: 'Train Watering Hydrant Post #8',
    parameter_name: 'Total Dissolved Solids (TDS)',
    sample_value: '1850 mg/L',
    permissible_limit: 'Max 2000 mg/L (Alert at 1500)',
    sample_date: '2026-11-08',
    status: 'IN_PROGRESS',
    escalation_level: 1,
    escalated_to: 'Division (Sr.DEN/DMO)',
    hours_remaining: 24,
    max_hours: 48,
    created_at: '2026-11-08T11:20:00Z',
    due_date: '2026-11-10T11:20:00Z',
    is_escalated: false,
  },
  {
    id: 105,
    alert_id: 'ALT-BRC-2026-033',
    severity: 'MAJOR',
    source_id_code: 'WS-BRC-DW01',
    station_code: 'BRC',
    station_name: 'Vadodara Jn',
    division_name: 'Vadodara Division',
    zone_name: 'Western Railway',
    source_type: 'Submersible Well Pump #1',
    parameter_name: 'pH Alkaline Deviation',
    sample_value: '8.9 pH',
    permissible_limit: '6.5 - 8.5 pH',
    sample_date: '2026-11-08',
    status: 'OPEN',
    escalation_level: 2,
    escalated_to: 'Zonal HQ (PCE/PCMD)',
    hours_remaining: 42,
    max_hours: 96,
    created_at: '2026-11-08T09:00:00Z',
    due_date: '2026-11-12T09:00:00Z',
    is_escalated: true,
  },
  {
    id: 106,
    alert_id: 'ALT-SBC-2026-061',
    severity: 'MINOR',
    source_id_code: 'WS-SBC-COOL04',
    station_code: 'SBC',
    station_name: 'KSR Bengaluru City',
    division_name: 'Bengaluru Division',
    zone_name: 'South Western Railway',
    source_type: 'Water Cooler PF 3-4',
    parameter_name: 'Total Hardness (as CaCO3)',
    sample_value: '440 mg/L',
    permissible_limit: 'Max 600 mg/L (Threshold 400)',
    sample_date: '2026-11-07',
    status: 'OPEN',
    escalation_level: 1,
    escalated_to: 'Division (Sr.DEN/DMO)',
    hours_remaining: 14,
    max_hours: 48,
    created_at: '2026-11-07T16:00:00Z',
    due_date: '2026-11-09T16:00:00Z',
    is_escalated: false,
  },
  {
    id: 107,
    alert_id: 'ALT-PNBE-2026-095',
    severity: 'CRITICAL',
    source_id_code: 'WS-PNBE-MC02',
    station_code: 'PNBE',
    station_name: 'Patna Jn',
    division_name: 'Danapur Division',
    zone_name: 'East Central Railway',
    source_type: 'Municipal River Intake Valve #2',
    parameter_name: 'Total Coliform Bacterial Load',
    sample_value: '24 CFU / 100 mL',
    permissible_limit: '0 CFU / 100 mL',
    sample_date: '2026-11-09',
    status: 'OPEN',
    escalation_level: 2,
    escalated_to: 'Zonal HQ (PCE/PCMD)',
    hours_remaining: 52,
    max_hours: 96,
    created_at: '2026-11-09T10:45:00Z',
    due_date: '2026-11-13T10:45:00Z',
    is_escalated: true,
  },
  {
    id: 108,
    alert_id: 'ALT-GHY-2026-018',
    severity: 'MAJOR',
    source_id_code: 'WS-GHY-OHT01',
    station_code: 'GHY',
    station_name: 'Guwahati',
    division_name: 'Lumding Division',
    zone_name: 'Northeast Frontier Railway',
    source_type: 'Main Zonal Tanker Sump',
    parameter_name: 'Residual Chlorine Depletion',
    sample_value: '0.08 mg/L',
    permissible_limit: 'Min 0.20 mg/L',
    sample_date: '2026-11-08',
    status: 'OPEN',
    escalation_level: 1,
    escalated_to: 'Division (Sr.DEN/DMO)',
    hours_remaining: 36,
    max_hours: 48,
    created_at: '2026-11-08T15:30:00Z',
    due_date: '2026-11-10T15:30:00Z',
    is_escalated: false,
  },
  {
    id: 109,
    alert_id: 'ALT-BZA-2026-052',
    severity: 'CRITICAL',
    source_id_code: 'WS-BZA-DW04',
    station_code: 'BZA',
    station_name: 'Vijayawada Jn',
    division_name: 'Vijayawada Division',
    zone_name: 'South Central Railway',
    source_type: 'Deep Borewell North Yard',
    parameter_name: 'Coliform Positive + Turbidity',
    sample_value: '16 CFU / 100 mL',
    permissible_limit: '0 CFU / 100 mL',
    sample_date: '2026-11-07',
    status: 'ESCALATED',
    escalation_level: 3,
    escalated_to: 'Railway Board (ED/EnHM)',
    hours_remaining: 12,
    max_hours: 144,
    created_at: '2026-11-07T09:10:00Z',
    due_date: '2026-11-10T09:10:00Z',
    is_escalated: true,
  },
  {
    id: 110,
    alert_id: 'ALT-ASR-2026-029',
    severity: 'MINOR',
    source_id_code: 'WS-ASR-HY03',
    station_code: 'ASR',
    station_name: 'Amritsar Jn',
    division_name: 'Firozpur Division',
    zone_name: 'Northern Railway',
    source_type: 'Coach Watering Line 4',
    parameter_name: 'Marginal Chlorine Variance',
    sample_value: '0.18 mg/L',
    permissible_limit: 'Min 0.20 mg/L',
    sample_date: '2026-11-09',
    status: 'OPEN',
    escalation_level: 1,
    escalated_to: 'Division (Sr.DEN/DMO)',
    hours_remaining: 44,
    max_hours: 48,
    created_at: '2026-11-09T17:15:00Z',
    due_date: '2026-11-11T17:15:00Z',
    is_escalated: false,
  },
];

export const DEMO_MONTHLY_TRENDS = [
  { month: 'Jun 2026', totalTests: 1840, potableFit: 1690, compliancePct: 91.8, criticalAlerts: 32 },
  { month: 'Jul 2026', totalTests: 1980, potableFit: 1782, compliancePct: 90.0, criticalAlerts: 41 },
  { month: 'Aug 2026', totalTests: 2150, potableFit: 1913, compliancePct: 89.0, criticalAlerts: 48 },
  { month: 'Sep 2026', totalTests: 2280, potableFit: 2108, compliancePct: 92.5, criticalAlerts: 26 },
  { month: 'Oct 2026', totalTests: 2420, potableFit: 2270, compliancePct: 93.8, criticalAlerts: 18 },
  { month: 'Nov 2026 (MTD)', totalTests: 980, potableFit: 924, compliancePct: 94.3, criticalAlerts: 8 },
];

export const DEMO_DASHBOARD_SUMMARY = {
  infrastructure: {
    zones: 16,
    divisions: 68,
    stations: DEMO_STATIONS.length,
    water_sources: DEMO_STATIONS.reduce((acc, s) => acc + s.water_sources_count, 0),
  },
  water_quality: {
    compliant: DEMO_STATIONS.filter(s => s.status === 'COMPLIANT').length,
    due: DEMO_STATIONS.filter(s => s.status === 'DUE').length,
    overdue: DEMO_STATIONS.filter(s => s.status === 'OVERDUE').length,
    unfit: DEMO_STATIONS.filter(s => s.status === 'UNFIT').length,
    persistent_failure: DEMO_STATIONS.filter(s => s.status === 'PERSISTENT').length,
    unsatisfactory: DEMO_STATIONS.filter(s => s.status === 'UNFIT' || s.status === 'PERSISTENT').length,
  },
  operations: {
    open_alerts: 28,
    escalated_alerts: 9,
    open_corrective_actions: 14,
    disinfection_due: 19,
    repeat_samples_pending: 7,
  },
  recent_alerts: DEMO_ALERTS.slice(0, 8),
  monthly_trends: DEMO_MONTHLY_TRENDS,
};

export const IS_DEMO_ACTIVE = true;

