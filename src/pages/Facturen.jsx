// Facturen.jsx — Overzicht van alle facturen met statistieken en CSV export
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { Plus, Search, Receipt, AlertTriangle, CheckCircle, Euro, TrendingUp, Download } from 'lucide-react'

// ── Configuratie ───────────────────────────────────────────────────────────────
const STATUSSEN = [
  { key: 'alle',                 label: 'Alle' },
  { key: 'concept',              label: 'Concept',               kleur: '#64748b', bg: '#f1f5f9' },
  { key: 'verstuurd',            label: 'Verstuurd',             kleur: '#2563eb', bg: '#dbeafe' },
  { key: 'betaald',              label: 'Betaald',               kleur: '#16a34a', bg: '#dcfce7' },
  { key: 'vervallen',            label: 'Vervallen',             kleur: '#dc2626', bg: '#fee2e2' },
  { key: 'gedeeltelijk_betaald', label: 'Gedeeltelijk betaald',  kleur: '#d97706', bg: '#fef9ee' },
]

function statusCfg(status) {
  return STATUSSEN.find(s => s.key === status) ?? { label: status, kleur: '#64748b', bg: '#f1f5f9' }
}
function StatusBadge({ status }) {
  const c = statusCfg(status)
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.kleur }}>{c.label}</span>
  )
}
function fmt(n) {
  return Number(n ?? 0).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function datumKort(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── CSV export ─────────────────────────────────────────────────────────────────
function exporteerCsv(facturen) {
  const kolommen = [
    'Factuurnummer','Klant','Project','Factuurdatum','Vervaldatum',
    'Subtotaal','BTW%','BTW bedrag','Totaal incl BTW',
    'Betaald bedrag','Betaaldatum','Status'
  ]
  const rijen = facturen.map(f => [
    f.factuur_nummer,
    f.klanten?.bedrijfsnaam || f.klanten?.naam || '',
    f.projecten?.naam || '',
    f.factuur_datum || '',
    f.verval_datum  || '',
    f.subtotaal     ?? 0,
    f.btw_percentage ?? 0,
    f.btw_bedrag    ?? 0,
    f.totaal_incl   ?? 0,
    f.betaald_bedrag ?? 0,
    f.betaaldatum   || '',
    f.status,
  ])
  const csv = [kolommen, ...rijen]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `facturen-${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ── Hoofd component ────────────────────────────────────────────────────────────
export default function Facturen() {
  const navigate = useNavigate()
  const [facturen,  setFacturen]  = useState([])
  const [laden,     setLaden]     = useState(true)
  const [fout,      setFout]      = useState(null)
  const [zoekterm,  setZoekterm]  = useState('')
  const [filterTab, setFilterTab] = useState('alle')

  useEffect(() => {
    document.title = 'Facturen — BYT Studio'
    initialiseer()
  }, [])

  async function initialiseer() {
    setLaden(true)
    setFout(null)
    try {
      // Auto-update vervallen status
      const vandaag = new Date().toISOString().split('T')[0]
      await supabase
        .from('facturen')
        .update({ status: 'vervallen', bijgewerkt_op: new Date().toISOString() })
        .eq('status', 'verstuurd')
        .lt('verval_datum', vandaag)

      const { data, error } = await supabase
        .from('facturen')
        .select('*, klanten(naam, bedrijfsnaam), projecten(naam)')
        .order('aangemaakt_op', { ascending: false })
      if (error) throw error
      setFacturen(data ?? [])
    } catch (err) {
      setFout('Facturen konden niet geladen worden. Controleer je verbinding en probeer opnieuw.')
    } finally {
      setLaden(false)
    }
  }

  // ── Statistieken ─────────────────────────────────────────────────────────────
  const nu = new Date(); nu.setHours(0,0,0,0)

  const openstaand = facturen
    .filter(f => ['verstuurd','gedeeltelijk_betaald'].includes(f.status))
    .reduce((s, f) => s + Number(f.totaal_incl ?? 0) - Number(f.betaald_bedrag ?? 0), 0)

  const vervallenSom = facturen
    .filter(f => f.status === 'vervallen')
    .reduce((s, f) => s + Number(f.totaal_incl ?? 0) - Number(f.betaald_bedrag ?? 0), 0)
  const vervallenAantal = facturen.filter(f => f.status === 'vervallen').length

  const betaaldMaand = (() => {
    const n = new Date()
    return facturen
      .filter(f => {
        if (!f.betaaldatum) return false
        const d = new Date(f.betaaldatum)
        return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
      })
      .reduce((s, f) => s + Number(f.betaald_bedrag ?? f.totaal_incl ?? 0), 0)
  })()

  const omzetJaar = (() => {
    const jaar = new Date().getFullYear()
    return facturen
      .filter(f => f.status === 'betaald' && f.betaaldatum?.startsWith(String(jaar)))
      .reduce((s, f) => s + Number(f.totaal_incl ?? 0), 0)
  })()

  // ── Gefilterde lijst ─────────────────────────────────────────────────────────
  const gefilterd = facturen.filter(f => {
    const zoek = zoekterm.toLowerCase()
    const klant = f.klanten?.bedrijfsnaam || f.klanten?.naam || ''
    const matchZoek = !zoekterm ||
      f.factuur_nummer?.toLowerCase().includes(zoek) ||
      klant.toLowerCase().includes(zoek)
    const matchTab = filterTab === 'alle' ||
      (filterTab === 'voorschot' ? f.is_voorschot : f.status === filterTab)
    return matchZoek && matchTab
  })

  const STATS = [
    { label: 'Openstaand',           waarde: `€ ${fmt(openstaand)}`,        icon: Euro,          kleur: '#d97706', bg: '#fef9ee' },
    { label: `Vervallen (${vervallenAantal})`, waarde: `€ ${fmt(vervallenSom)}`, icon: AlertTriangle, kleur: '#dc2626', bg: '#fee2e2' },
    { label: 'Betaald deze maand',   waarde: `€ ${fmt(betaaldMaand)}`,      icon: CheckCircle,   kleur: '#16a34a', bg: '#f0fdf4' },
    { label: `Omzet ${new Date().getFullYear()}`, waarde: `€ ${fmt(omzetJaar)}`, icon: TrendingUp, kleur: '#2563eb', bg: '#eff6ff' },
  ]

  return (
    <PageWrapper
      title="Facturen"
      description="Opvolging en beheer van alle klantfacturen."
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => exporteerCsv(facturen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors">
            <Download size={14} /> Exporteer CSV
          </button>
          <button onClick={() => navigate('/facturen/nieuw')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#78C833' }}>
            <Plus size={15} /> Nieuwe factuur
          </button>
        </div>
      }
    >
      {/* Statistieken */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, waarde, icon: Icon, kleur, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon size={18} style={{ color: kleur }} />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 leading-tight">{waarde}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-50">
          <div className="flex gap-1 flex-wrap flex-1">
            {STATUSSEN.map(s => (
              <button key={s.key} onClick={() => setFilterTab(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterTab === s.key ? 'text-white' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
                }`}
                style={filterTab === s.key ? { background: s.kleur ?? '#78C833' } : {}}>
                {s.label}
                {s.key !== 'alle' && (
                  <span className="ml-1.5 opacity-70">{facturen.filter(f => f.status === s.key).length}</span>
                )}
              </button>
            ))}
            {/* Voorschot filter */}
            <button onClick={() => setFilterTab('voorschot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterTab === 'voorschot' ? 'bg-[#78C833] text-white' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
              }`}>
              Voorschot <span className="ml-1.5 opacity-70">{facturen.filter(f => f.is_voorschot).length}</span>
            </button>
          </div>
          <div className="relative flex-shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={zoekterm} onChange={e => setZoekterm(e.target.value)}
              placeholder="Zoek factuur, klant..."
              className="pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#78C833]/20 focus:border-[#78C833] w-52" />
          </div>
        </div>

        {fout ? (
          <div className="px-5 py-10 text-center">
            <AlertTriangle size={28} className="mx-auto mb-3" style={{ color: '#dc2626' }} />
            <p className="text-sm font-medium text-gray-500">{fout}</p>
            <button onClick={initialiseer} className="mt-4 px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: '#78C833' }}>
              Opnieuw proberen
            </button>
          </div>
        ) : laden ? (
          <div className="px-5 py-4 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
                <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt size={32} className="text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-400">
              {zoekterm || filterTab !== 'alle' ? 'Geen facturen gevonden.' : 'Nog geen facturen aangemaakt.'}
            </p>
            {!zoekterm && filterTab === 'alle' && (
              <button onClick={() => navigate('/facturen/nieuw')}
                className="mt-4 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ background: '#78C833' }}>
                Eerste factuur aanmaken
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 font-medium border-b border-gray-50">
                  <th className="text-left px-5 py-3">Nummer</th>
                  <th className="text-left px-3 py-3">Klant</th>
                  <th className="text-left px-3 py-3 hidden lg:table-cell">Project</th>
                  <th className="text-left px-3 py-3 hidden md:table-cell">Datum</th>
                  <th className="text-left px-3 py-3">Vervaldatum</th>
                  <th className="text-right px-3 py-3">Totaal</th>
                  <th className="text-right px-3 py-3 hidden sm:table-cell">Betaald</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {gefilterd.map(f => {
                  const klantNaam = f.klanten?.bedrijfsnaam || f.klanten?.naam || '—'
                  const vervalDatum = f.verval_datum ? new Date(f.verval_datum) : null
                  const isVervallen = vervalDatum && vervalDatum < nu && !['betaald'].includes(f.status)
                  const dagRest = vervalDatum ? Math.ceil((vervalDatum - nu) / 86400000) : null
                  const volledigBetaald = Number(f.betaald_bedrag) >= Number(f.totaal_incl) && f.status === 'betaald'
                  return (
                    <tr key={f.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">
                        <Link to={`/facturen/${f.id}`} className="hover:text-[#78C833] transition-colors">
                          {f.factuur_nummer}
                          {f.is_voorschot && <span className="ml-1 text-blue-400">V</span>}
                          {f.is_creditnota && <span className="ml-1 text-red-400">CN</span>}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-gray-700 font-medium">{klantNaam}</td>
                      <td className="px-3 py-3 text-gray-400 hidden lg:table-cell">{f.projecten?.naam ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-400 text-xs hidden md:table-cell">{datumKort(f.factuur_datum)}</td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">
                        {vervalDatum ? (
                          <span style={{ color: isVervallen ? '#dc2626' : dagRest !== null && dagRest <= 7 && !volledigBetaald ? '#d97706' : '#6b7280' }}>
                            {datumKort(f.verval_datum)}{isVervallen ? ' ⚠' : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-gray-900">€ {fmt(f.totaal_incl)}</td>
                      <td className="px-3 py-3 text-right text-xs hidden sm:table-cell"
                        style={{ color: volledigBetaald ? '#16a34a' : Number(f.betaald_bedrag) > 0 ? '#d97706' : '#9ca3af' }}>
                        {Number(f.betaald_bedrag) > 0 ? `€ ${fmt(f.betaald_bedrag)}` : '—'}
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={f.status} /></td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/facturen/${f.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:border-[#78C833] hover:text-[#78C833] transition-colors">
                          Open
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
