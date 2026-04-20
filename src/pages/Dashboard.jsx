// Dashboard.jsx — Startpagina met live statistieken uit Supabase
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Users, FolderKanban, FileText, CheckCircle, ArrowRight, Bug, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { useInstellingen } from '../context/InstellingenContext'

// ── Status configuraties ───────────────────────────────────────────────────
const PROJECT_STATUSSEN = {
  intake:          { label: 'Intake',          kleur: '#64748b', bg: '#f1f5f9' },
  offerte:         { label: 'Offerte',          kleur: '#d97706', bg: '#fef9ee' },
  in_ontwikkeling: { label: 'In ontwikkeling',  kleur: '#2563eb', bg: '#eff6ff' },
  afgeleverd:      { label: 'Afgeleverd',       kleur: '#16a34a', bg: '#f0fdf4' },
  onderhoud:       { label: 'Onderhoud',        kleur: '#7c3aed', bg: '#faf5ff' },
}

const OFFERTE_STATUSSEN = {
  concept:      { label: 'Concept',      kleur: '#64748b', bg: '#f1f5f9' },
  verzonden:    { label: 'Verzonden',     kleur: '#2563eb', bg: '#dbeafe' },
  goedgekeurd:  { label: 'Goedgekeurd',  kleur: '#16a34a', bg: '#dcfce7' },
  gefactureerd: { label: 'Gefactureerd', kleur: '#7c3aed', bg: '#ede9fe' },
}

function StatusBadge({ status, map }) {
  const s = map[status] ?? { label: status, kleur: '#64748b', bg: '#f1f5f9' }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ color: s.kleur, background: s.bg }}>
      {s.label}
    </span>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────
function begroeting() {
  const uur = new Date().getHours()
  if (uur < 12) return 'Goedemorgen'
  if (uur < 18) return 'Goedemiddag'
  return 'Goedenavond'
}

