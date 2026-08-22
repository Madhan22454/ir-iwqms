import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Activity,
  LogOut,
  Train,
  ChevronRight,
  FlaskConical,
  AlertTriangle,
  ClipboardList,
  MapPin,
  BarChart3,
  Bell,
  History
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navSections = [
  {
    title: "Core Surveillance",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/alerts", label: "Alert Centre", icon: AlertTriangle, end: false, badge: "Live" },
      { to: "/lab/result-entry", label: "Lab Result Entry", icon: FlaskConical, end: false },
      { to: "/healthcard", label: "Health Card", icon: Activity, end: false },
    ],
  },
  {
    title: "Operations & GIS",
    items: [
      { to: "/corrective-actions", label: "Corrective Actions", icon: ClipboardList, end: false },
      { to: "/gis", label: "GIS Surveillance Map", icon: MapPin, end: false },
      { to: "/master-data", label: "Master Data", icon: Database, end: false },
      { to: "/reports", label: "Reports & Analytics", icon: BarChart3, end: false },
    ],
  },
  {
    title: "Governance",
    items: [
      { to: "/notifications", label: "Notifications", icon: Bell, end: false },
      { to: "/audit", label: "Audit Trail", icon: History, end: false },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  CENTRAL_ADMIN: "Central Admin",
  ZONAL_ADMIN: "Zonal Admin",
  DIVISIONAL_OFFICER: "Divisional Officer",
  HMI: "H&MI Officer",
  ENGINEERING: "Section Engineer",
  LABORATORY: "Laboratory Staff",
  STATION_INCHARGE: "Station Incharge",
  SENIOR_MANAGEMENT: "Senior Management",
};

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside style={{
        width: 270, background: "linear-gradient(180deg, #091224 0%, #0f2347 50%, #1e3a8a 100%)",
        display: "flex", flexDirection: "column", flexShrink: 0,
        boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
        zIndex: 20,
      }}>
        {/* Logo Header */}
        <div style={{
          padding: "20px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            background: "linear-gradient(135deg, #1e40af, #3b82f6)", borderRadius: 12, padding: 9,
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
          }}>
            <Train size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "white", letterSpacing: "0.2px" }}>
              IR-IWQMS
            </div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
              Indian Railways Water Quality
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav style={{ padding: "14px 10px", flex: 1, overflowY: "auto" }}>
          {navSections.map((section, sIdx) => (
            <div key={sIdx} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: "rgba(147,197,253,0.65)",
                letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 10px", marginBottom: 6,
              }}>
                {section.title}
              </div>
              {section.items.map(({ to, label, icon: Icon, end, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  style={({ isActive }) => ({
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 9, marginBottom: 3,
                    textDecoration: "none",
                    background: isActive ? "rgba(59,130,246,0.22)" : "transparent",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.68)",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13.5,
                    transition: "all 0.15s ease",
                    border: isActive ? "1px solid rgba(147,197,253,0.3)" : "1px solid transparent",
                    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} style={{ color: isActive ? "#60a5fa" : "inherit", flexShrink: 0 }} />
                      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                      {badge && (
                        <span style={{
                          fontSize: 9.5, fontWeight: 800, padding: "2px 6px", borderRadius: 6,
                          background: "#ef4444", color: "white", textTransform: "uppercase",
                          boxShadow: "0 0 6px rgba(239,68,68,0.6)",
                        }}>
                          {badge}
                        </span>
                      )}
                      {isActive && <ChevronRight size={13} style={{ opacity: 0.8 }} />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User info + Logout */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
          {user && (
            <div style={{
              background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px", marginBottom: 8,
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}>
                  {user.name?.charAt(0) || "U"}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#93c5fd", fontWeight: 600 }}>
                    {ROLE_LABELS[user.role] || user.role}
                  </div>
                </div>
              </div>
            </div>
          )}
          <button
            id="logoutBtn"
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8, border: "none",
              background: "rgba(239,68,68,0.18)", color: "#fca5a5",
              fontSize: 12.5, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s", fontFamily: "inherit",
            }}
            onMouseEnter={e => {
              (e.currentTarget).style.background = "rgba(239,68,68,0.3)";
              (e.currentTarget).style.color = "#ffffff";
            }}
            onMouseLeave={e => {
              (e.currentTarget).style.background = "rgba(239,68,68,0.18)";
              (e.currentTarget).style.color = "#fca5a5";
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          height: 56, background: "white",
          borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", padding: "0 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "#1e3a8a", color: "white", letterSpacing: "0.05em" }}>
              IR-SURVEILLANCE
            </span>
            <h1 style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.2px" }}>
              Integrated Water Quality Monitoring & Surveillance System
            </h1>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: "#16a34a",
                boxShadow: "0 0 6px #16a34a",
                animation: "pulse 2s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>Backend Online</span>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
