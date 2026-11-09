// Important Broad Gauge Railway Trunk Routes of Indian Railways
// Derived from official Indian Railways Network Maps

export interface RailwayRoute {
  id: string;
  name: string;
  gauge: 'BROAD_GAUGE';
  color: string;
  coordinates: [number, number][]; // [Lat, Lng]
}

export const INDIAN_RAILWAY_TRUNK_CORRIDORS: RailwayRoute[] = [
  {
    id: 'gt-route',
    name: 'Grand Trunk Corridor (Delhi - Nagpur - Chennai)',
    gauge: 'BROAD_GAUGE',
    color: '#3b82f6',
    coordinates: [
      [28.6424, 77.2195], // New Delhi
      [27.4924, 77.6737], // Mathura
      [27.1767, 78.0081], // Agra
      [26.2183, 78.1828], // Gwalior
      [25.4484, 78.5685], // Jhansi
      [23.2685, 77.4126], // Bhopal
      [22.6120, 77.7600], // Itarsi
      [21.1524, 79.0888], // Nagpur
      [19.8519, 79.3516], // Balharshah
      [17.9800, 79.5200], // Kazipet
      [16.5186, 80.6195], // Vijayawada
      [14.4426, 79.9865], // Nellore
      [13.0827, 80.2755], // Chennai Central
    ]
  },
  {
    id: 'western-corridor',
    name: 'Western Trunk Route (Delhi - Jaipur - Ahmedabad - Mumbai)',
    gauge: 'BROAD_GAUGE',
    color: '#06b6d4',
    coordinates: [
      [28.6424, 77.2195], // New Delhi
      [28.2000, 76.6000], // Rewari
      [26.9196, 75.7878], // Jaipur
      [26.4499, 74.6399], // Ajmer
      [25.1000, 73.8000], // Marwar
      [24.5854, 73.7125], // Abu Road
      [23.0232, 72.6006], // Ahmedabad
      [22.3107, 73.1812], // Vadodara
      [21.2049, 72.8411], // Surat
      [18.9696, 72.8193], // Mumbai Central
    ]
  },
  {
    id: 'eastern-corridor',
    name: 'Eastern Trunk Route (Delhi - Kanpur - Patna - Howrah)',
    gauge: 'BROAD_GAUGE',
    color: '#8b5cf6',
    coordinates: [
      [28.6424, 77.2195], // New Delhi
      [27.8974, 78.0880], // Aligarh
      [26.4547, 80.3507], // Kanpur Central
      [25.4358, 81.8463], // Prayagraj
      [25.3276, 82.9863], // Varanasi
      [25.2818, 83.1186], // DDU Junction
      [25.6022, 85.1376], // Patna Junction
      [23.6871, 86.9746], // Asansol
      [22.5838, 88.3426], // Howrah
    ]
  },
  {
    id: 'central-howrah',
    name: 'Central East-West Route (Mumbai - Nagpur - Howrah)',
    gauge: 'BROAD_GAUGE',
    color: '#f59e0b',
    coordinates: [
      [18.9400, 72.8354], // Mumbai CSMT
      [19.2437, 73.1355], // Kalyan
      [19.9975, 73.7898], // Nashik
      [21.0455, 75.7885], // Bhusawal
      [20.7002, 77.0082], // Akola
      [21.1524, 79.0888], // Nagpur
      [21.2514, 81.6296], // Raipur
      [22.0797, 82.1409], // Bilaspur
      [22.2604, 84.8536], // Rourkela
      [22.7699, 86.2029], // Tatanagar
      [22.3392, 87.3255], // Kharagpur
      [22.5838, 88.3426], // Howrah
    ]
  },
  {
    id: 'east-coast-corridor',
    name: 'East Coast Corridor (Howrah - Bhubaneswar - Chennai)',
    gauge: 'BROAD_GAUGE',
    color: '#10b981',
    coordinates: [
      [22.5838, 88.3426], // Howrah
      [22.3392, 87.3255], // Kharagpur
      [21.4934, 86.9135], // Balasore
      [20.4625, 85.8830], // Cuttack
      [20.2644, 85.8436], // Bhubaneswar
      [17.7214, 83.2907], // Visakhapatnam
      [17.0005, 81.8040], // Rajahmundry
      [16.5186, 80.6195], // Vijayawada
      [14.4426, 79.9865], // Nellore
      [13.0827, 80.2755], // Chennai Central
    ]
  },
  {
    id: 'southern-trunk',
    name: 'Southern Trunk Route (Chennai - Coimbatore - Thiruvananthapuram)',
    gauge: 'BROAD_GAUGE',
    color: '#ec4899',
    coordinates: [
      [13.0827, 80.2755], // Chennai Central
      [12.9696, 79.1368], // Katpadi
      [12.5700, 78.5800], // Jolarpettai
      [11.6643, 78.1460], // Salem
      [11.3410, 77.7172], // Erode
      [11.0016, 76.9628], // Coimbatore
      [10.7867, 76.6548], // Palakkad
      [9.9675, 76.2917],  // Ernakulam
      [8.4875, 76.9532],  // Thiruvananthapuram
    ]
  },
  {
    id: 'northern-jammu',
    name: 'Northern Frontier Route (Delhi - Amritsar - Jammu Tawi)',
    gauge: 'BROAD_GAUGE',
    color: '#6366f1',
    coordinates: [
      [28.6424, 77.2195], // New Delhi
      [29.3909, 76.9635], // Panipat
      [30.3782, 76.7767], // Ambala
      [30.9010, 75.8573], // Ludhiana
      [31.3260, 75.5762], // Jalandhar
      [31.6340, 74.8723], // Amritsar
      [32.2689, 75.6528], // Pathankot
      [32.7061, 74.8797], // Jammu Tawi
    ]
  },
  {
    id: 'northeast-link',
    name: 'Northeast Assam Corridor (Kolkata - Siliguri - Guwahati)',
    gauge: 'BROAD_GAUGE',
    color: '#14b8a6',
    coordinates: [
      [22.5838, 88.3426], // Howrah
      [23.2324, 87.8615], // Barddhaman
      [25.0108, 88.1411], // Malda Town
      [26.7162, 88.4282], // New Jalpaiguri/Siliguri
      [26.4900, 89.5300], // New Alipurduar
      [26.5000, 90.5500], // New Bongaigaon
      [26.1822, 91.7506], // Guwahati
    ]
  },
  {
    id: 'bengaluru-hyderabad',
    name: 'Deccan Corridor (Bengaluru - Secunderabad - Nagpur)',
    gauge: 'BROAD_GAUGE',
    color: '#84cc16',
    coordinates: [
      [12.9781, 77.5696], // KSR Bengaluru
      [14.6800, 77.6000], // Anantapur
      [15.8200, 78.0300], // Kurnool
      [17.4334, 78.5044], // Secunderabad
      [17.9800, 79.5200], // Kazipet
      [19.8519, 79.3516], // Balharshah
      [21.1524, 79.0888], // Nagpur
    ]
  }
];

