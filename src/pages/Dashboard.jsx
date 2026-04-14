// Dashboard.jsx — Overzichtspagina met statistieken en snelkoppelingen
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FolderKanban, FileText, BookOpen, ArrowRight, Bug } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'

const statCards = [
  { label: 'Klanten',           tabel: 'klanten',       kleur: '#e94560', icon: Users },
  { label: 'Projecten',         tabel: 'projecten',     kleur: '#3b82f6', icon: FolderKanban },
  { label: 'Open offertes',     tabel: 'offertes',      kleur: '#f59e0b', icon: FileText, filter: { status: 'concept' } },
  { label: 'Handleidingen',     tabel: 'handleidingen', kleur: '#10b981', icon: BookOpen },
]

const snelLinks = [
  { label: 'Nieuwe klant',         to: '/klanten',       kleur: '#e94560' },
  { label: 'Nieuw project',        to: '/projecten',     kleur: '#3b82f6' },
  { label: 'Nieuwe offerte',       to: '/offertes',      kleur: '#f59e0b' },
  { label: 'Nieuwe handleiding',   to: '/handleidingen', kleur: '#10b981' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({})

  useEffect(() => {
    async function laadStats() {
      const resultaten = {}
      for (const { label, tabel, filter } of statCards) {
        let query = supabase.from(tabel).select('id', { count: 'exact', head: true })
        if (filter) {
          Object.entries(filter).forEach(([k, v]) => { query = query.eq(k, v) })
        }
        const { count } = await query
        resultaten[label] = count ?? 0
      }
      setStats(resultaten)
    }
    laadStats()
  }, [])

  return (
    <PageWrapper
      title="Dashboard"
      description="Welkom in BYT Studio — jouw intern productieplatform."
    >
      {/* Stat-kaarten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, kleur, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: kleur + '18' }}>
                <Icon size={15} style={{ color: kleur }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: kleur }}>
              {stats[label] ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Snelkoppelingen */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Snel starten</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {snelLinks.map(({ label, to, kleur }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: kleur }}
            >
              {label}
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Open bugs placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bug size={15} className="text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">Open bugmeldingen</p>
        </div>
        <p className="text-sm text-gray-400">Nog geen openstaande bugmeldingen.</p>
      </div>
    </PageWrapper>
  )
}
