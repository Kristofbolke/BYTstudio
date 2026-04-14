// App.jsx — Hoofd routing en authenticatie-bewaking voor BYT Studio
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Klanten from './pages/Klanten'
import Projecten from './pages/Projecten'
import Studio from './pages/Studio'
import Offertes from './pages/Offertes'
import Handleidingen from './pages/Handleidingen'
import Instellingen from './pages/Instellingen'

function ProtectedLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f8fafc' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Laadscherm tijdens sessiecheck
  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0f172a' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#e94560', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  // Niet ingelogd → naar login
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Ingelogd → app
  return (
    <ProtectedLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/klanten"       element={<Klanten />} />
        <Route path="/projecten"     element={<Projecten />} />
        <Route path="/studio"        element={<Studio />} />
        <Route path="/offertes"      element={<Offertes />} />
        <Route path="/handleidingen" element={<Handleidingen />} />
        <Route path="/instellingen"  element={<Instellingen />} />
        <Route path="*"              element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ProtectedLayout>
  )
}
