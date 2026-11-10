// Comprehensive Broad Gauge Railway Network Routes of Indian Railways
// Matching the authentic styling of IndiaRailInfo (IRI) Atlas (https://indiarailinfo.com/atlas)

export interface RailwayRoute {
  id: string;
  name: string;
  gauge: 'BROAD_GAUGE';
  color: string;
  trackType: 'ELECTRIFIED_DOUBLE' | 'MAIN_LINE' | 'COASTAL_SCENIC' | 'BROAD_GAUGE' | 'LINK_LINE';
  coordinates: [number, number][]; // [Lat, Lng]
}

export const INDIAN_RAILWAY_TRUNK_CORRIDORS: RailwayRoute[] = [
  // 1. Grand Trunk (Delhi - Bhopal - Nagpur - Vijayawada - Chennai) - Red (Electrified Double)
  {
    id: 'gt-route',
    name: 'Grand Trunk Corridor (Delhi - Nagpur - Chennai)',
    gauge: 'BROAD_GAUGE',
    trackType: 'ELECTRIFIED_DOUBLE',
    color: '#dc2626',
    coordinates: [
      [28.6424, 77.2195], // New Delhi
      [27.4924, 77.6737], // Mathura
      [27.1767, 78.0081], // Agra Cantt
      [26.2183, 78.1828], // Gwalior
      [25.4484, 78.5685], // VGL Jhansi
      [23.2685, 77.4126], // Bhopal Jn
      [22.6120, 77.7600], // Itarsi Jn
      [21.1524, 79.0888], // Nagpur Jn
      [19.8519, 79.3516], // Balharshah
      [17.9800, 79.5200], // Kazipet Jn
      [16.5186, 80.6195], // Vijayawada Jn
      [14.4426, 79.9865], // Nellore
      [13.0827, 80.2755], // MGR Chennai Central
    ]
  },

  // 2. Eastern Main Trunk (Delhi - Kanpur - Prayagraj - DDU - Patna - Howrah) - Red (Electrified Double)
  {
    id: 'eastern-corridor',
    name: 'Eastern Trunk Route (Delhi - Kanpur - Patna - Howrah)',
    gauge: 'BROAD_GAUGE',
    trackType: 'ELECTRIFIED_DOUBLE',
    color: '#dc2626',
    coordinates: [
      [28.6424, 77.2195], // New Delhi
      [27.8974, 78.0880], // Aligarh
      [27.1767, 78.0081], // Tundla / Agra
      [26.4547, 80.3507], // Kanpur Central
      [25.4358, 81.8463], // Prayagraj Jn
      [25.2818, 83.1186], // Pt. Deen Dayal Upadhyaya Jn (DDU)
      [25.6022, 85.1376], // Patna Jn
      [25.2600, 86.1500], // Kiul Jn
      [24.7900, 85.0000], // Gaya Jn
      [23.7957, 86.4304], // Dhanbad Jn
      [23.6871, 86.9746], // Asansol Jn
      [23.2324, 87.8615], // Barddhaman Jn
      [22.5838, 88.3426], // Howrah Jn
    ]
  },

  // 3. Western Rajdhani Trunk (Delhi - Mathura - Kota - Ratlam - Vadodara - Mumbai) - Red
  {
    id: 'western-rajdhani',
    name: 'Western Main Trunk (Delhi - Kota - Vadodara - Mumbai)',
    gauge: 'BROAD_GAUGE',
    trackType: 'ELECTRIFIED_DOUBLE',
    color: '#dc2626',
    coordinates: [
      [28.6424, 77.2195], // New Delhi
      [27.4924, 77.6737], // Mathura Jn
      [26.9000, 77.4000], // Bharatpur
      [25.1800, 75.8300], // Kota Jn
      [24.5000, 75.8000], // Shamgarh
      [23.4500, 75.4000], // Nagda Jn
      [23.3300, 75.0300], // Ratlam Jn
      [22.3107, 73.1812], // Vadodara Jn
      [21.2049, 72.8411], // Surat
      [20.3800, 72.9000], // Vapi
      [19.2437, 73.1355], // Vasai / Kalyan
      [18.9696, 72.8193], // Mumbai Central
    ]
  },

  // 4. Central East-West Route (Mumbai - Bhusawal - Nagpur - Raipur - Bilaspur - Howrah) - Magenta / Red
  {
    id: 'central-howrah',
    name: 'Central East-West Corridor (Mumbai - Nagpur - Howrah)',
    gauge: 'BROAD_GAUGE',
    trackType: 'ELECTRIFIED_DOUBLE',
    color: '#a21caf',
    coordinates: [
      [18.9400, 72.8354], // Mumbai CSMT
      [19.2437, 73.1355], // Kalyan Jn
      [19.9975, 73.7898], // Nashik Road
      [20.5500, 74.5200], // Manmad Jn
      [21.0455, 75.7885], // Bhusawal Jn
      [20.7002, 77.0082], // Akola Jn
      [20.9300, 77.7500], // Badnera / Amravati
      [20.7400, 78.6000], // Wardha Jn
      [21.1524, 79.0888], // Nagpur Jn
      [21.1800, 80.2000], // Gondia Jn
      [21.1900, 81.2800], // Durg Jn
      [21.2514, 81.6296], // Raipur Jn
      [22.0797, 82.1409], // Bilaspur Jn
      [22.2604, 84.8536], // Rourkela Jn
      [22.7699, 86.2029], // Tatanagar Jn
      [22.3392, 87.3255], // Kharagpur Jn
      [22.5838, 88.3426], // Howrah Jn
    ]
  },

  // 5. East Coast Corridor (Howrah - Bhubaneswar - Visakhapatnam - Chennai) - Blue
  {
    id: 'east-coast-corridor',
    name: 'East Coast Corridor (Howrah - Visakhapatnam - Chennai)',
    gauge: 'BROAD_GAUGE',
    trackType: 'MAIN_LINE',
    color: '#1d4ed8',
    coordinates: [
      [22.5838, 88.3426], // Howrah Jn
      [22.3392, 87.3255], // Kharagpur Jn
      [21.4934, 86.9135], // Balasore
      [20.8900, 86.5000], // Bhadrak
      [20.4625, 85.8830], // Cuttack Jn
      [20.2644, 85.8436], // Bhubaneswar
      [19.8100, 85.8300], // Khurda Road Jn
      [19.3100, 84.7900], // Brahmapur
      [18.2900, 83.8900], // Srikakulam Road
      [18.1100, 83.4000], // Vizianagaram Jn
      [17.7214, 83.2907], // Visakhapatnam
      [17.3500, 82.5500], // Tuni
      [17.0005, 81.8040], // Rajahmundry
      [16.7100, 81.1000], // Eluru
      [16.5186, 80.6195], // Vijayawada Jn
      [15.8200, 80.3500], // Bapatla
      [15.5000, 80.0500], // Ongole
      [14.4426, 79.9865], // Nellore
      [13.7500, 80.0200], // Gudur Jn
      [13.0827, 80.2755], // Chennai Central
    ]
  },

  // 6. Western Heritage Trunk (Delhi - Rewari - Jaipur - Ajmer - Marwar - Ahmedabad) - Green
  {
    id: 'western-jaipur-corridor',
    name: 'Western Rajputana Link (Delhi - Jaipur - Ahmedabad)',
    gauge: 'BROAD_GAUGE',
    trackType: 'BROAD_GAUGE',
    color: '#15803d',
    coordinates: [
      [28.6424, 77.2195], // New Delhi
      [28.4595, 77.0266], // Gurugram
      [28.2000, 76.6000], // Rewari Jn
      [27.5600, 76.6100], // Alwar Jn
      [27.1500, 76.3500], // Bandikui Jn
      [26.9196, 75.7878], // Jaipur Jn
      [26.6000, 75.1000], // Phulera Jn
      [26.4499, 74.6399], // Ajmer Jn
      [25.9000, 74.2000], // Beawar
      [25.6000, 73.8000], // Marwar Jn
      [25.1000, 73.2000], // Falna
      [24.5854, 73.7125], // Abu Road
      [24.1700, 72.4300], // Palanpur Jn
      [23.6000, 72.4000], // Mahesana Jn
      [23.0232, 72.6006], // Ahmedabad Jn
    ]
  },

  // 7. Southern Main Line (Chennai - Coimbatore - Kochi - Thiruvananthapuram) - Red
  {
    id: 'southern-trunk',
    name: 'Southern Trunk Route (Chennai - Coimbatore - Thiruvananthapuram)',
    gauge: 'BROAD_GAUGE',
    trackType: 'ELECTRIFIED_DOUBLE',
    color: '#dc2626',
    coordinates: [
      [13.0827, 80.2755], // Chennai Central
      [13.0800, 79.6700], // Arakkonam Jn
      [12.9696, 79.1368], // Katpadi Jn
      [12.5700, 78.5800], // Jolarpettai Jn
      [11.6643, 78.1460], // Salem Jn
      [11.3410, 77.7172], // Erode Jn
      [11.1000, 77.3400], // Tiruppur
      [11.0016, 76.9628], // Coimbatore Jn
      [10.7867, 76.6548], // Palakkad Jn
      [10.7600, 75.9200], // Shoranur Jn
      [10.5200, 76.2100], // Thrissur
      [10.1500, 76.3500], // Aluva
      [9.9675, 76.2917],  // Ernakulam Jn (South)
      [9.5900, 76.5200],  // Kottayam
      [9.3100, 76.5300],  // Chengannur
      [8.8800, 76.6000],  // Kollam Jn
      [8.4875, 76.9532],  // Thiruvananthapuram Central
    ]
  },

  // 8. Northern Frontier (Delhi - Amritsar - Jammu Tawi) - Red
  {
    id: 'northern-jammu',
    name: 'Northern Frontier Route (Delhi - Amritsar - Jammu Tawi)',
    gauge: 'BROAD_GAUGE',
    trackType: 'ELECTRIFIED_DOUBLE',
    color: '#dc2626',
    coordinates: [
      [28.6424, 77.2195], // New Delhi
      [29.3909, 76.9635], // Panipat Jn
      [29.6800, 76.9800], // Karnal
      [29.9600, 76.8100], // Kurukshetra
      [30.3782, 76.7767], // Ambala Cantt
      [30.9010, 75.8573], // Ludhiana Jn
      [31.3260, 75.5762], // Jalandhar City
      [31.6340, 74.8723], // Amritsar Jn
      [32.0500, 75.4000], // Batala
      [32.2689, 75.6528], // Pathankot Cantt
      [32.4400, 75.4300], // Kathua
      [32.7061, 74.8797], // Jammu Tawi
    ]
  },

  // 9. Northeast Frontier Corridor (Howrah - Siliguri - Guwahati - Dibrugarh) - Green
  {
    id: 'northeast-link',
    name: 'Northeast Assam Corridor (Kolkata - Siliguri - Guwahati)',
    gauge: 'BROAD_GAUGE',
    trackType: 'BROAD_GAUGE',
    color: '#15803d',
    coordinates: [
      [22.5838, 88.3426], // Howrah
      [23.2324, 87.8615], // Barddhaman
      [24.1800, 88.2700], // Azimganj
      [25.0108, 88.1411], // Malda Town
      [25.7500, 87.9300], // Barsoi Jn
      [26.1000, 87.9400], // Kishanganj
      [26.7162, 88.4282], // New Jalpaiguri (Siliguri)
      [26.5400, 89.0500], // New Maynaguri
      [26.4900, 89.5300], // New Alipurduar
      [26.4800, 89.9700], // Kokrajhar
      [26.5000, 90.5500], // New Bongaigaon
      [26.3500, 91.2200], // Rangiya Jn
      [26.1822, 91.7506], // Guwahati
      [25.7500, 93.1800], // Lumding Jn
      [25.9000, 93.7200], // Dimapur
      [27.4900, 94.9100], // Dibrugarh / Tinsukia
    ]
  },

  // 10. Konkan Railway (Mumbai - Roha - Ratnagiri - Madgaon - Mangaluru) - Cyan (Scenic Coastal)
  {
    id: 'konkan-railway',
    name: 'Konkan Coastal Railway (Mumbai - Goa - Mangaluru)',
    gauge: 'BROAD_GAUGE',
    trackType: 'COASTAL_SCENIC',
    color: '#0284c7',
    coordinates: [
      [18.9696, 72.8193], // Mumbai
      [18.9400, 72.8354], // CSMT
      [19.0000, 73.1000], // Panvel Jn
      [18.4300, 73.1200], // Roha
      [18.1500, 73.3400], // Mangaon
      [17.5300, 73.5200], // Chiplun
      [16.9800, 73.3100], // Ratnagiri
      [16.1500, 73.6800], // Kankavali
      [15.8600, 73.8100], // Sawantwadi Road
      [15.2800, 73.9600], // Madgaon Jn (Goa)
      [14.8000, 74.1300], // Karwar
      [14.2800, 74.4500], // Kumta
      [13.9800, 74.6200], // Bhatkal
      [13.6200, 74.7000], // Kundapura
      [13.3400, 74.7500], // Udupi
      [12.8700, 74.8400], // Mangaluru Central
    ]
  },

  // 11. Deccan Corridor (Bengaluru - Secunderabad - Nagpur) - Magenta
  {
    id: 'bengaluru-hyderabad',
    name: 'Deccan Corridor (Bengaluru - Secunderabad - Nagpur)',
    gauge: 'BROAD_GAUGE',
    trackType: 'MAIN_LINE',
    color: '#9333ea',
    coordinates: [
      [12.9781, 77.5696], // KSR Bengaluru
      [13.3400, 77.1000], // Tumakuru
      [13.6500, 77.7000], // Hindupur
      [14.6800, 77.6000], // Anantapur
      [15.1700, 77.3700], // Guntakal Jn
      [15.8200, 78.0300], // Kurnool City
      [16.7300, 77.9800], // Mahbubnagar
      [17.4334, 78.5044], // Secunderabad Jn
      [17.9800, 79.5200], // Kazipet Jn
      [18.7800, 79.5100], // Ramagundam
      [19.8519, 79.3516], // Balharshah
      [20.7400, 78.6000], // Wardha Jn
      [21.1524, 79.0888], // Nagpur Jn
    ]
  },

  // 12. Kashmir Valley Railway (Banihal - Qazigund - Srinagar - Baramulla) - Cyan (Scenic)
  {
    id: 'kashmir-valley',
    name: 'Kashmir Valley Railway (Banihal - Srinagar - Baramulla)',
    gauge: 'BROAD_GAUGE',
    trackType: 'COASTAL_SCENIC',
    color: '#0891b2',
    coordinates: [
      [33.5100, 75.2000], // Banihal
      [33.5900, 75.1600], // Qazigund
      [33.7300, 75.1500], // Anantnag
      [33.9900, 74.9000], // Awantipora
      [34.0500, 74.8200], // Srinagar
      [34.1200, 74.6000], // Budgam
      [34.2000, 74.3500], // Sopore
      [34.2100, 74.3400], // Baramulla
    ]
  },

  // 13. Rajasthan Desert Line (Jaipur - Ajmer - Jodhpur - Jaisalmer) - Orange
  {
    id: 'rajasthan-desert',
    name: 'Thar Desert Route (Jaipur - Jodhpur - Jaisalmer)',
    gauge: 'BROAD_GAUGE',
    trackType: 'LINK_LINE',
    color: '#ea580c',
    coordinates: [
      [26.9196, 75.7878], // Jaipur
      [26.4499, 74.6399], // Ajmer
      [25.6000, 73.8000], // Marwar Jn
      [26.2900, 73.0200], // Jodhpur Jn
      [26.9000, 72.3600], // Pokaran
      [26.9157, 70.9083], // Jaisalmer
    ]
  },

  // 14. Saurashtra Coastal Line (Ahmedabad - Rajkot - Dwarka - Porbandar) - Green
  {
    id: 'saurashtra-line',
    name: 'Saurashtra Coast Route (Ahmedabad - Rajkot - Dwarka)',
    gauge: 'BROAD_GAUGE',
    trackType: 'BROAD_GAUGE',
    color: '#16a34a',
    coordinates: [
      [23.0232, 72.6006], // Ahmedabad
      [23.1300, 72.0300], // Viramgam Jn
      [22.7200, 71.6400], // Surendranagar
      [22.3000, 70.8000], // Rajkot Jn
      [22.4700, 70.0700], // Jamnagar
      [22.2400, 68.9600], // Dwarka
      [21.6400, 69.6000], // Porbandar
    ]
  },

  // 15. Tamil Nadu Southern Route (Chennai - Madurai - Kanniyakumari) - Green
  {
    id: 'tamilnadu-south',
    name: 'Tamil Nadu Cord Route (Chennai - Tiruchirappalli - Kanniyakumari)',
    gauge: 'BROAD_GAUGE',
    trackType: 'MAIN_LINE',
    color: '#15803d',
    coordinates: [
      [13.0784, 80.2612], // Chennai Egmore
      [12.6800, 79.9800], // Chengalpattu Jn
      [11.9400, 79.4900], // Villupuram Jn
      [11.7500, 79.3200], // Vriddhachalam Jn
      [10.7905, 78.7047], // Tiruchirappalli Jn
      [10.3600, 77.9700], // Dindigul Jn
      [9.9178, 78.1139],  // Madurai Jn
      [9.5800, 77.9500],  // Virudhunagar Jn
      [9.1700, 77.8700],  // Kovilpatti
      [8.7139, 77.7567],  // Tirunelveli Jn
      [8.0883, 77.5385],  // Kanniyakumari
    ]
  },

  // 16. Karnataka - Maharashtra Link (Bengaluru - Hubballi - Belagavi - Pune) - Magenta
  {
    id: 'karnataka-pune-link',
    name: 'South Western Link (Bengaluru - Hubballi - Pune)',
    gauge: 'BROAD_GAUGE',
    trackType: 'MAIN_LINE',
    color: '#9333ea',
    coordinates: [
      [12.9781, 77.5696], // KSR Bengaluru
      [13.3400, 77.1000], // Tumakuru
      [13.3100, 76.2600], // Arsikere Jn
      [14.4600, 75.9200], // Davanagere
      [15.3647, 75.1240], // Hubballi Jn
      [15.4500, 75.0000], // Dharwad
      [15.8500, 74.5000], // Belagavi
      [16.8200, 74.6500], // Miraj Jn
      [17.6800, 74.0000], // Satara
      [18.5204, 73.8567], // Pune Jn
    ]
  },

  // 17. Deccan Pune - Solapur - Wadi - Guntakal - Red
  {
    id: 'pune-wadi-guntakal',
    name: 'Deccan Trunk Route (Pune - Solapur - Wadi - Chennai)',
    gauge: 'BROAD_GAUGE',
    trackType: 'ELECTRIFIED_DOUBLE',
    color: '#dc2626',
    coordinates: [
      [18.5204, 73.8567], // Pune Jn
      [18.4600, 74.5800], // Daund Jn
      [18.1800, 75.3400], // Kurduvadi Jn
      [17.6600, 75.9100], // Solapur
      [17.3300, 76.8300], // Kalaburagi (Gulbarga)
      [17.0500, 76.9900], // Wadi Jn
      [16.2000, 77.3500], // Raichur
      [15.1700, 77.3700], // Guntakal Jn
      [14.9000, 77.6000], // Gooty Jn
      [14.4700, 78.8200], // Kadapa
      [13.6300, 79.5200], // Renigunta / Tirupati
      [13.0800, 79.6700], // Arakkonam Jn
      [13.0827, 80.2755], // Chennai Central
    ]
  },

  // 18. Bihar - UP Gorakhpur Route (Lucknow - Gorakhpur - Muzaffarpur - Katihar) - Green
  {
    id: 'gorakhpur-corridor',
    name: 'North Bihar - Oudh Route (Lucknow - Gorakhpur - Chhapra)',
    gauge: 'BROAD_GAUGE',
    trackType: 'BROAD_GAUGE',
    color: '#15803d',
    coordinates: [
      [26.8322, 80.9221], // Lucknow Charbagh
      [26.9200, 81.1800], // Barabanki Jn
      [27.1300, 81.9600], // Gonda Jn
      [26.7900, 82.1900], // Ayodhya Dham
      [26.7600, 83.3700], // Gorakhpur Jn
      [26.2200, 84.3600], // Siwan Jn
      [25.7800, 84.7400], // Chhapra Jn
      [25.6800, 85.2200], // Hajipur Jn
      [26.1200, 85.3900], // Muzaffarpur Jn
      [25.4600, 85.9800], // Samastipur Jn
      [25.4200, 86.0000], // Barauni Jn
      [25.5400, 87.5700], // Katihar Jn
    ]
  }
];
