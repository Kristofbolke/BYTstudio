// Sidebar.jsx
import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, FolderKanban, Layers,
  FileText, BookOpen, Settings, LogOut, Receipt, Package,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const BYT_GREEN = '#78C833'

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/klanten',       label: 'Klanten',       icon: Users },
  { to: '/projecten',     label: 'Projecten',     icon: FolderKanban },
  { to: '/studio',        label: 'Studio',        icon: Layers },
  { to: '/boilerplates',  label: 'Boilerplates',  icon: Package },
  { to: '/offertes',      label: 'Offertes',      icon: FileText },
  { to: '/facturen',      label: 'Facturen',      icon: Receipt },
  { to: '/handleidingen', label: 'Handleidingen', icon: BookOpen },
  { to: '/instellingen',  label: 'Instellingen',  icon: Settings },
]

export default function Sidebar({ user, onLogout }) {
  const [vervallenCount, setVervallenCount] = useState(0)

  useEffect(() => {
    supabase
      .from('facturen')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'vervallen')
      .then(({ count }) => setVervallenCount(count ?? 0))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    onLogout()
  }

  return (
    <aside style={{
      width: 256,
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
      position: 'relative',
    }}>

      {/* LOGO */}
      <div style={{ padding: '20px 16px 16px', flexShrink: 0 }}>
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <img
            src="/logo-byt.png"
            alt="Build Your Tools"
            style={{ width: '100%', height: 48, objectFit: 'contain' }}
          />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 12,
        }}>
          <span style={{ color: BYT_GREEN, fontSize: 11, fontWeight: 700, opacity: 0.6 }}>&lt;</span>
          <span style={{ color: BYT_GREEN, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Studio</span>
          <span style={{ color: BYT_GREEN, fontSize: 11, fontWeight: 700, opacity: 0.6 }}>&gt;</span>
        </div>
      </div>

      {/* DIVIDER */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px 12px' }} />

      {/* NAVIGATIE — scrollbaar */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 12px',
        minHeight: 0,
        maxHeight: 'calc(100vh - 200px)',
      }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '9px 12px',
              borderRadius: 8,
              marginBottom: 2,
              textDecoration: 'none',
              fontSize: 13.5,
              fontWeight: 500,
              color: isActive ? BYT_GREEN : '#6b7280',
              background: isActive ? `${BYT_GREEN}12` : 'transparent',
              borderLeft: isActive ? `3px solid ${BYT_GREEN}` : '3px solid transparent',
              transition: 'all 0.15s',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2 : 1.75}
                  style={{ color: isActive ? BYT_GREEN : '#6b7280', flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>{label}</span>
                {to === '/facturen' && vervallenCount > 0 && (
                  <span style={{
                    background: '#dc2626',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 999,
                    flexShrink: 0,
                  }}>
                    {vervallenCount > 99 ? '99+' : vervallenCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* UITLOGGEN — altijd onderaan, nooit scrollbaar */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 12px 16px',
      }}>
        {user?.email && (
          <div style={{
            color: '#4b5563',
            fontSize: 11,
            padding: '4px 12px 8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {user.email}
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '9px 12px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#4b5563',
            fontSize: 13.5,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ef4444'
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#4b5563'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <LogOut size={16} strokeWidth={1.75} />
          Uitloggen
        </button>
      </div>

    </aside>
  )
}
