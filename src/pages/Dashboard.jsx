// Dashboard.jsx — Startpagina met live statistieken uit Supabase
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, FolderKanban, FileText, CheckCircle, ArrowRight, Bug } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { useInstellingen } from '../context/InstellingenContext'

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
