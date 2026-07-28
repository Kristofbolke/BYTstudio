// Sidebar.jsx
import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, FolderKanban, Layers,
  FileText, BookOpen, Settings, LogOut, Receipt, Package,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const BYT_GREEN = '#22C35D'

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
      width: 220,
      background: '#0B0F0E',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
      position: 'relative',
    }}>

      {/* MARK — compact merkteken bovenaan de navigatie */}
      <div style={{ padding: '16px 16px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <img
          src="/assets/mark/mark-tile.svg"
          alt=""
          style={{ width: 24, height: 24, objectFit: 'contain' }}
        />
        <span style={{
          color: BYT_GREEN, fontSize: 10, fontWeight: 600,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          Studio
        </span>
      </div>

      {/* DIVIDER */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px 8px' }} />

      {/* NAVIGATIE — scrollbaar */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 12px',
        minHeight: 0,
        maxHeight: 'calc(100% - 120px)',
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
