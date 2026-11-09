import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  MapPin,
  Train,
  Droplets,
  CalendarCheck,
  FlaskConical,
  Sparkles,
  AlertTriangle,
  ClipboardList,
  Flame,
  BarChart3,
  FileText,
  History,
  Database,
  Users,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu,
  Bell
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";

type NavItem = {
  to: string;
  label: string;
  icon: any;
  end: boolean;
  badge?: string;
  roles?: string[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Monitoring & GIS",
    items: [
      { to: "/", label: "Control Centre", icon: LayoutDashboard, end: true },
      { to: "/gis", label: "GIS Water Surveillance", icon: MapPin, end: false },
      { to: "/stations", label: "Stations", icon: Train, end: false },
      { to: "/water-sources", label: "Water Sources", icon: Droplets, end: false },
    ],
  },
  {
    title: "Quality & Operations",
    items: [
      { to: "/sampling", label: "Sampling Management", icon: CalendarCheck, end: false },
      { to: "/lab/result-entry", label: "Laboratory", icon: FlaskConical, end: false },
      { to: "/disinfection", label: "Disinfection", icon: Sparkles, end: false },
      { to: "/alerts", label: "Alerts", icon: AlertTriangle, end: false, badge: "Live" },
      { to: "/corrective-actions", label: "Corrective Actions", icon: ClipboardList, end: false },
      { to: "/escalations", label: "Escalations", icon: Flame, end: false },
    ],
  },
  {
    title: "Intelligence & Admin",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3, end: false },
      { to: "/reports", label: "Reports", icon: FileText, end: false },
      { to: "/audit", label: "Audit Trail", icon: History, end: false, roles: ["CENTRAL_ADMIN", "ZONAL_ADMIN", "SENIOR_MANAGEMENT"] },
      { to: "/master-data", label: "Master Data", icon: Database, end: false, roles: ["CENTRAL_ADMIN", "ZONAL_ADMIN"] },
      { to: "/users", label: "User Management", icon: Users, end: false, roles: ["CENTRAL_ADMIN"] },
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
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch live alert / notification count
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await axios.get(`${API_URL}/alerts/summary`);
        if (res.data) {
          const totalUnresolved = (res.data.open || 0) + (res.data.escalated || 0);
          setNotificationCount(totalUnresolved);
        }
      } catch (e) {
        // Silent failover
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarWidth = isCollapsed ? 76 : 270;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", overflow: "hidden" }}>
      
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            zIndex: 40,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <aside
        style={{
          width: sidebarWidth,
          background: "linear-gradient(180deg, #091224 0%, #0f2347 50%, #1e3a8a 100%)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
          zIndex: 50,
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s ease",
          position: isMobileMenuOpen ? "fixed" : "relative",
          top: 0,
          bottom: 0,
          left: 0,
          transform: isMobileMenuOpen ? "translateX(0)" : undefined,
        }}
        className={isMobileMenuOpen ? "flex" : "hidden md:flex"}
      >
        {/* Logo / Header with Collapse Toggle */}
        <div
          style={{
            padding: isCollapsed ? "18px 12px" : "18px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                borderRadius: 12,
                padding: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
                flexShrink: 0,
              }}
            >
              <Train size={22} color="white" />
            </div>
            {!isCollapsed && (
              <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                <div style={{ fontSize: 16.5, fontWeight: 900, color: "white", letterSpacing: "0.2px" }}>
                  IR-IWQMS
                </div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                  Indian Railways Water
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              title="Collapse sidebar"
              className="hidden md:flex"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 6,
                padding: 4,
                color: "#93c5fd",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Collapsed Expand Button */}
        {isCollapsed && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setIsCollapsed(false)}
              title="Expand sidebar"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 6,
                padding: 5,
                color: "#93c5fd",
                cursor: "pointer",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Navigation - Scrollable (ALL 15 ITEMS) */}
        <nav style={{ padding: isCollapsed ? "12px 8px" : "14px 10px", flex: 1, overflowY: "auto" }}>
          {navSections.map((section, sIdx) => {
            const filteredItems = section.items.filter(
              (item) => !item.roles || (user && item.roles.includes(user.role))
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={sIdx} style={{ marginBottom: isCollapsed ? 12 : 16 }}>
                {!isCollapsed && (
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "rgba(147,197,253,0.65)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "0 10px",
                      marginBottom: 6,
                    }}
                  >
                    {section.title}
                  </div>
                )}
                {filteredItems.map(({ to, label, icon: Icon, end, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={isCollapsed ? label : undefined}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      gap: 10,
                      padding: isCollapsed ? "10px" : "8px 12px",
                      borderRadius: 9,
                      marginBottom: 3,
                      textDecoration: "none",
                      background: isActive ? "rgba(59,130,246,0.24)" : "transparent",
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.68)",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 13,
                      transition: "all 0.15s ease",
                      border: isActive ? "1px solid rgba(147,197,253,0.3)" : "1px solid transparent",
                      boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={17} style={{ color: isActive ? "#60a5fa" : "inherit", flexShrink: 0 }} />
                        {!isCollapsed && (
                          <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {label}
                          </span>
                        )}
                        {!isCollapsed && badge && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "#ef4444",
                              color: "white",
                              textTransform: "uppercase",
                              boxShadow: "0 0 6px rgba(239,68,68,0.6)",
                            }}
                          >
                            {badge}
                          </span>
                        )}
                        {!isCollapsed && isActive && <ChevronRight size={13} style={{ opacity: 0.8 }} />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div
          style={{
            padding: isCollapsed ? "10px 8px" : "12px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          {user && (
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: isCollapsed ? "8px" : "9px 12px",
                marginBottom: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "white",
                  flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                {user.name?.charAt(0) || "U"}
              </div>
              {!isCollapsed && (
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#93c5fd", fontWeight: 600 }}>
                    {ROLE_LABELS[user.role] || user.role}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            id="logoutBtn"
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out" : undefined}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "7px 10px",
              borderRadius: 8,
              border: "none",
              background: "rgba(239,68,68,0.18)",
              color: "#fca5a5",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
          >
            <LogOut size={14} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        
        {/* Top Header Bar */}
        <header
          style={{
            height: 64,
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            flexShrink: 0,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex md:hidden"
              style={{
                background: "transparent",
                border: "none",
                color: "#1e3a8a",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <Menu size={22} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                  color: "white",
                  letterSpacing: "0.05em",
                }}
              >
                IR-IWQMS
              </span>
              <h1
                style={{
                  fontSize: 15.5,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.2px",
                }}
                className="hidden sm:block"
              >
                Indian Railways Integrated Water Quality Monitoring & Surveillance System
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* User Role Badge */}
            {user && (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                }}
                className="hidden sm:inline-block"
              >
                {ROLE_LABELS[user.role] || user.role}
              </span>
            )}

            {/* Notification Count Badge */}
            <button
              onClick={() => navigate("/alerts")}
              title="Active Alert Incidents"
              style={{
                background: "transparent",
                border: "none",
                position: "relative",
                cursor: "pointer",
                padding: 6,
                display: "flex",
                alignItems: "center",
                color: "#475569",
              }}
            >
              <Bell size={19} />
              {notificationCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 1,
                    right: 1,
                    background: "#dc2626",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 800,
                    width: 17,
                    height: 17,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #ffffff",
                  }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            <div style={{ width: 1, height: 22, background: "#e2e8f0" }} />

            {/* Live Feed Status Indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#16a34a",
                  boxShadow: "0 0 8px #16a34a",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <span style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>Live Feed</span>
            </div>
          </div>
        </header>

        {/* Content Viewport with Vertical Scroll */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ flex: 1, height: "100%", overflowY: "auto" }}>
            <Outlet />
          </div>

          <footer
            style={{
              padding: "12px 16px",
              textAlign: "center",
              fontSize: "12px",
              color: "#64748b",
              fontWeight: 600,
              borderTop: "1px solid #e2e8f0",
              marginTop: "auto",
              backgroundColor: "#f8fafc",
              letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            DONE BY NIRANJAN.R | ARUN KARTHICK .P | MADHAN KUMAR .S
          </footer>
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
