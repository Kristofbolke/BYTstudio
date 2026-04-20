// TopBar.jsx — Premium BYT-branded topbalk
import { useLocation, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ChevronRight } from 'lucide-react'

const BYT_GREEN = '#78C833'

const paginaConfig = {
  '/dashboard':     { label: 'Dashboard',     subtitel: 'Overzicht van je projecten' },
  '/klanten':       { label: 'Klanten',        subtitel: 'Beheer je klantenfiche' },
  '/projecten':     { label: 'Projecten',      subtitel: 'Al je projecten op één plek' },
  '/studio':        { label: 'Studio',         subtitel: 'Configureer klant-apps' },
  '/offertes':      { label: 'Offertes',       subtitel: 'Offertes en facturatie' },
  '/handleidingen': { label: 'Handleidingen',  subtitel: 'Technische documentatie' },
  '/instellingen':  { label: 'Instellingen',   subtitel: 'App-configuratie' },
}

export default function TopBar() {
  const { pathname } = useLocation()
  const [email, setEmail] = useState('')
  const [naam, setNaam] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? '')
        setNaam(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'B')
      }
    })
  }, [])

  // Bepaal breadcrumb
  const rootPath = '/' + pathname.split('/')[1]
  const config = paginaConfig[rootPath] ?? { label: 'BYT Studio', subtitel: '' }
  const isDetail = pathname.split('/').length > 2

  const initialen = naam
    ? naam.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : email
    ? email[0].toUpperCase()
    : 'BT'

  return (
    <header className="flex-shrink-0 bg-white flex items-center justify-between px-6"
      style={{ height: 56, borderBottom: '1px solid #f0f0f0' }}>

      {/* Links: breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          to={rootPath}
          className="font-semibold text-gray-800 hover:text-gray-600 transition-colors"
        >
          {config.label}
        </Link>
        {isDetail && (
          <>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-400">Detail</span>
          </>
        )}
        {config.subtitel && !isDetail && (
          <>
            <span className="text-gray-200 mx-1">·</span>
            <span className="text-xs text-gray-400 hidden md:block">{config.subtitel}</span>
          </>
        )}
      </div>

      {/* Rechts: gebruiker */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-medium text-gray-700 leading-none">{naam || email}</span>
          {naam && <span className="text-xs text-gray-400 mt-0.5">{email}</span>}
        </div>

        {/* Avatar met BYT-green + code-brackets stijl */}
        <div className="relative">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${BYT_GREEN}, #5aab1a)` }}
          >
            {initialen}
          </div>
          {/* Online indicator */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ background: BYT_GREEN }}
          />
        </div>
      </div>

    </header>
  )
}
