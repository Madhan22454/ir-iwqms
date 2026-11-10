# IR-IWQMS Design Tokens & Theming Guide

The IR-IWQMS design system is engineered specifically for Indian Railways Water Surveillance. It departs from generic admin card templates in favor of high-contrast civic engineering ergonomics, tabular telemetry, and dual-theme token architecture.

---

## 🎨 Color Palette & Semantics

| Token | Hex | Semantic Meaning / Role |
| :--- | :--- | :--- |
| `--ir-indigo` | `#1B1F6B` | Primary Government Identity / Structural Rails / Brand Anchor |
| `--ir-saffron` | `#FF7A1A` | Operational Alert Accents / Actionable Highlights |
| `--ir-teal` | `#00B5C8` | Water Surveillance Telemetry / Active Sensors |
| `--status-compliant` | `#1FB86B` | Potable Water / Within IS 10500 Limits |
| `--status-attention` | `#FFB020` | Scheduled Sampling Due (< 48 hrs) |
| `--status-overdue` | `#FF6B2C` | Overdue Inspection / Level 1 Escalation |
| `--status-unfit` | `#E5384B` | Critical Contamination / Coliform Detected |
| `--status-persistent`| `#B4236C` | Persistent Multi-Day Failure (Board Escalation) |

---

## 🌗 Surfaces & Canvas Tokens

The application defaults to **Light Mode** for executive presentations, and supports **Dark Mode** (tinted near-black) for continuous 24/7 command center operations.

| Token | Light Value | Dark Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#F4F6FB` | `#070B19` | Application backdrop |
| `--bg-surface` | `#FFFFFF` | `#0E162B` | Bento tiles & cards |
| `--bg-surface-elevated` | `#FFFFFF` | `#141F3A` | Modals, flyouts & command palette |
| `--bg-subtle` | `#EEF2F8` | `#131E37` | Insets, stat wells, table headers |
| `--border-base` | `#E2E8F0` | `#1C2D52` | Structural borders |
| `--border-strong` | `#CBD5E1` | `#2A4072` | Active/hover borders |
| `--text-main` | `#0B132B` | `#F8FAFC` | Primary headings & high-contrast telemetry |
| `--text-muted` | `#475569` | `#94A3B8` | Secondary labels & station metrics |

---

## 🔡 Typography Scale

- **Display & Headings**: `Space Grotesk` (`.font-display`) — geometric character with technical authority.
- **Body & Microcopy**: `Inter` (`.font-body`) — ultra-clear legibility at all font sizes.
- **Data & Telemetry**: Always apply `.tabular-nums` (`font-variant-numeric: tabular-nums`) to ensure KPI figures and timer counts don't jump or misalign during real-time updates.

---

## 🚀 Reusable Component Primitives

1. **`ir-tile`**: Structural container for bento tiles with responsive padding, rounded corners (`12px`), and subtle architectural shadows.
2. **`status-chip status-chip-[compliant|attention|overdue|unfit|persistent]`**: Standardized status pills with WCAG AA compliance in both light and dark themes.
3. **`ir-form-label` & `ir-form-input`**: High-contrast, non-blurred form inputs solving previous opacity fading defects.
4. **`animate-ticker`**: CSS marquee animation running at continuous 60fps transform for live alert feeds.
5. **Command Palette (`Ctrl+K`)**: Global quick jump with station search across Indian Railways network.

---

## ⚙️ How to Toggle Demo Data

Demo data is enabled by default to guarantee non-empty executive presentations across all 16 zones, 68 divisions, and 200+ stations.

- **Environment Flag**: In `.env`, set `VITE_DEMO_DATA=true` (or `false` to require live API responses).
- **In-App Toggle**: Use the global command palette (`Ctrl+K`) or the **Simulate Alert** button in the header to trigger real-time simulated critical contamination events end-to-end.

