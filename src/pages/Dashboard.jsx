// Dashboard.jsx — Startpagina met live statistieken uit Supabase
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Users, FolderKanban, FileText, CheckCircle, ArrowRight, Bug, ExternalLink,
  UserPlus, FolderPlus, FilePlus, Wrench, BookOpen, Settings, RefreshCw,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { useInstellingen } from '../context/InstellingenContext'
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

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
const STATUS_GRAFIEK = [
  { key: 'intake',          label: 'Intake',          kleur: '#94a3b8' },
  { key: 'offerte',         label: 'Offerte',         kleur: '#f59e0b' },
  { key: 'in_ontwikkeling', label: 'In ontwikkeling', kleur: '#3b82f6' },
  { key: 'afgeleverd',      label: 'Afgeleverd',      kleur: '#22c55e' },
  { key: 'onderhoud',       label: 'Onderhoud',       kleur: '#8b5cf6' },
]

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
function tijdNu() {
  return new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
}
function beginVanMaand() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}
function fmt(n) {
  return Number(n).toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
const MAANDEN_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
function berekenTotaalIncl(o) {
  const items = Array.isArray(o.items_json) ? o.items_json : []
  const sub = items.reduce((s, i) => s + (Number(i.hoeveelheid) || 0) * (Number(i.eenheidsprijs) || 0), 0)
  return sub * (1 + (Number(o.marge) || 0) / 100) * (1 + (Number(o.btw) || 0) / 100)
}
function laatste6Maanden() {
  const lijst = []
  const nu = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nu.getFullYear(), nu.getMonth() - i, 1)
    lijst.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MAANDEN_NL[d.getMonth()],
    })
  }
  return lijst
}

// ── UI componenten ─────────────────────────────────────────────────────────
function StatusBadge({ status, map }) {
  const s = map[status] ?? { label: status, kleur: '#64748b', bg: '#f1f5f9' }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ color: s.kleur, background: s.bg }}>{s.label}</span>
  )
}

function FoutBlok({ onHerlaad }) {
  return (
    <div className="px-6 py-4 text-xs text-red-500 flex items-center gap-2">
      Kon data niet laden.
      <button onClick={onHerlaad} className="underline hover:text-red-700 flex items-center gap-1">
        <RefreshCw size={11} /> Probeer opnieuw
      </button>
    </div>
  )
}

