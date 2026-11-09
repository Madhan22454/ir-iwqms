import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import Stations from './pages/Stations'
import StationProfile from './pages/StationProfile'
import WaterSources from './pages/WaterSources'
import SamplingManagement from './pages/SamplingManagement'
import DisinfectionManagement from './pages/DisinfectionManagement'
import Escalations from './pages/Escalations'
import Analytics from './pages/Analytics'
import { MasterData } from './pages/MasterData'
import { HealthCard } from './pages/HealthCard'
import LabResultEntry from './pages/LabResultEntry'
import AlertCentre from './pages/AlertCentre'
import AlertDetail from './pages/AlertDetail'
import AlertNotice from './pages/AlertNotice'
import CorrectiveActions from './pages/CorrectiveActions'
import AuditTrail from './pages/AuditTrail'
import Notifications from './pages/Notifications'
import GISMap from './pages/GISMap'
import Reports from './pages/Reports'
import UserManagement from './pages/UserManagement'
import './App.css'

function RoleGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    )
  }
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ width: 44, height: 44, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      {/* Alert Notice — standalone printable page (no sidebar layout) */}
      <Route path="/alerts/:id/notice" element={
        <ProtectedRoute><AlertNotice /></ProtectedRoute>
      } />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Core & Surveillance */}
        <Route index element={<Dashboard />} />
        <Route path="gis" element={<GISMap />} />
        <Route path="stations" element={<Stations />} />
        <Route path="stations/:id" element={<StationProfile />} />
        <Route path="water-sources" element={<WaterSources />} />

        {/* Quality & Operations */}
        <Route path="sampling" element={<SamplingManagement />} />
        <Route path="lab/result-entry" element={<LabResultEntry />} />
        <Route path="disinfection" element={<DisinfectionManagement />} />
        <Route path="alerts" element={<AlertCentre />} />
        <Route path="alerts/:id" element={<AlertDetail />} />
        <Route path="corrective-actions" element={<CorrectiveActions />} />
        <Route path="escalations" element={<Escalations />} />

        {/* Analytics & Governance */}
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="healthcard" element={<HealthCard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="audit" element={<AuditTrail />} />
        <Route path="master-data" element={<MasterData />} />
        <Route path="users" element={<RoleGuard allowedRoles={['CENTRAL_ADMIN']}><UserManagement /></RoleGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
