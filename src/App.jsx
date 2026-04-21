// App.jsx — Hoofd routing en authenticatie-bewaking voor BYT Studio
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Banner from './components/Banner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Klanten from './pages/Klanten'
import Projecten from './pages/Projecten'
import ProjectDetail from './pages/ProjectDetail'
import Studio from './pages/Studio'
import Offertes from './pages/Offertes'
import OfferteNieuw from './pages/OfferteNieuw'
import OfferteDetail from './pages/OfferteDetail'
import Handleidingen from './pages/Handleidingen'
import HandleidingDetail from './pages/HandleidingDetail'
import HandleidingNieuw from './pages/HandleidingNieuw'
import Instellingen from './pages/Instellingen'
import Facturen from './pages/Facturen'
import FactuurNieuw from './pages/FactuurNieuw'
import FactuurDetail from './pages/FactuurDetail'

function ProtectedLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Banner />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <TopBar />
          <div style={{ padding: '24px' }}>
            {children}
          </div>
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
      <div className="flex flex-col items-center justify-center h-screen gap-6" style={{ background: '#0a0a0a' }}>
        <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl">
          <img src="/logo-byt.png" alt="Build Your Tools" style={{ height: 52, objectFit: 'contain' }} />
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#78C833', borderTopColor: 'transparent' }}
          />
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#78C833' }}>
            Laden
          </span>
        </div>
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
        <Route path="/projecten/:id" element={<ProjectDetail />} />
        <Route path="/studio"        element={<Studio />} />
        <Route path="/offertes"      element={<Offertes />} />
        <Route path="/offertes/nieuw" element={<OfferteNieuw />} />
        <Route path="/offertes/:id"  element={<OfferteDetail />} />
        <Route path="/handleidingen"          element={<Handleidingen />} />
        <Route path="/handleidingen/nieuw"    element={<HandleidingNieuw />} />
        <Route path="/handleidingen/:id"      element={<HandleidingDetail />} />
        <Route path="/facturen"           element={<Facturen />} />
        <Route path="/facturen/nieuw"    element={<FactuurNieuw />} />
        <Route path="/facturen/:id"      element={<FactuurDetail />} />
        <Route path="/instellingen"      element={<Instellingen />} />
        <Route path="*"              element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ProtectedLayout>
  )
}