function StatKaart({ label, getal, subtekst, kleur, bg, icon: Icon, laden, fout, onHerlaad, onClick }) {
  return (
    <button onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-left w-full transition-shadow hover:shadow-md group">
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
      ) : fout ? (
        <p className="text-xs text-red-400 flex items-center gap-1 cursor-pointer" onClick={e => { e.stopPropagation(); onHerlaad() }}>
          <RefreshCw size={11} /> Probeer opnieuw
        </p>
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

function TabelSkeleton({ rijen = 4 }) {
  return (
    <div className="px-6 py-3 space-y-3">
      {Array.from({ length: rijen }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
          <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

// ── Hoofd component ────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { instellingen } = useInstellingen()

  // Paginatitel
  useEffect(() => { document.title = 'Dashboard — BYT Studio' }, [])

  // Live klok
  const [klok, setKlok] = useState(tijdNu)
  useEffect(() => {
    const t = setInterval(() => setKlok(tijdNu()), 60000)
    return () => clearInterval(t)
  }, [])

  // ── State statistiekenkaarten ──────────────────────────────────────────
  const [kaarten, setKaarten] = useState({
    klanten:   { laden: true, fout: false, totaal: 0, dezeMaand: 0 },
    projecten: { laden: true, fout: false, actief: 0, inOntwikkeling: 0 },
    offertes:  { laden: true, fout: false, open: 0, waarde: 0 },
    afgel:     { laden: true, fout: false, totaal: 0, onderhoud: 0 },
  })

  // ── State secties ──────────────────────────────────────────────────────
  const [recenteProj,       setRecenteProj]       = useState([])
  const [ladenRecente,      setLadenRecente]       = useState(true)
  const [foutRecente,       setFoutRecente]        = useState(false)

  const [openOffRijen,      setOpenOffRijen]       = useState([])
  const [ladenOpenOff,      setLadenOpenOff]       = useState(true)
  const [foutOpenOff,       setFoutOpenOff]        = useState(false)

  const [statusData,        setStatusData]         = useState(null)
  const [omzetData,         setOmzetData]          = useState(null)
  const [ladenGrafi,        setLadenGrafi]         = useState(true)
  const [foutGrafi,         setFoutGrafi]          = useState(false)

  const [meldingen,         setMeldingen]          = useState([])
  const [ladenMeld,         setLadenMeld]          = useState(true)
  const [foutMeld,          setFoutMeld]           = useState(false)

  const [legeApp,           setLegeApp]            = useState(false)

  // ── Laad-functies per sectie ───────────────────────────────────────────
  const laadKlanten = useCallback(async () => {
    setKaarten(p => ({ ...p, klanten: { ...p.klanten, laden: true, fout: false } }))
    try {
      const [totaal, maand] = await Promise.all([
        supabase.from('klanten').select('id', { count: 'exact', head: true }),
        supabase.from('klanten').select('id', { count: 'exact', head: true }).gte('aangemaakt_op', beginVanMaand()),
      ])
      if (totaal.error) throw totaal.error
      setKaarten(p => ({ ...p, klanten: { laden: false, fout: false, totaal: totaal.count ?? 0, dezeMaand: maand.count ?? 0 } }))
      return totaal.count ?? 0
    } catch { setKaarten(p => ({ ...p, klanten: { ...p.klanten, laden: false, fout: true } })); return 0 }
  }, [])

  const laadProjectenKaarten = useCallback(async () => {
    setKaarten(p => ({ ...p, projecten: { ...p.projecten, laden: true, fout: false }, afgel: { ...p.afgel, laden: true, fout: false } }))
    try {
      const [actief, ontwikk, afgel, onderh] = await Promise.all([
        supabase.from('projecten').select('id', { count: 'exact', head: true }).in('status', ['intake', 'offerte', 'in_ontwikkeling']),
        supabase.from('projecten').select('id', { count: 'exact', head: true }).eq('status', 'in_ontwikkeling'),
        supabase.from('projecten').select('id', { count: 'exact', head: true }).in('status', ['afgeleverd', 'onderhoud']),
        supabase.from('projecten').select('id', { count: 'exact', head: true }).eq('status', 'onderhoud'),
      ])
      if (actief.error) throw actief.error
      setKaarten(p => ({
        ...p,
        projecten: { laden: false, fout: false, actief: actief.count ?? 0, inOntwikkeling: ontwikk.count ?? 0 },
        afgel:     { laden: false, fout: false, totaal: afgel.count ?? 0,  onderhoud: onderh.count ?? 0 },
      }))
      return (actief.count ?? 0) + (afgel.count ?? 0)
    } catch {
      setKaarten(p => ({ ...p, projecten: { ...p.projecten, laden: false, fout: true }, afgel: { ...p.afgel, laden: false, fout: true } }))
      return 0
    }
  }, [])

  const laadOfferteKaart = useCallback(async () => {
    setKaarten(p => ({ ...p, offertes: { ...p.offertes, laden: true, fout: false } }))
    try {
      const { data, error } = await supabase.from('offertes').select('items_json, marge, btw').in('status', ['concept', 'verzonden'])
      if (error) throw error
      const lijst = data ?? []
      const waarde = lijst.reduce((som, o) => som + berekenTotaalIncl(o), 0)
      setKaarten(p => ({ ...p, offertes: { laden: false, fout: false, open: lijst.length, waarde } }))
    } catch { setKaarten(p => ({ ...p, offertes: { ...p.offertes, laden: false, fout: true } })) }
  }, [])

  const laadRecenteProjecten = useCallback(async () => {
    setLadenRecente(true); setFoutRecente(false)
    try {
      const { data, error } = await supabase.from('projecten')
        .select('id, naam, status, bijgewerkt_op, klanten(naam)')
        .order('bijgewerkt_op', { ascending: false }).limit(5)
      if (error) throw error
      setRecenteProj(data ?? [])
    } catch { setFoutRecente(true) }
    setLadenRecente(false)
  }, [])

  const laadOpenOffertes = useCallback(async () => {
    setLadenOpenOff(true); setFoutOpenOff(false)
    try {
      const { data, error } = await supabase.from('offertes')
        .select('id, nummer, status, geldig_tot, items_json, btw, marge, klanten(naam), projecten(naam)')
        .in('status', ['concept', 'verzonden'])
        .order('aangemaakt_op', { ascending: false })
      if (error) throw error
      setOpenOffRijen(data ?? [])
    } catch { setFoutOpenOff(true) }
    setLadenOpenOff(false)
  }, [])

  const laadGrafieken = useCallback(async () => {
    setLadenGrafi(true); setFoutGrafi(false)
    try {
      const zes = new Date(); zes.setMonth(zes.getMonth() - 6)
      const [projRes, offRes] = await Promise.all([
        supabase.from('projecten').select('status'),
        supabase.from('offertes').select('aangemaakt_op, items_json, btw, marge')
          .in('status', ['goedgekeurd', 'gefactureerd']).gte('aangemaakt_op', zes.toISOString()),
      ])
      if (projRes.error) throw projRes.error
      const telling = {}
      ;(projRes.data ?? []).forEach(p => { telling[p.status] = (telling[p.status] ?? 0) + 1 })
      setStatusData(Object.keys(telling).length > 0 ? {
        labels: STATUS_GRAFIEK.map(s => s.label),
        datasets: [{ data: STATUS_GRAFIEK.map(s => telling[s.key] ?? 0), backgroundColor: STATUS_GRAFIEK.map(s => s.kleur), borderWidth: 0, hoverOffset: 6 }],
        legendaItems: STATUS_GRAFIEK.map(s => ({ label: s.label, kleur: s.kleur, aantal: telling[s.key] ?? 0 })),
      } : null)
      const maanden = laatste6Maanden()
      const som = {}; maanden.forEach(m => { som[m.key] = 0 })
      ;(offRes.data ?? []).forEach(o => { const k = o.aangemaakt_op?.slice(0, 7); if (k && som[k] !== undefined) som[k] += berekenTotaalIncl(o) })
      setOmzetData(Object.values(som).some(v => v > 0) ? {
        labels: maanden.map(m => m.label),
        datasets: [{ label: 'Omzet incl. BTW', data: maanden.map(m => Math.round(som[m.key])), backgroundColor: '#e94560', borderRadius: 6, borderSkipped: false }],
      } : null)
    } catch { setFoutGrafi(true) }
    setLadenGrafi(false)
  }, [])

  const laadMeldingen = useCallback(async () => {
    setLadenMeld(true); setFoutMeld(false)
    try {
      const { data, error } = await supabase.from('bug_meldingen')
        .select('id, onderdeel, ernst, status, aangemaakt_op, projecten(id, naam)')
        .in('status', ['nieuw', 'in_behandeling'])
        .order('aangemaakt_op', { ascending: false }).limit(5)
      if (error) throw error
      setMeldingen(data ?? [])
    } catch { setFoutMeld(true) }
    setLadenMeld(false)
  }, [])

  // ── Alles laden + lege-app check ──────────────────────────────────────
  const laadAlles = useCallback(async () => {
    const [aantalKlanten, aantalProjecten] = await Promise.all([
      laadKlanten(),
      laadProjectenKaarten(),
      laadOfferteKaart(),
      laadRecenteProjecten(),
      laadOpenOffertes(),
      laadGrafieken(),
      laadMeldingen(),
    ])
    setLegeApp(aantalKlanten === 0 && aantalProjecten === 0)
  }, [laadKlanten, laadProjectenKaarten, laadOfferteKaart, laadRecenteProjecten, laadOpenOffertes, laadGrafieken, laadMeldingen])

  // ── Auto-refresh elke 5 minuten ────────────────────────────────────────
  useEffect(() => {
    laadAlles()
    const interval = setInterval(laadAlles, 300000)
    return () => clearInterval(interval)
  }, [laadAlles])

  const naam = instellingen.eigenaar_naam ? `, ${instellingen.eigenaar_naam.split(' ')[0]}` : ''
  const { klanten, projecten, offertes, afgel } = kaarten

  // ── Lege app staat ─────────────────────────────────────────────────────
  if (!klanten.laden && !projecten.laden && legeApp) {
    return (
      <PageWrapper title="" description="">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welkom bij BYT Studio</h1>
          <p className="text-gray-400 mb-10">Waar wil je beginnen?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {[
              { label: 'Eerste klant toevoegen', icon: UserPlus,  to: '/klanten',      kleur: '#3b82f6', bg: '#eff6ff' },
              { label: 'Instellingen invullen',   icon: Settings,  to: '/instellingen', kleur: '#e94560', bg: '#fff1f3' },
              { label: 'Studio verkennen',        icon: Wrench,    to: '/studio',       kleur: '#8b5cf6', bg: '#faf5ff' },
            ].map(({ label, icon: Icon, to, kleur, bg }) => (
              <button key={to} onClick={() => navigate(to)}
                className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon size={24} style={{ color: kleur }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{label}</span>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="" description="">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {begroeting()}{naam}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">{datumVandaag()}</p>
        </div>
        <p className="text-lg font-semibold text-gray-300 tabular-nums mt-1">{klok}</p>
      </div>

      {/* ── Statistiekenrij ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKaart label="Klanten" getal={klanten.totaal}
          subtekst={`+ ${klanten.dezeMaand} deze maand`}
          kleur="#3b82f6" bg="#3b82f615" icon={Users}
          laden={klanten.laden} fout={klanten.fout} onHerlaad={laadKlanten}
          onClick={() => navigate('/klanten')} />
        <StatKaart label="Actieve projecten" getal={projecten.actief}
          subtekst={`${projecten.inOntwikkeling} in ontwikkeling`}
          kleur="#8b5cf6" bg="#8b5cf615" icon={FolderKanban}
          laden={projecten.laden} fout={projecten.fout} onHerlaad={laadProjectenKaarten}
          onClick={() => navigate('/projecten')} />
        <StatKaart label="Openstaande offertes" getal={offertes.open}
          subtekst={`Totale waarde: € ${fmt(offertes.waarde)}`}
          kleur="#f59e0b" bg="#f59e0b15" icon={FileText}
          laden={offertes.laden} fout={offertes.fout} onHerlaad={laadOfferteKaart}
          onClick={() => navigate('/offertes')} />
        <StatKaart label="Afgeleverde projecten" getal={afgel.totaal}
          subtekst={`${afgel.onderhoud} in onderhoud`}
          kleur="#10b981" bg="#10b98115" icon={CheckCircle}
          laden={afgel.laden} fout={afgel.fout} onHerlaad={laadProjectenKaarten}
          onClick={() => navigate('/projecten')} />
      </div>

      {/* ── Snel starten ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-800 mb-4">Snel starten</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Nieuwe klant',       to: '/klanten',             icon: UserPlus   },
            { label: 'Nieuw project',      to: '/projecten',           icon: FolderPlus },
            { label: 'Nieuwe offerte',     to: '/offertes/nieuw',      icon: FilePlus   },
            { label: 'Open Studio',        to: '/studio',              icon: Wrench     },
            { label: 'Nieuwe handleiding', to: '/handleidingen/nieuw', icon: BookOpen   },
            { label: 'Instellingen',       to: '/instellingen',        icon: Settings   },
          ].map(({ label, to, icon: Icon }) => (
            <button key={label} onClick={() => navigate(to)}
              className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-[#e94560] hover:text-[#e94560] hover:bg-[#e94560]/5 transition-colors cursor-pointer">
              <Icon size={18} />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recente projecten ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-800">Recente projecten</p>
          <Link to="/projecten" className="text-xs text-[#e94560] hover:underline font-medium">Alle projecten →</Link>
        </div>
        {ladenRecente ? <TabelSkeleton rijen={4} />
          : foutRecente ? <FoutBlok onHerlaad={laadRecenteProjecten} />
          : recenteProj.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-400 mb-3">Nog geen projecten aangemaakt.</p>
              <button onClick={() => navigate('/projecten')}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#8b5cf6' }}>
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
                {recenteProj.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-800">
                      <Link to={`/projecten/${p.id}`} className="hover:text-[#e94560] transition-colors">{p.naam}</Link>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{p.klanten?.naam ?? '—'}</td>
                    <td className="px-3 py-3"><StatusBadge status={p.status} map={PROJECT_STATUSSEN} /></td>
                    <td className="px-3 py-3 text-gray-400 text-xs">
                      {p.bijgewerkt_op ? new Date(p.bijgewerkt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link to={`/projecten/${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:border-[#e94560] hover:text-[#e94560] transition-colors">
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
          <Link to="/offertes" className="text-xs text-[#e94560] hover:underline font-medium">Alle offertes →</Link>
        </div>
        {ladenOpenOff ? <TabelSkeleton rijen={3} />
          : foutOpenOff ? <FoutBlok onHerlaad={laadOpenOffertes} />
          : openOffRijen.length === 0 ? (
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
                {openOffRijen.map(o => {
                  const totaal = berekenTotaalIncl(o)
                  const nu = new Date(); nu.setHours(0,0,0,0)
                  const geldig = o.geldig_tot ? new Date(o.geldig_tot) : null
                  const dagVerschil = geldig ? Math.ceil((geldig - nu) / 86400000) : null
                  const verlopen = geldig && dagVerschil < 0
                  const bijna   = geldig && dagVerschil >= 0 && dagVerschil <= 7
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-gray-700">
                        <Link to={`/offertes/${o.id}`} className="hover:text-[#e94560] transition-colors">{o.nummer ?? '—'}</Link>
                      </td>
                      <td className="px-3 py-3 text-gray-500">{o.klanten?.naam ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-500">{o.projecten?.naam ?? '—'}</td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-800">€ {fmt(totaal)}</td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">
                        {geldig ? (
                          <span style={{ color: verlopen ? '#dc2626' : bijna ? '#d97706' : '#6b7280' }}>
                            {geldig.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {verlopen && ' (Verlopen)'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3"><StatusBadge status={o.status} map={OFFERTE_STATUSSEN} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
      </div>

      {/* ── Grafieken ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-800 mb-4">Projecten per status</p>
          {ladenGrafi ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-32 h-32 rounded-full border-4 border-gray-100 border-t-gray-200 animate-spin" />
            </div>
          ) : foutGrafi ? <FoutBlok onHerlaad={laadGrafieken} />
          : !statusData ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-gray-400">Nog geen data beschikbaar</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div style={{ width: 180, height: 180 }}>
                <Doughnut data={statusData} options={{
                  cutout: '62%',
                  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } } },
                }} />
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {statusData.legendaItems.map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.kleur }} />
                    {item.label} ({item.aantal})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-800">Goedgekeurde offertes per maand</p>
            <p className="text-xs text-gray-400 mt-0.5">laatste 6 maanden</p>
          </div>
          {ladenGrafi ? (
            <div className="flex items-end justify-center gap-2 h-48 pb-4">
              {[60,80,40,90,55,70].map((h, i) => (
                <div key={i} className="w-8 bg-gray-100 rounded animate-pulse" style={{ height: `${h}%` }} />
              ))}
            </div>
          ) : foutGrafi ? <FoutBlok onHerlaad={laadGrafieken} />
          : !omzetData ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-gray-400">Nog geen data beschikbaar</p>
            </div>
          ) : (
            <div style={{ height: 200 }}>
              <Bar data={omzetData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` € ${fmt(ctx.parsed.y)}` } } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                  y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, callback: v => `€ ${fmt(v)}` }, beginAtZero: true },
                },
              }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Recente meldingen ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <Bug size={14} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-800">Recente meldingen</p>
          </div>
          <button onClick={() => navigate('/projecten')} className="text-xs text-[#e94560] hover:underline font-medium">
            Alle meldingen bekijken →
          </button>
        </div>
        {ladenMeld ? <TabelSkeleton rijen={3} />
          : foutMeld ? <FoutBlok onHerlaad={laadMeldingen} />
          : meldingen.length === 0 ? (
            <div className="mx-6 my-5 px-4 py-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">Geen openstaande meldingen. Alles loopt goed!</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 font-medium border-b border-gray-50">
                  <th className="text-left px-6 py-3">Ernst</th>
                  <th className="text-left px-3 py-3">Project</th>
                  <th className="text-left px-3 py-3">Onderdeel</th>
                  <th className="text-left px-3 py-3">Datum</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {meldingen.map(m => {
                  const ernst = { laag: { label: 'Laag', kleur: '#16a34a', bg: '#dcfce7' }, medium: { label: 'Medium', kleur: '#d97706', bg: '#fef9ee' }, hoog: { label: 'Hoog', kleur: '#dc2626', bg: '#fee2e2' } }[m.ernst] ?? { label: m.ernst, kleur: '#64748b', bg: '#f1f5f9' }
                  const statusStijl = m.status === 'nieuw' ? { label: 'Nieuw', kleur: '#2563eb', bg: '#dbeafe' } : { label: 'In behandeling', kleur: '#d97706', bg: '#fef9ee' }
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: ernst.kleur, background: ernst.bg }}>{ernst.label}</span>
                      </td>
                      <td className="px-3 py-3">
                        {m.projecten ? <Link to={`/projecten/${m.projecten.id}`} className="text-gray-700 font-medium hover:text-[#e94560] transition-colors">{m.projecten.naam}</Link> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-3 text-gray-500">{m.onderdeel ?? '—'}</td>
                      <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(m.aangemaakt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: statusStijl.kleur, background: statusStijl.bg }}>{statusStijl.label}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {m.projecten && (
                          <Link to={`/projecten/${m.projecten.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:border-[#e94560] hover:text-[#e94560] transition-colors">
                            <ExternalLink size={11} /> Bekijk
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
      </div>

    </PageWrapper>
  )
}
