// TopBar.jsx — Bovenste balk met paginatitel en ingelogde gebruiker
import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const pageTitles = {
  '/dashboard':     'Dashboard',
  '/klanten':       'Klanten',
  '/projecten':     'Projecten',
  '/studio':        'Studio',
  '/offertes':      'Offertes',
  '/handleidingen': 'Handleidingen',
  '/instellingen':  'Instellingen',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? '')
    })
  }, [])

  const title = pageTitles[pathname] ?? 'BYT Studio'
  const initiaal = email ? email[0].toUpperCase() : 'B'

  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white flex-shrink-0">
      <h1 className="text-sm font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-2.5">
        <span className="text-sm text-gray-400 hidden sm:block">{email}</span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: '#e94560' }}
        >
          {initiaal}
        </div>
      </div>
    </header>
  )
}