function datumVandaag() {
  return new Date().toLocaleDateString('nl-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function beginVanMaand() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function fmt(n) {
  return Number(n).toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ── Stat-kaart ─────────────────────────────────────────────────────────────
function StatKaart({ label, getal, subtekst, kleur, bg, icon: Icon, laden, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-left w-full transition-shadow hover:shadow-md group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={16} style={{ color: kleur }} />
        </div>
        <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
      </div>
      {laden ? (
        <div className="space-y-2">
          <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-3xl font-bold tracking-tight" style={{ color: kleur }}>{getal}</p>
          <p className="text-xs text-gray-400 mt-1">{subtekst}</p>
        </>
      )}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3">{label}</p>
    </button>
  )
}

// ── Hoofd component ────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { instellingen } = useInstellingen()

  const [ladenKlanten,   setLadenKlanten]   = useState(true)
  const [ladenProjecten, setLadenProjecten] = useState(true)
  const [ladenOffertes,  setLadenOffertes]  = useState(true)
  const [ladenAfgel,     setLadenAfgel]     = useState(true)

  const [recenteProjecten,    setRecenteProjecten]    = useState([])
  const [ladenRecente,        setLadenRecente]        = useState(true)
  const [openOfferteRijen,    setOpenOfferteRijen]    = useState([])
  const [ladenOpenOffertes,   setLadenOpenOffertes]   = useState(true)

  const [totalKlanten,    setTotalKlanten]    = useState(0)
  const [klantDezeMaand,  setKlantDezeMaand]  = useState(0)
  const [actieveProj,     setActieveProj]     = useState(0)
  const [inOntwikkeling,  setInOntwikkeling]  = useState(0)
  const [openOffertes,    setOpenOffertes]    = useState(0)
  const [offerteWaarde,   setOfferteWaarde]   = useState(0)
  const [afgelProj,       setAfgelProj]       = useState(0)
  const [inOnderhoud,     setInOnderhoud]     = useState(0)

  useEffect(() => {
    // ── 1. Klanten ──────────────────────────────────────────────────────────
    Promise.all([
      supabase.from('klanten').select('id', { count: 'exact', head: true }),
      supabase.from('klanten').select('id', { count: 'exact', head: true }).gte('aangemaakt_op', beginVanMaand()),
    ]).then(([totaal, maand]) => {
      setTotalKlanten(totaal.count ?? 0)
      setKlantDezeMaand(maand.count ?? 0)
      setLadenKlanten(false)
    })

    // ── 2. Actieve projecten ────────────────────────────────────────────────
    Promise.all([
      supabase.from('projecten').select('id', { count: 'exact', head: true })
        .in('status', ['intake', 'offerte', 'in_ontwikkeling']),
      supabase.from('projecten').select('id', { count: 'exact', head: true })
        .eq('status', 'in_ontwikkeling'),
    ]).then(([actief, ontwikk]) => {
      setActieveProj(actief.count ?? 0)
      setInOntwikkeling(ontwikk.count ?? 0)
      setLadenProjecten(false)
    })

    // ── 3. Openstaande offertes ─────────────────────────────────────────────
    supabase.from('offertes')
      .select('items_json, marge, btw')
      .in('status', ['concept', 'verzonden'])
      .then(({ data, count }) => {
        const lijst = data ?? []
        setOpenOffertes(lijst.length)
        const waarde = lijst.reduce((som, o) => {
          const items = Array.isArray(o.items_json) ? o.items_json : []
          const subtotaal = items.reduce((s, i) => s + (Number(i.hoeveelheid) || 0) * (Number(i.eenheidsprijs) || 0), 0)
          const marge = subtotaal * ((Number(o.marge) || 0) / 100)
          return som + subtotaal + marge
        }, 0)
        setOfferteWaarde(waarde)
        setLadenOffertes(false)
      })

    // ── 4. Afgeleverde projecten ────────────────────────────────────────────
    Promise.all([
      supabase.from('projecten').select('id', { count: 'exact', head: true })
        .in('status', ['afgeleverd', 'onderhoud']),
      supabase.from('projecten').select('id', { count: 'exact', head: true })
        .eq('status', 'onderhoud'),
    ]).then(([afgel, onderh]) => {
      setAfgelProj(afgel.count ?? 0)
      setInOnderhoud(onderh.count ?? 0)
      setLadenAfgel(false)
    })

    // ── 5. Recente projecten ────────────────────────────────────────────────
    supabase.from('projecten')
      .select('id, naam, status, bijgewerkt_op, klanten(naam)')
      .order('bijgewerkt_op', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRecenteProjecten(data ?? [])
        setLadenRecente(false)
      })

    // ── 6. Openstaande offertes ─────────────────────────────────────────────
    supabase.from('offertes')
      .select('id, nummer, status, geldig_tot, items_json, btw, marge, klanten(naam), projecten(naam)')
      .in('status', ['concept', 'verzonden'])
      .order('aangemaakt_op', { ascending: false })
      .then(({ data }) => {
        setOpenOfferteRijen(data ?? [])
        setLadenOpenOffertes(false)
      })
  }, [])

  const naam = instellingen.eigenaar_naam
    ? `, ${instellingen.eigenaar_naam.split(' ')[0]}`
    : ''

  return (
    <PageWrapper title="Dashboard" description="">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {begroeting()}{naam}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{datumVandaag()}</p>
        </div>
      </div>

      {/* ── Statistiekenrij ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKaart
          label="Klanten"
          getal={totalKlanten}
          subtekst={`+ ${klantDezeMaand} deze maand`}
          kleur="#3b82f6"
          bg="#3b82f615"
          icon={Users}
          laden={ladenKlanten}
          onClick={() => navigate('/klanten')}
        />
        <StatKaart
          label="Actieve projecten"
          getal={actieveProj}
          subtekst={`${inOntwikkeling} in ontwikkeling`}
          kleur="#8b5cf6"
          bg="#8b5cf615"
          icon={FolderKanban}
          laden={ladenProjecten}
          onClick={() => navigate('/projecten')}
        />
        <StatKaart
          label="Openstaande offertes"
          getal={openOffertes}
          subtekst={`Totale waarde: € ${fmt(offerteWaarde)}`}
          kleur="#f59e0b"
          bg="#f59e0b15"
          icon={FileText}
          laden={ladenOffertes}
          onClick={() => navigate('/offertes')}
        />
        <StatKaart
          label="Afgeleverde projecten"
          getal={afgelProj}
          subtekst={`${inOnderhoud} in onderhoud`}
          kleur="#10b981"
          bg="#10b98115"
          icon={CheckCircle}
          laden={ladenAfgel}
          onClick={() => navigate('/projecten')}
        />
      </div>

      {/* ── Snel starten ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Snel starten</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Nieuwe klant',       to: '/klanten',            kleur: '#3b82f6' },
            { label: 'Nieuw project',      to: '/projecten',          kleur: '#8b5cf6' },
            { label: 'Nieuwe offerte',     to: '/offertes/nieuw',     kleur: '#f59e0b' },
            { label: 'Nieuwe handleiding', to: '/handleidingen/nieuw', kleur: '#10b981' },
          ].map(({ label, to, kleur }) => (
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

      {/* ── Recente projecten ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-800">Recente projecten</p>
          <Link to="/projecten" className="text-xs text-[#e94560] hover:underline font-medium">
            Alle projecten →
          </Link>
        </div>

        {ladenRecente ? (
          <div className="px-6 py-4 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : recenteProjecten.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400 mb-3">Nog geen projecten aangemaakt.</p>
            <button
              onClick={() => navigate('/projecten')}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ background: '#8b5cf6' }}
            >
              Eerste project aanmaken
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-50">
                <th className="text-left px-6 py-3">Project</th>
                <th className="text-left px-3 py-3">Klant</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Bijgewerkt</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recenteProjecten.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-800">
                    <Link to={`/projecten/${p.id}`} className="hover:text-[#e94560] transition-colors">
                      {p.naam}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-gray-500">{p.klanten?.naam ?? '—'}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={p.status} map={PROJECT_STATUSSEN} />
                  </td>
                  <td className="px-3 py-3 text-gray-400 text-xs">
                    {p.bijgewerkt_op
                      ? new Date(p.bijgewerkt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      to={`/projecten/${p.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:border-[#e94560] hover:text-[#e94560] transition-colors"
                    >
                      <ExternalLink size={11} /> Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Openstaande offertes ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-800">Openstaande offertes</p>
          <Link to="/offertes" className="text-xs text-[#e94560] hover:underline font-medium">
            Alle offertes →
          </Link>
        </div>

        {ladenOpenOffertes ? (
          <div className="px-6 py-4 space-y-3">
            {[1,2].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : openOfferteRijen.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Geen openstaande offertes.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-50">
                <th className="text-left px-6 py-3">Nummer</th>
                <th className="text-left px-3 py-3">Klant</th>
                <th className="text-left px-3 py-3">Project</th>
                <th className="text-right px-3 py-3">Totaal incl. BTW</th>
                <th className="text-left px-3 py-3">Geldig tot</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {openOfferteRijen.map(o => {
                const items = Array.isArray(o.items_json) ? o.items_json : []
                const sub = items.reduce((s, i) => s + (Number(i.hoeveelheid) || 0) * (Number(i.eenheidsprijs) || 0), 0)
                const metMarge = sub * (1 + (Number(o.marge) || 0) / 100)
                const totaal = metMarge * (1 + (Number(o.btw) || 0) / 100)

                const nu = new Date(); nu.setHours(0,0,0,0)
                const geldig = o.geldig_tot ? new Date(o.geldig_tot) : null
                const dagVerschil = geldig ? Math.ceil((geldig - nu) / 86400000) : null
                const verlopen = geldig && dagVerschil < 0
                const bijna = geldig && dagVerschil >= 0 && dagVerschil <= 7

                return (
                  <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">
                      <Link to={`/offertes/${o.id}`} className="hover:text-[#e94560] transition-colors">
                        {o.nummer ?? '—'}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{o.klanten?.naam ?? '—'}</td>
                    <td className="px-3 py-3 text-gray-500">{o.projecten?.naam ?? '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-800">
                      € {fmt(totaal)}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      {geldig ? (
                        <span style={{ color: verlopen ? '#dc2626' : bijna ? '#d97706' : '#6b7280' }}>
                          {geldig.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {verlopen && ' (Verlopen)'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={o.status} map={OFFERTE_STATUSSEN} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Open bugmeldingen ──────────────────────────────────────────────── */}
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
