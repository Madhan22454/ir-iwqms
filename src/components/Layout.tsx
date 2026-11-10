import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Shield,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { DEMO_STATIONS, DEMO_ALERTS } from "../data/mockDemoData";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  badge?: string;
  badgeColor?: string;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Surveillance",
    items: [
      { to: "/", label: "Control Centre", icon: LayoutDashboard, end: true },
      { to: "/gis", label: "GIS Atlas", icon: MapPin },
      { to: "/stations", label: "Stations Directory", icon: Train },
      { to: "/water-sources", label: "Water Sources", icon: Droplets },
    ],
  },
  {
    title: "Operations",
    items: [
      { to: "/sampling", label: "Sampling Schedules", icon: CalendarCheck },
      { to: "/lab/result-entry", label: "Laboratory Entry", icon: FlaskConical },
      { to: "/disinfection", label: "Disinfection", icon: Sparkles },
      { to: "/alerts", label: "Alert Feed", icon: AlertTriangle, badge: "28", badgeColor: "bg-red-500 text-white" },
      { to: "/corrective-actions", label: "Corrective Actions", icon: ClipboardList },
      { to: "/escalations", label: "Escalation Ladder", icon: Flame, badge: "9", badgeColor: "bg-orange-500 text-white" },
    ],
  },
  {
    title: "Governance",
    items: [
      { to: "/analytics", label: "Quality Analytics", icon: BarChart3 },
      { to: "/reports", label: "Reports & Exports", icon: FileText },
      { to: "/audit", label: "Audit Logs", icon: History, roles: ["CENTRAL_ADMIN", "ZONAL_ADMIN"] },
      { to: "/master-data", label: "Master Standards", icon: Database, roles: ["CENTRAL_ADMIN", "ZONAL_ADMIN"] },
      { to: "/users", label: "User Accounts", icon: Users, roles: ["CENTRAL_ADMIN"] },
    ],
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(28);
  const [simulatedAlertToast, setSimulatedAlertToast] = useState<string | null>(null);

  const commandInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsCommandOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isCommandOpen) {
      setTimeout(() => commandInputRef.current?.focus(), 50);
    } else {
      setCommandQuery("");
    }
  }, [isCommandOpen]);

  // Filtered station search for Command Palette
  const filteredStations = commandQuery.trim()
    ? DEMO_STATIONS.filter(
        (s) =>
          s.name.toLowerCase().includes(commandQuery.toLowerCase()) ||
          s.code.toLowerCase().includes(commandQuery.toLowerCase()) ||
          s.division_code.toLowerCase().includes(commandQuery.toLowerCase())
      ).slice(0, 7)
    : DEMO_STATIONS.slice(0, 6);

  const handleSimulateAlert = () => {
    setActiveAlertCount((prev) => prev + 1);
    setSimulatedAlertToast(
      "CRITICAL: E. Coli bacterial contamination detected at PURATCHI THALAIVAR DR. M.G.R. CENTRAL (MAS) - Borewell #3"
    );
    // Dispatch custom event for dashboard/map to pick up live
    window.dispatchEvent(
      new CustomEvent("ir-simulated-alert", {
        detail: {
          stationCode: "MAS",
          type: "E. Coli Positive",
          timestamp: new Date().toISOString(),
        },
      })
    );
    setTimeout(() => {
      setSimulatedAlertToast(null);
    }, 6000);
  };

  const handleSelectStation = (_stationCode: string) => {
    setIsCommandOpen(false);
    navigate(`/stations`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-main)] font-body">
      
      {/* -------------------------------------------------------------
          1. SLIM ICON RAIL (Expands smoothly on hover / click)
          ------------------------------------------------------------- */}
      <aside
        onMouseEnter={() => setIsRailExpanded(true)}
        onMouseLeave={() => setIsRailExpanded(false)}
        className={`relative z-40 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r border-[var(--border-base)] bg-[var(--bg-surface)] select-none ${
          isRailExpanded ? "w-64 shadow-2xl" : "w-16"
        }`}
      >
        {/* Rail Top Branding Anchor */}
        <div className="h-16 flex items-center px-3.5 border-b border-[var(--border-base)] overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[var(--ir-indigo)] text-white flex items-center justify-center font-display font-bold text-sm tracking-tighter flex-shrink-0 shadow-sm border border-indigo-400/30">
              IR
            </div>
            {isRailExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col whitespace-nowrap"
              >
                <span className="font-display font-bold text-xs tracking-wider text-[var(--ir-indigo)] dark:text-[var(--ir-teal)] uppercase">
                  Indian Railways
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  Water Surveillance Portal
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Rail Navigation Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {isRailExpanded && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
                  {section.title}
                </div>
              )}
              {section.items
                .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
                .map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive: linkActive }) =>
                        `group flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-xs font-medium transition-colors relative ${
                          linkActive
                            ? "bg-[var(--ir-indigo)] text-white shadow-sm font-semibold"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-main)]"
                        }`
                      }
                      title={!isRailExpanded ? item.label : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {isRailExpanded && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="truncate flex-1"
                        >
                          {item.label}
                        </motion.span>
                      )}
                      {item.badge && isRailExpanded && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.badgeColor || "bg-blue-600 text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.badge && !isRailExpanded && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--bg-surface)]" />
                      )}
                    </NavLink>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Rail Bottom User Profile & Logout */}
        <div className="p-2 border-t border-[var(--border-base)] bg-[var(--bg-subtle)]/50">
          <div className="flex items-center gap-2.5 p-1.5 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              CA
            </div>
            {isRailExpanded && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate text-[var(--text-main)]">
                  {user?.name || "Central Admin"}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  Railway Board (HQ)
                </div>
              </div>
            )}
            {isRailExpanded && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-md hover:bg-[var(--bg-surface)] transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          2. MAIN VIEWPORT & TOP COMMAND BAR
          ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP COMMAND BAR */}
        <header className="h-16 border-b border-[var(--border-base)] bg-[var(--bg-surface)] px-5 flex items-center justify-between gap-4 flex-shrink-0 z-30">
          
          {/* Left: Brand Identity & Telemetry Status Pill */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-base tracking-tight text-[var(--text-main)]">
                IR-IWQMS
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-[var(--text-muted)] border-l border-[var(--border-base)] pl-3">
                Integrated Water Quality Surveillance
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>IS 10500:2012 Engine Online</span>
            </div>
          </div>

          {/* Center: Global Station Search (Ctrl+K Command Palette Trigger) */}
          <div className="flex-1 max-w-xl mx-2">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="w-full h-10 px-3.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-strong)] transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)]">
                <Search className="h-4 w-4 text-[var(--text-faint)] group-hover:text-[var(--ir-indigo)] dark:group-hover:text-[var(--ir-teal)] transition-colors" />
                <span className="truncate">Search stations, divisions, parameters...</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold font-mono text-[var(--text-faint)] bg-[var(--bg-surface)] border border-[var(--border-base)] rounded shadow-2xs">
                  Ctrl+K
                </kbd>
              </div>
            </button>
          </div>

          {/* Right: Actions, Demo Trigger, Live Notification, Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Live Presentation Demo Trigger Button */}
            <button
              onClick={handleSimulateAlert}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800/50 text-xs font-semibold transition-all shadow-2xs active:scale-95"
              title="Simulate Critical Contamination Alert for Client Demo"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>Simulate Alert</span>
            </button>

            {/* Notification Bell with Live Count */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors border border-transparent hover:border-[var(--border-base)]"
                title="Live Alerts & Notifications"
              >
                <Bell className="h-4 w-4" />
                {activeAlertCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
              </button>

              {/* Notification Quick Flyout */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl p-4 z-50"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border-base)] pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm">Surveillance Alerts</span>
                        <span className="status-chip status-chip-unfit text-[10px]">
                          {activeAlertCount} Open
                        </span>
                      </div>
                      <NavLink
                        to="/alerts"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-xs text-[var(--ir-indigo)] dark:text-[var(--ir-teal)] font-semibold hover:underline"
                      >
                        View All
                      </NavLink>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {DEMO_ALERTS.slice(0, 3).map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            navigate(`/alerts/${alert.id}`);
                          }}
                          className="p-2.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-red-600 dark:text-red-400">
                              {alert.severity} • {alert.station_code}
                            </span>
                            <span className="text-[var(--text-faint)] tabular-nums">
                              {alert.hours_remaining}h left
                            </span>
                          </div>
                          <div className="text-xs font-medium text-[var(--text-main)] truncate">
                            {alert.parameter_name}: {alert.sample_value}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                            {alert.source_type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors border border-transparent hover:border-[var(--border-base)]"
              title={isDark ? "Switch to Presentation Light Mode" : "Switch to Command Dark Mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-700" />
              )}
            </button>
          </div>
        </header>

        {/* SIMULATED ALERT TOAST (Triggered by Demo button) */}
        <AnimatePresence>
          {simulatedAlertToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-6 z-50 max-w-md p-4 rounded-xl border border-red-500 bg-red-600 text-white shadow-2xl flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs uppercase tracking-wider text-red-100">
                  ⚡ Live Simulation Broadcast
                </div>
                <div className="text-xs font-semibold mt-1 leading-snug">
                  {simulatedAlertToast}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setSimulatedAlertToast(null);
                      navigate("/escalations");
                    }}
                    className="text-[11px] font-bold bg-white text-red-700 px-2.5 py-1 rounded shadow-xs hover:bg-red-50"
                  >
                    View Escalation Ladder
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSimulatedAlertToast(null)}
                className="text-red-200 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[var(--bg-canvas)] flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>

          {/* QUIET CIVIC FOOTER WITH CREDIT LINE */}
          <footer className="border-t border-[var(--border-base)] bg-[var(--bg-surface)] py-3 px-6 text-center text-[11px] text-[var(--text-faint)] flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[var(--ir-indigo)] dark:text-[var(--ir-teal)]" />
              <span>Ministry of Railways · Government of India · Integrated Water Surveillance</span>
            </div>
            <div className="font-medium text-[var(--text-muted)] tracking-wide">
              Done by Niranjan R | Arun Karthick P | Madhan Kumar S
            </div>
          </footer>
        </main>
      </div>

      {/* -------------------------------------------------------------
          3. GLOBAL STATION COMMAND PALETTE (Ctrl+K MODAL)
          ------------------------------------------------------------- */}
      <AnimatePresence>
        {isCommandOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-command)] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Search Input Bar */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-base)]">
                <Search className="h-5 w-5 text-[var(--ir-indigo)] dark:text-[var(--ir-teal)] flex-shrink-0" />
                <input
                  ref={commandInputRef}
                  type="text"
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  placeholder="Type a station name, code (e.g. MAS, NDLS, HWH) or division..."
                  className="flex-1 bg-transparent text-sm text-[var(--text-main)] placeholder-[var(--text-faint)] outline-none"
                />
                <button
                  onClick={() => setIsCommandOpen(false)}
                  className="text-xs px-2 py-1 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  ESC
                </button>
              </div>

              {/* Search Results */}
              <div className="p-3 max-h-96 overflow-y-auto space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)] px-2 py-1">
                  Indian Railways Stations Directory
                </div>
                {filteredStations.map((station) => (
                  <div
                    key={station.code}
                    onClick={() => handleSelectStation(station.code)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--bg-subtle)] cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-[var(--ir-indigo)]/10 text-[var(--ir-indigo)] dark:text-[var(--ir-teal)] flex items-center justify-center font-display font-bold text-xs flex-shrink-0">
                        {station.code}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-main)] truncate group-hover:text-[var(--ir-indigo)] dark:group-hover:text-[var(--ir-teal)]">
                          {station.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {station.division_code} Div · {station.zone_code} · {station.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`status-chip text-[10px] ${
                          station.status === "COMPLIANT"
                            ? "status-chip-compliant"
                            : station.status === "DUE"
                            ? "status-chip-attention"
                            : station.status === "OVERDUE"
                            ? "status-chip-overdue"
                            : "status-chip-unfit"
                        }`}
                      >
                        {station.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[var(--text-faint)] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-2.5 border-t border-[var(--border-base)] bg-[var(--bg-subtle)] flex items-center justify-between text-[11px] text-[var(--text-faint)]">
                <span>Select a station to inspect water sources, chlorine ppm & lab records</span>
                <span className="font-mono">Total {DEMO_STATIONS.length} Stations Online</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
