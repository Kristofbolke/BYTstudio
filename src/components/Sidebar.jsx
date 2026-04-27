// Sidebar.jsx — Premium BYT-branded navigatiesidebar
import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, FolderKanban, Layers,
  FileText, BookOpen, Settings, LogOut, Receipt, Package,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/klanten',       label: 'Klanten',        icon: Users },
  { to: '/projecten',     label: 'Projecten',      icon: FolderKanban },
  { to: '/studio',        label: 'Studio',         icon: Layers },
  { to: '/boilerplates',  label: 'Boilerplates',   icon: Package },
  { to: '/offertes',      label: 'Offertes',       icon: FileText },
  { to: '/facturen',      label: 'Facturen',       icon: Receipt },
  { to: '/handleidingen', label: 'Handleidingen',  icon: BookOpen },
  { to: '/instellingen',  label: 'Instellingen',   icon: Settings },
]

// BYT brand green
const BYT_GREEN = '#78C833'

export default function Sidebar() {
  const navigate = useNavigate()
  const [vervallenCount, setVervallenCount] = useState(0)

  useEffect(() => {
    supabase.from('facturen')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'vervallen')
      .then(({ count }) => setVervallenCount(count ?? 0))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen" style={{ background: '#0a0a0a' }}>

      {/* ── Logo gebied ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4">
        {/* Wit logo-kader */}
        <div className="rounded-xl overflow-hidden bg-white px-3 py-2.5 shadow-lg">
          <img
            src="/logo-byt.png"
            alt="Build Your Tools"
            className="w-full object-contain"
            style={{ height: 48 }}
          />
        </div>

        {/* Studio badge */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <span style={{ color: BYT_GREEN, fontSize: 11, fontWeight: 700, opacity: 0.6 }}>&lt;</span>
          <span
            className="text-xs font-bold tracking-[0.2em] uppercase"
            style={{ color: BYT_GREEN }}
          >
            Studio
          </span>
          <span style={{ color: BYT_GREEN, fontSize: 11, fontWeight: 700, opacity: 0.6 }}>&gt;</span>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="mx-4 mb-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* ── Navigatie ───────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative"
            style={({ isActive }) => ({
              color: isActive ? BYT_GREEN : '#6b7280',
              background: isActive ? `${BYT_GREEN}12` : 'transparent',
              borderLeft: isActive ? `3px solid ${BYT_GREEN}` : '3px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2 : 1.75}
                  style={{ color: isActive ? BYT_GREEN : '#6b7280', flexShrink: 0 }}
                  className="transition-colors"
                />
                <span className="transition-colors group-hover:text-white flex-1"
                  style={{ color: 'inherit' }}>
                  {label}
                </span>
                {/* Vervallen badge voor Facturen */}
                {to === '/facturen' && vervallenCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: '#dc2626' }}>
                    {vervallenCount > 99 ? '99+' : vervallenCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Versie indicator ────────────────────────────────────────────────── */}
      <div className="mx-4 mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
          style={{ background: BYT_GREEN }} />
        <span className="text-xs" style={{ color: '#4b5563' }}>BYT Studio</span>
        <span className="text-xs ml-auto" style={{ color: '#374151' }}>v2.0</span>
      </div>

      {/* ── Uitloggen ───────────────────────────────────────────────────────── */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-150 group"
          style={{ color: '#4b5563' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={16} strokeWidth={1.75} />
          Uitloggen
        </button>
      </div>

    </aside>
  )
}
