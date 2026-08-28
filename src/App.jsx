// App.jsx — Hoofd routing en authenticatie-bewaking voor BYT Studio
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import AppHeader from './components/AppHeader'
import SplashScreen from './components/SplashScreen'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Klanten from './pages/Klanten'
import KlantDetail from './pages/KlantDetail'
import Projecten from './pages/Projecten'
import ProjectDetail from './pages/ProjectDetail'
import IntakeDetail from './pages/IntakeDetail'
import HuisstijlBriefing from './pages/HuisstijlBriefing'
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
import Vragenlijst from './pages/Vragenlijst'
import IntakePubliek from './pages/IntakePubliek'
import WachtwoordInstellen from './pages/WachtwoordInstellen'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [splashDone, setSplashDone] = useState(false)

  // Publieke routes renderen altijd zonder app-shell, ongeacht auth-status
  const isPubliekeIntake = window.location.pathname.startsWith('/intake/')
  // Uitnodigings-/herstel-link: altijd volledig scherm tonen, ook al pikt supabase-js
  // automatisch een sessie op uit de link (anders zou de gebruiker naar het dashboard
  // springen zonder ooit een wachtwoord te kiezen).
  const isWachtwoordInstellen = window.location.pathname.startsWith('/wachtwoord-instellen')

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

  // Publieke intake-pagina — altijd tonen, ook tijdens laden en zonder login
  if (isPubliekeIntake) {
    return (
      <Routes>
        <Route path="/intake/:token" element={<IntakePubliek />} />
      </Routes>
    )
  }

  // Wachtwoord-instellen (uitnodiging / herstel) — altijd volledig scherm, buiten de app-shell
  if (isWachtwoordInstellen) {
    return (
      <Routes>
        <Route path="/wachtwoord-instellen" element={<WachtwoordInstellen />} />
      </Routes>
    )
  }

  // Splash screen — tonen zolang niet klaar
  if (!splashDone) {
    return <SplashScreen authReady={user !== undefined} onDone={() => setSplashDone(true)} />
  }

  // Niet ingelogd
  if (user === null) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/vragenlijst/:token" element={<Vragenlijst />} />
        <Route path="/intake/:token" element={<IntakePubliek />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Ingelogd
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppHeader />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Sidebar user={user} onLogout={() => setUser(null)} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <TopBar />
          <main style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '24px' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"     element={<Dashboard />} />
              <Route path="/klanten"       element={<Klanten />} />
              <Route path="/klanten/:id"   element={<KlantDetail />} />
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
              <Route path="/projecten/:id/intake-detail" element={<IntakeDetail />} />
              <Route path="/projecten/:id/huisstijl-briefing" element={<HuisstijlBriefing />} />
              <Route path="/vragenlijst/:token" element={<Vragenlijst />} />
              <Route path="/instellingen"  element={<Instellingen />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
          </main>
        </div>
      </div>
    </div>
  )
}
