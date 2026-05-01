// App.jsx — Hoofd routing en authenticatie-bewaking voor BYT Studio
import { useState, useEffect } from 'react'
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
import Boilerplates from './pages/Boilerplates'
import BoilerplateDetail from './pages/BoilerplateDetail'
import AdresConfigurator from './pages/AdresConfigurator'
import Intake from './pages/Intake'

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN')  setUser(session?.user ?? null)
      if (event === 'SIGNED_OUT') setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Laden
  if (user === undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 24, background: '#0a0a0a' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '12px 24px' }}>
          <img src="/logo-byt.png" alt="Build Your Tools" style={{ height: 52, objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #78C833', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#78C833', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Laden</span>
        </div>
      </div>
    )
  }

  // Niet ingelogd
  if (user === null) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Ingelogd
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar user={user} onLogout={() => setUser(null)} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Banner />
        <TopBar />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '24px' }}>
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
              <Route path="/handleidingen"       element={<Handleidingen />} />
              <Route path="/handleidingen/nieuw" element={<HandleidingNieuw />} />
              <Route path="/handleidingen/:id"   element={<HandleidingDetail />} />
              <Route path="/facturen"      element={<Facturen />} />
              <Route path="/facturen/nieuw" element={<FactuurNieuw />} />
              <Route path="/facturen/:id"  element={<FactuurDetail />} />
              <Route path="/boilerplates"  element={<Boilerplates />} />
              <Route path="/boilerplates/:id" element={<BoilerplateDetail />} />
              <Route path="/projecten/:id/adres-configurator" element={<AdresConfigurator />} />
              <Route path="/projecten/:id/intake" element={<Intake />} />
              <Route path="/instellingen"  element={<Instellingen />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}
