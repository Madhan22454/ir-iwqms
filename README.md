# IR-IWQMS: Indian Railways Integrated Water Quality Monitoring & Surveillance System

[![Government of India](https://img.shields.io/badge/Government_of_India-Ministry_of_Railways-1B1F6B?style=for-the-badge)](https://indianrailways.gov.in)
[![Standard](https://img.shields.io/badge/Standard-IS_10500%3A2012_Drinking_Water-1FB86B?style=for-the-badge)](https://bis.gov.in)
[![Vite](https://img.shields.io/badge/Frontend-React_19_+_TypeScript_+_Vite-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_+_Python_3.12-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)

**IR-IWQMS** is an enterprise-grade government surveillance platform engineered specifically for Indian Railways to monitor, sample, test, and escalate drinking water quality across all 17 Zonal Railways, 68 Divisions, and hundreds of railway stations nationwide.

---

## 🌟 Key Capabilities & Features

### 1. Gov-Tech Command & Control Centre
- **Bento-Grid Dashboard**: Asymmetric, hierarchy-driven layout displaying live compliance indices, active escalation ladders, and nationwide surveillance pins.
- **Pan-India Interactive Surveillance Map**: Built using official Survey of India boundary demarcation with dynamic station proximity tracking, regional hub resolution, and zero-distortion SVG rendering.
- **Three-Tier Escalation Ladder**: Real-time SLA tracking across Division (48h), Zonal Headquarters (96h), and Railway Board / Central (144h) with animated countdown progress arcs.

### 2. High-Contrast Stepped Laboratory Entry
- **IS 10500:2012 Compliance Engine**: Instant client-side and server-side verification of permissible and acceptable limits (Free Residual Chlorine, pH, Turbidity, Total Dissolved Solids, Coliform Bacteria, E. Coli, Fluoride, Arsenic, Heavy Metals).
- **Stepped Form Architecture**: Sample identification, laboratory accreditation verification, and parameter telemetry with clear visual hierarchy in both Light and Dark themes.

### 3. Integrated Water Sampling & Disinfection Management
- **Sampling Frequency Mandate**: Tracks bacteriological sampling (mandated every 30 days) and chemical testing (every 180 days) across all station borewells, municipal supply inlets, and overhead storage reservoirs.
- **DPD Colorimetric Residual Chlorine Tracker**: Live monitoring of chlorination dosages and residual chlorine compliance ($0.20 - 1.00\text{ ppm}$ at tap point).

### 4. Enterprise Design System & Accessibility
- **WCAG AA Compliance**: High-contrast government typography (Inter + Space Grotesk) designed for clarity for non-technical railway officials and inspectors.
- **Tokenized Theming**: Seamless Light and Dark mode transitions persisted in local storage with zero layout shift or contrast drop.
- **Global Command Palette**: Instant navigation via `Ctrl + K` searching across stations, divisions, parameters, and active escalations.
- **Instant Demo Simulation**: One-click simulated water contamination alert to test incident dispatch and escalation workflows end-to-end.

---

## 🚀 Live Demo & Repository

- **Repository**: [https://github.com/arunp061106/ir-iwqms-2](https://github.com/arunp061106/ir-iwqms-2)
- **Live Deployment Options**:
  - **GitHub Pages**: Automatically deployed via GitHub Actions workflow (`.github/workflows/deploy.yml`) on push to `main`.
  - **Vercel**: Pre-configured via `vercel.json` for one-click full-stack deployment.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20+ and npm
- Python 3.10+ (Python 3.12 recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/arunp061106/ir-iwqms-2.git
cd ir-iwqms-2
```

### 2. Frontend Setup
```bash
# Install NPM dependencies
npm install

# Start Vite frontend development server
npm run dev
# The web app will be accessible at http://localhost:5173
```

### 3. Backend Setup
```bash
# Navigate to the API folder
cd api

# Install Python requirements
pip install -r requirements.txt

# Run the FastAPI server via Uvicorn
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
# The interactive OpenAPI documentation will be accessible at http://127.0.0.1:8000/docs
```

---

## 📊 Seeded Demonstration Dataset

The application includes an embedded pan-India demo dataset (`src/data/mockDemoData.ts`) loaded automatically whenever offline or in presentation mode:
- **16 Zonal Railways**: Northern Railway (NR), Southern Railway (SR), Western Railway (WR), Central Railway (CR), Eastern Railway (ER), South Central Railway (SCR), East Coast Railway (ECoR), North Eastern Railway (NER), South Western Railway (SWR), etc.
- **68 Operating Divisions**: Delhi, Ambala, Chennai, Trichy, Mumbai Central, Pune, Howrah, Secunderabad, etc.
- **280+ Stations & Water Sources**: Categorized by NSG-1 to NSG-6 with live GIS coordinates and sampling intervals.
- **30+ Realistic Escalations & Alerts**: Spread across 48h/96h/144h resolution timers with IS 10500 contravention logs.

---

## 🎨 Theme Tokens & Design System

Documented in detail in [`THEMING.md`](./THEMING.md) and [`CHANGELOG.md`](./CHANGELOG.md).

| Token | Light Theme | Dark Theme | Purpose |
|---|---|---|---|
| Deep Indigo | `#1B1F6B` | `#3944BC` | Primary Railway Identity & Navigation Rail |
| Signal Saffron | `#FF7A1A` | `#FF9E4A` | High-Priority Alerts & Live Simulation |
| Water Teal | `#0097A7` | `#26C6DA` | Water Quality Metrics & Normal Ranges |
| Compliant Green | `#107C41` | `#22C55E` | Potable Water Pass / Safe Status |
| Attention Amber | `#B45309` | `#FBBF24` | Sampling Due (within 5 days) |
| Unfit Crimson | `#B91C1C` | `#EF4444` | IS 10500 Contamination / Immediate Action |

---

## 👥 Project Team & Credits

**Done by:**
- **Niranjan R**
- **Arun Karthick P**
- **Madhan Kumar S**

*Developed for the Ministry of Railways, Government of India — Integrated Water Quality Surveillance Initiative.*
