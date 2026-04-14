// Sidebar.jsx — Navigatiesidebar met BYT Studio branding en actieve statussen
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, FolderKanban, Layers,
  FileText, BookOpen, Settings, LogOut
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/klanten',       label: 'Klanten',         icon: Users },
  { to: '/projecten',     label: 'Projecten',       icon: FolderKanban },
  { to: '/studio',        label: 'Studio',          icon: Layers },
  { to: '/offertes',      label: 'Offertes',        icon: FileText },
  { to: '/handleidingen', label: 'Handleidingen',   icon: BookOpen },
  { to: '/instellingen',  label: 'Instellingen',    icon: Settings },
]

export default function Sidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-screen"
      style={{ background: '#0f172a' }}
    >
      {/* Branding */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#e94560' }}
          >
            <span className="text-white font-black text-sm">B</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">BYT Studio</p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Build Your Tools</p>
          </div>
        </div>
      </div>

      {/* Navigatie */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'hover:bg-white/5 hover:text-white'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? '#ffffff' : '#94a3b8' })}
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Uitloggen */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-150 hover:bg-white/5 hover:text-white"
          style={{ color: '#94a3b8' }}
        >
          <LogOut size={16} strokeWidth={1.75} />
          Uitloggen
        </button>
      </div>
    </aside>
  )
}
