// FactuurDetail.jsx — Detailpagina van één factuur (4 tabbladen)
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useInstellingen } from '../context/InstellingenContext'
import {
  ChevronLeft, Save, Printer, CheckCircle, AlertTriangle, Copy,
  Clock, Send, Trash2, Euro, ChevronDown, Plus, Bell, FileText,
  CreditCard, Settings, Mail, ExternalLink,
} from 'lucide-react'
import '../styles/print.css'

const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#78C833]/20 focus:border-[#78C833] bg-white transition-colors'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

const STATUSSEN = [
  { key: 'concept',              label: 'Concept',              kleur: '#64748b', bg: '#f1f5f9' },
  { key: 'verstuurd',            label: 'Verstuurd',            kleur: '#2563eb', bg: '#dbeafe' },
  { key: 'gedeeltelijk_betaald', label: 'Gedeeltelijk betaald', kleur: '#d97706', bg: '#fef9ee' },
  { key: 'betaald',              label: 'Betaald',              kleur: '#16a34a', bg: '#dcfce7' },
  { key: 'vervallen',            label: 'Vervallen',            kleur: '#dc2626', bg: '#fee2e2' },
]

const EENHEDEN   = ['uur', 'dag', 'stuk', 'forfait', 'maand', 'km', '%']
const BTW_OPTIES = [0, 6, 12, 21]
const LEEG_ITEM  = { omschrijving: '', hoeveelheid: 1, eenheid: 'uur', eenheidsprijs: 0, btw_percentage: 21 }

function statusCfg(s) { return STATUSSEN.find(x => x.key === s) ?? { label: s, kleur: '#64748b', bg: '#f1f5f9' } }
function fmt(n) { return Number(n ?? 0).toFixed(2).replace('.', ',') }
function datumLang(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}
function addDagen(datum, dagen) {
  const d = new Date(datum)
  d.setDate(d.getDate() + Number(dagen))
  return d.toISOString().split('T')[0]
}

function berekenTotalen(items) {
  const groepen = {}
  for (const item of items) {
    const btw = Number(item.btw_percentage ?? 21)
    const basis = (Number(item.hoeveelheid) || 0) * (Number(item.eenheidsprijs) || 0)
    if (!groepen[btw]) groepen[btw] = { basis: 0, btw: 0 }
    groepen[btw].basis += basis
    groepen[btw].btw   += basis * (btw / 100)
  }
  const subtotaal = Object.values(groepen).reduce((s, g) => s + g.basis, 0)
  const btwBedrag  = Object.values(groepen).reduce((s, g) => s + g.btw, 0)
  return { subtotaal, btwBedrag, incl: subtotaal + btwBedrag, groepen }
}

// ── Tabblad-iconen ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'factuur',       label: 'Factuur',       icon: FileText },
  { key: 'betaling',      label: 'Betaling',       icon: CreditCard },
  { key: 'herinneringen', label: 'Herinneringen',  icon: Bell },
  { key: 'acties',        label: 'Acties',         icon: Settings },
]

export default function FactuurDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { instellingen } = useInstellingen()

  const [factuur,   setFactuur]   = useState(null)
  const [laden,     setLaden]     = useState(true)
  const [opslaan,   setOpslaan]   = useState(false)
  const [fout,      setFout]      = useState('')
  const [ok,        setOk]        = useState('')
  const [actief,    setActief]    = useState('factuur')

  // Bewerkbaar formulier (Tab 1)
  const [items, setItems]       = useState([])
  const [gewijzigd, setGewijzigd] = useState(false)

  // Betaling (Tab 2)
  const vandaag = new Date().toISOString().split('T')[0]
  const [betDatum,  setBetDatum]  = useState(vandaag)
  const [betBedrag, setBetBedrag] = useState('')
  const [betWijze,  setBetWijze]  = useState('overschrijving')
  const [betLaden,  setBetLaden]  = useState(false)

  // Herinneringen (Tab 3)
  const [herCopied, setHerCopied] = useState(false)

  // Acties (Tab 4)
  const [verwijderConfirm, setVerwijderConfirm] = useState(false)

  const laadFactuur = useCallback(async () => {
    setLaden(true)
    const { data, error } = await supabase
      .from('facturen')
      .select('*, klanten(naam, bedrijfsnaam, email, adres, btw_nummer), projecten(naam), offertes(nummer)')
      .eq('id', id)
      .single()
    if (error || !data) { setFout('Factuur niet gevonden.'); setLaden(false); return }
    setFactuur(data)
    setItems(Array.isArray(data.items_json) ? data.items_json : [])
    setBetBedrag(data.totaal_incl ?? '')
    document.title = `${data.factuur_nummer} — BYT Studio`
    setLaden(false)
  }, [id])

  useEffect(() => { laadFactuur() }, [laadFactuur])

  function toonOk(bericht) { setOk(bericht); setTimeout(() => setOk(''), 3000) }
  function toonFout(bericht) { setFout(bericht); setTimeout(() => setFout(''), 5000) }

  // ── Tab 1: Factuur bewerkbaar ─────────────────────────────────────────────
  function itemWijzig(idx, veld, waarde) {
    setGewijzigd(true)
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [veld]: waarde } : it))
  }
  function voegItemToe() { setGewijzigd(true); setItems(prev => [...prev, { ...LEEG_ITEM, btw_percentage: instellingen.btw_percentage ?? 21 }]) }
  function verwijderItem(idx) { setGewijzigd(true); setItems(prev => prev.filter((_, i) => i !== idx)) }

  const { subtotaal, btwBedrag, incl, groepen } = berekenTotalen(items)

  async function slaFactuurOp() {
    setOpslaan(true)
    const { error } = await supabase.from('facturen').update({
      items_json:    items,
      subtotaal,
      btw_bedrag:    btwBedrag,
      totaal_incl:   incl,
      bijgewerkt_op: new Date().toISOString(),
    }).eq('id', id)
    setOpslaan(false)
    if (error) { toonFout('Opslaan mislukt: ' + error.message); return }
    setGewijzigd(false)
    setFactuur(f => ({ ...f, items_json: items, subtotaal, btw_bedrag: btwBedrag, totaal_incl: incl }))
    toonOk('Factuur bijgewerkt.')
  }

  async function wijzigStatus(nieuwStatus) {
    const { error } = await supabase.from('facturen')
      .update({ status: nieuwStatus, bijgewerkt_op: new Date().toISOString() }).eq('id', id)
    if (error) { toonFout(error.message); return }
    setFactuur(f => ({ ...f, status: nieuwStatus }))
    toonOk('Status bijgewerkt.')
  }

  // ── Tab 2: Betaling registreren ────────────────────────────────────────────
  async function registreerBetaling() {
    if (!betDatum)  { toonFout('Selecteer een datum.'); return }
    if (!betBedrag) { toonFout('Voer een bedrag in.'); return }
    setBetLaden(true)

    const bedrag        = Number(betBedrag)
    const huidigBetaald = Number(factuur.betaald_bedrag ?? 0)
    const nieuwBetaald  = huidigBetaald + bedrag
    const totaal        = Number(factuur.totaal_incl ?? 0)
    const nieuweStatus  = nieuwBetaald >= totaal - 0.01 ? 'betaald' : 'gedeeltelijk_betaald'

    // Log in herinneringen_json
    const log = Array.isArray(factuur.herinneringen_json) ? [...factuur.herinneringen_json] : []
    log.push({
      type: 'betaling',
      datum: betDatum,
      bedrag,
      wijze: betWijze,
      aangemaakt_op: new Date().toISOString(),
    })

    const { error } = await supabase.from('facturen').update({
      betaald_bedrag:    nieuwBetaald,
      betaaldatum:       betDatum,
      betalingswijze:    betWijze,
      status:            nieuweStatus,
      herinneringen_json: log,
      bijgewerkt_op:     new Date().toISOString(),
    }).eq('id', id)

    setBetLaden(false)
    if (error) { toonFout('Betaling opslaan mislukt: ' + error.message); return }
    setFactuur(f => ({ ...f, betaald_bedrag: nieuwBetaald, betaaldatum: betDatum, betalingswijze: betWijze, status: nieuweStatus, herinneringen_json: log }))
    setBetBedrag('')
    toonOk('Betaling geregistreerd.')
  }

  // ── Tab 3: Herinneringen ───────────────────────────────────────────────────
  function herinneringTemplate() {
    if (!factuur) return ''
    const klantNm = factuur.klanten?.bedrijfsnaam || factuur.klanten?.naam || 'klant'
    const email   = factuur.klanten?.email ?? ''
    const saldo   = Number(factuur.totaal_incl ?? 0) - Number(factuur.betaald_bedrag ?? 0)
    return `Geachte ${klantNm},

Wij stellen vast dat factuur ${factuur.factuur_nummer} van ${datumLang(factuur.factuur_datum)}, ten bedrage van € ${fmt(saldo)}, nog niet werd vereffend.

De vervaldatum was vastgesteld op ${datumLang(factuur.verval_datum)}.

Wij verzoeken u vriendelijk om dit bedrag zo spoedig mogelijk over te schrijven op rekeningnummer ${instellingen.iban ?? 'BE XX XXXX XXXX XXXX'} met vermelding van de gestructureerde mededeling.

Mocht u reeds betaald hebben, verzoeken wij u dit bericht te negeren.

Met vriendelijke groeten,
Build Your Tools`
  }

  async function markeerHerinneringStuurd() {
    const log = Array.isArray(factuur.herinneringen_json) ? [...factuur.herinneringen_json] : []
    log.push({
      type: 'herinnering',
      datum: vandaag,
      aangemaakt_op: new Date().toISOString(),
    })
    const { error } = await supabase.from('facturen').update({
      herinneringen_json: log,
      bijgewerkt_op: new Date().toISOString(),
    }).eq('id', id)
    if (error) { toonFout('Opslaan mislukt.'); return }
    setFactuur(f => ({ ...f, herinneringen_json: log }))
    toonOk('Herinnering gemarkeerd als verstuurd.')
  }

  function mailtoHerinnering() {
    const email = factuur?.klanten?.email ?? ''
    const subj  = encodeURIComponent(`Herinnering factuur ${factuur?.factuur_nummer}`)
    const body  = encodeURIComponent(herinneringTemplate())
    return `mailto:${email}?subject=${subj}&body=${body}`
  }

  // ── Tab 4: Acties ──────────────────────────────────────────────────────────
  async function dupliceerFactuur() {
    const jaar = new Date().getFullYear()
    const { count } = await supabase.from('facturen').select('id', { count: 'exact', head: true })
      .gte('factuur_datum', `${jaar}-01-01`)
    const volg   = String((count ?? 0) + 1).padStart(3, '0')
    const nieuwNr = `FACT-${jaar}-${volg}`

    const { data, error } = await supabase.from('facturen').insert({
      klant_id:       factuur.klant_id,
      project_id:     factuur.project_id,
      factuur_nummer: nieuwNr,
      status:         'concept',
      factuur_datum:  vandaag,
      verval_datum:   addDagen(vandaag, instellingen.betalingstermijn ?? 30),
      items_json:     factuur.items_json,
      subtotaal:      factuur.subtotaal,
      btw_percentage: factuur.btw_percentage,
      btw_bedrag:     factuur.btw_bedrag,
      totaal_incl:    factuur.totaal_incl,
      betaald_bedrag: 0,
      is_voorschot:   factuur.is_voorschot,
      notities:       factuur.notities,
    }).select('id').single()

    if (error) { toonFout('Duplicaat aanmaken mislukt.'); return }
    navigate(`/facturen/${data.id}`)
  }

  async function maakCreditnota() {
    const jaar  = new Date().getFullYear()
    const { count } = await supabase.from('facturen').select('id', { count: 'exact', head: true })
      .gte('factuur_datum', `${jaar}-01-01`)
    const volg   = String((count ?? 0) + 1).padStart(3, '0')
    const nieuwNr = `CN-${jaar}-${volg}`

    const creditItems = (factuur.items_json ?? []).map(it => ({
      ...it,
      eenheidsprijs: -Math.abs(Number(it.eenheidsprijs)),
    }))
    const { subtotaal: cs, btwBedrag: cb, incl: ci } = berekenTotalen(creditItems)

    const { data, error } = await supabase.from('facturen').insert({
      klant_id:            factuur.klant_id,
      project_id:          factuur.project_id,
      factuur_nummer:      nieuwNr,
      status:              'concept',
      factuur_datum:       vandaag,
      items_json:          creditItems,
      subtotaal:           cs,
      btw_percentage:      factuur.btw_percentage,
      btw_bedrag:          cb,
      totaal_incl:         ci,
      betaald_bedrag:      0,
      is_creditnota:       true,
      originele_factuur_id: id,
    }).select('id').single()

    if (error) { toonFout('Creditnota aanmaken mislukt.'); return }
    navigate(`/facturen/${data.id}`)
  }

  async function verwijderFactuur() {
    const { error } = await supabase.from('facturen').delete().eq('id', id)
    if (error) { toonFout('Verwijderen mislukt: ' + error.message); return }
    navigate('/facturen')
  }

  // ── Laadscherm ────────────────────────────────────────────────────────────
  if (laden) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#78C833', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!factuur) return (
    <div className="text-center py-16 text-gray-400">
      <AlertTriangle size={40} className="mx-auto mb-3 text-red-300" />
      <p>Factuur niet gevonden.</p>
    </div>
  )

  const cfg        = statusCfg(factuur.status)
  const klantNm    = factuur.klanten?.bedrijfsnaam || factuur.klanten?.naam || '—'
  const openSaldo  = Number(factuur.totaal_incl ?? 0) - Number(factuur.betaald_bedrag ?? 0)
  const betalingen = (factuur.herinneringen_json ?? []).filter(e => e.type === 'betaling')
  const herinneringen = (factuur.herinneringen_json ?? []).filter(e => e.type === 'herinnering')

  return (
    <div className="max-w-5xl space-y-5">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <button onClick={() => navigate('/facturen')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        <ChevronLeft size={15} /> Facturen
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900">{factuur.factuur_nummer}</h1>
            {factuur.is_voorschot && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">VOORSCHOT</span>
            )}
            {factuur.is_creditnota && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">CREDITNOTA</span>
            )}
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ color: cfg.kleur, background: cfg.bg }}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{klantNm} · {datumLang(factuur.factuur_datum)}</p>
        </div>

        {/* Statusknopen */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSSEN.filter(s => s.key !== factuur.status).map(s => (
            <button key={s.key} onClick={() => wijzigStatus(s.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 transition-colors bg-white">
              → {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback berichten */}
      {fout && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{fout}</div>}
      {ok   && <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 flex items-center gap-2"><CheckCircle size={13} /> {ok}</div>}

      {/* ── Tabbladen ────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActief(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                actief === key
                  ? 'border-[#78C833] text-[#78C833]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1: FACTUUR
      ════════════════════════════════════════════════════════════════════════ */}
      {actief === 'factuur' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">

            {/* Klantinfo (readonly) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Klant</p>
              <p className="font-semibold text-gray-800">{klantNm}</p>
              {factuur.klanten?.adres && <p className="text-sm text-gray-500">{factuur.klanten.adres}</p>}
              {factuur.klanten?.btw_nummer && <p className="text-xs text-gray-400">BTW: {factuur.klanten.btw_nummer}</p>}
              {factuur.klanten?.email && <p className="text-xs text-gray-400">{factuur.klanten.email}</p>}
              {factuur.projecten?.naam && (
                <p className="text-xs text-gray-400 mt-1">Project: {factuur.projecten.naam}</p>
              )}
            </div>

            {/* Regelitems bewerkbaar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Regelitems</p>
                {gewijzigd && (
                  <span className="text-xs text-amber-600 font-medium">Niet opgeslagen wijzigingen</span>
                )}
              </div>

              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 pb-1 border-b border-gray-100">
                <div className="col-span-4">Omschrijving</div>
                <div className="col-span-2 text-center">Aantal</div>
                <div className="col-span-2">Eenheid</div>
                <div className="col-span-1 text-right">Prijs</div>
                <div className="col-span-1 text-center">BTW</div>
                <div className="col-span-1 text-right">Totaal</div>
                <div className="col-span-1" />
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => {
                  const lijnTotaal = (Number(item.hoeveelheid) || 0) * (Number(item.eenheidsprijs) || 0)
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input value={item.omschrijving}
                          onChange={e => itemWijzig(idx, 'omschrijving', e.target.value)}
                          placeholder="Omschrijving..." className={inp + ' text-xs'} />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="0" step="0.5" value={item.hoeveelheid}
                          onChange={e => itemWijzig(idx, 'hoeveelheid', e.target.value)}
                          className={inp + ' text-xs text-center'} />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <select value={item.eenheid}
                            onChange={e => itemWijzig(idx, 'eenheid', e.target.value)}
                            className={inp + ' appearance-none pr-5 text-xs'}>
                            {EENHEDEN.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="col-span-1">
                        <div className="relative">
                          <span className="absolute left-2 top-2.5 text-gray-400 text-xs">€</span>
                          <input type="number" min="0" step="0.01" value={item.eenheidsprijs}
                            onChange={e => itemWijzig(idx, 'eenheidsprijs', e.target.value)}
                            className={inp + ' pl-5 text-xs'} />
                        </div>
                      </div>
                      <div className="col-span-1">
                        <div className="relative">
                          <select value={item.btw_percentage ?? 21}
                            onChange={e => itemWijzig(idx, 'btw_percentage', Number(e.target.value))}
                            className={inp + ' appearance-none pr-4 text-xs text-center'}>
                            {BTW_OPTIES.map(p => <option key={p} value={p}>{p}%</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-3 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="col-span-1 text-right text-xs font-medium text-gray-700 pr-1">
                        € {fmt(lijnTotaal)}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {items.length > 1 && (
                          <button onClick={() => verwijderItem(idx)}
                            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <button onClick={voegItemToe}
                className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-[#78C833] transition-colors">
                <Plus size={14} /> Regel toevoegen
              </button>
            </div>
          </div>

          {/* Rechterpaneel Tab 1 */}
          <div className="space-y-5">
            {/* Totalen */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Totalen</p>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotaal excl. BTW</span>
                <span>€ {fmt(subtotaal)}</span>
              </div>
              {Object.entries(groepen).sort(([a], [b]) => Number(a) - Number(b)).map(([t, g]) => (
                <div key={t} className="flex justify-between text-xs text-gray-400">
                  <span>BTW {t}%</span><span>€ {fmt(g.btw)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Totaal BTW</span><span>€ {fmt(btwBedrag)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Totaal incl. BTW</span>
                <span style={{ color: '#78C833' }}>€ {fmt(incl)}</span>
              </div>
            </div>

            {gewijzigd && (
              <button onClick={slaFactuurOp} disabled={opslaan}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: '#78C833' }}>
                <Save size={14} />
                {opslaan ? 'Opslaan...' : 'Wijzigingen opslaan'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2: BETALING
      ════════════════════════════════════════════════════════════════════════ */}
      {actief === 'betaling' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Saldo kaart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saldo-overzicht</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Totaal factuur</span>
                <span>€ {fmt(factuur.totaal_incl)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Betaald</span>
                <span>€ {fmt(factuur.betaald_bedrag)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2"
                style={{ color: openSaldo > 0.01 ? '#dc2626' : '#16a34a' }}>
                <span>Open saldo</span>
                <span>€ {fmt(openSaldo)}</span>
              </div>
            </div>

            {/* Voortgangsbalk */}
            <div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (Number(factuur.betaald_bedrag) / Number(factuur.totaal_incl || 1)) * 100)}%`,
                    background: '#78C833',
                  }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {Math.round((Number(factuur.betaald_bedrag) / Number(factuur.totaal_incl || 1)) * 100)}% betaald
              </p>
            </div>
          </div>

          {/* Betaling registreren */}
          {openSaldo > 0.01 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Betaling registreren</p>
              <div>
                <label className={lbl}>Bedrag</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">€</span>
                  <input type="number" min="0.01" step="0.01" value={betBedrag}
                    onChange={e => setBetBedrag(e.target.value)}
                    placeholder={fmt(openSaldo)}
                    className={inp + ' pl-7'} />
                </div>
                <button onClick={() => setBetBedrag(fmt(openSaldo).replace(',', '.'))}
                  className="text-xs text-[#78C833] font-medium mt-1 hover:underline">
                  Volledig openstaand saldo invullen
                </button>
              </div>
              <div>
                <label className={lbl}>Betaaldatum</label>
                <input type="date" value={betDatum}
                  onChange={e => setBetDatum(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Betalingswijze</label>
                <div className="relative">
                  <select value={betWijze} onChange={e => setBetWijze(e.target.value)}
                    className={inp + ' appearance-none pr-8'}>
                    {['overschrijving', 'cash', 'bancontact', 'factoring', 'andere'].map(w => (
                      <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <button onClick={registreerBetaling} disabled={betLaden}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: '#78C833' }}>
                <Euro size={14} />
                {betLaden ? 'Registreren...' : 'Registreer betaling'}
              </button>
            </div>
          )}

          {/* Betalingshistoriek */}
          {betalingen.length > 0 && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Betalingshistoriek</p>
              <div className="space-y-2">
                {betalingen.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-sm text-gray-700">{datumLang(b.datum)}</span>
                      <span className="text-xs text-gray-400">{b.wijze}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">+ € {fmt(b.bedrag)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 3: HERINNERINGEN
      ════════════════════════════════════════════════════════════════════════ */}
      {actief === 'herinneringen' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Template herinnering</p>
              <textarea
                readOnly
                rows={14}
                value={herinneringTemplate()}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-700 font-mono resize-none focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(herinneringTemplate())
                    setHerCopied(true)
                    setTimeout(() => setHerCopied(false), 2000)
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors">
                  <Copy size={12} />
                  {herCopied ? 'Gekopieerd!' : 'Kopieer tekst'}
                </button>
                <a href={mailtoHerinnering()}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium transition-opacity hover:opacity-90"
                  style={{ background: '#78C833' }}>
                  <Mail size={12} />
                  Verstuur via e-mail
                </a>
                <button onClick={markeerHerinneringStuurd}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-50 transition-colors">
                  <CheckCircle size={12} />
                  Markeer als verstuurd
                </button>
              </div>
            </div>
          </div>

          {/* Historiek herinneringen */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Historiek</p>
            {herinneringen.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Nog geen herinneringen verstuurd</p>
            ) : (
              <div className="space-y-2">
                {herinneringen.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <Bell size={13} className="text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Herinnering verstuurd</p>
                      <p className="text-xs text-gray-400">{datumLang(h.datum)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 4: ACTIES
      ════════════════════════════════════════════════════════════════════════ */}
      {actief === 'acties' && (
        <div className="max-w-xl space-y-4">

          {/* Afdrukken */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Afdrukken / PDF opslaan</p>
                <p className="text-xs text-gray-400 mt-0.5">Opent de afdrukdialoog van uw browser</p>
              </div>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
                <Printer size={14} /> Afdrukken
              </button>
            </div>
          </div>

          {/* Verstuur per e-mail */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Verstuur per e-mail</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {factuur.klanten?.email ? factuur.klanten.email : 'Geen e-mail gekend voor deze klant'}
                </p>
              </div>
              {factuur.klanten?.email && (
                <a href={`mailto:${factuur.klanten.email}?subject=${encodeURIComponent(`Factuur ${factuur.factuur_nummer}`)}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{ background: '#78C833' }}>
                  <Send size={14} /> Verstuur
                </a>
              )}
            </div>
          </div>

          {/* Dupliceer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Dupliceer factuur</p>
                <p className="text-xs text-gray-400 mt-0.5">Maakt een kopie als nieuw concept</p>
              </div>
              <button onClick={dupliceerFactuur}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
                <Copy size={14} /> Dupliceer
              </button>
            </div>
          </div>

          {/* Creditnota */}
          {!factuur.is_creditnota && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Maak creditnota</p>
                  <p className="text-xs text-gray-400 mt-0.5">Genereert een negatieve factuur als tegenpost</p>
                </div>
                <button onClick={maakCreditnota}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                  <ExternalLink size={14} /> Creditnota
                </button>
              </div>
            </div>
          )}

          {/* Verwijderen — enkel als concept */}
          {factuur.status === 'concept' && (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700">Factuur verwijderen</p>
                  <p className="text-xs text-red-400 mt-0.5">Definitief verwijderen. Enkel mogelijk bij concept.</p>
                </div>
                {!verwijderConfirm ? (
                  <button onClick={() => setVerwijderConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-colors">
                    <Trash2 size={14} /> Verwijder
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setVerwijderConfirm(false)}
                      className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200">
                      Annuleer
                    </button>
                    <button onClick={verwijderFactuur}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700">
                      <AlertTriangle size={12} /> Definitief verwijderen
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          PRINT LAYOUT — verborgen op scherm, zichtbaar bij afdrukken
          Belgische wettelijke factuuropmaak
      ════════════════════════════════════════════════════════════════════════ */}
      <PrintLayout factuur={factuur} items={items} instellingen={instellingen} />
    </div>
  )
}

// ── PrintLayout component (buiten FactuurDetail om re-renders te vermijden) ──
function PrintLayout({ factuur, items, instellingen }) {
  if (!factuur) return null

  function fmt(n) { return Number(n ?? 0).toFixed(2).replace('.', ',') }
  function datumNL(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Totalen
  const groepen = {}
  for (const item of items) {
    const btw   = Number(item.btw_percentage ?? 21)
    const basis = (Number(item.hoeveelheid) || 0) * (Number(item.eenheidsprijs) || 0)
    if (!groepen[btw]) groepen[btw] = { basis: 0, btw: 0 }
    groepen[btw].basis += basis
    groepen[btw].btw   += basis * (btw / 100)
  }
  const subtotaal = Object.values(groepen).reduce((s, g) => s + g.basis, 0)
  const btwBedrag = Object.values(groepen).reduce((s, g) => s + g.btw, 0)
  const incl      = subtotaal + btwBedrag
  const betaald   = Number(factuur.betaald_bedrag ?? 0)
  const openSaldo = incl - betaald

  const klant     = factuur.klanten ?? {}
  const klantNm   = klant.bedrijfsnaam || klant.naam || '—'
  const isCreditnota = factuur.is_creditnota

  // Bedrijfsgegevens uit instellingen
  const inst = instellingen ?? {}
  const bedrijfNaam    = inst.bedrijfsnaam    ?? 'Build Your Tools'
  const bedrijfAdres   = inst.adres           ?? ''
  const bedrijfBtw     = inst.btw_nummer      ?? ''
  const bedrijfEmail   = inst.email           ?? ''
  const bedrijfTel     = inst.telefoon        ?? ''
  const bedrijfWeb     = inst.website         ?? ''
  const iban           = inst.iban            ?? ''
  const bic            = inst.bic             ?? ''
  const intrest        = inst.nalatigheidsintrest ?? 8
  const forfait        = inst.forfait_schadevergoeding ?? 40

  const primair = '#78C833'

  return (
    <div
      className="factuur-print-content"
      style={{ '--fp-primair': primair }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="fp-header">
        {/* Links: bedrijfsgegevens */}
        <div className="fp-bedrijf-blok">
          <img src="/logo-byt.png" alt="Build Your Tools" className="fp-logo" />
          {!inst.logo && (
            <div className="fp-bedrijf-naam">{bedrijfNaam}</div>
          )}
          <div className="fp-bedrijf-details">
            {bedrijfAdres && <span>{bedrijfAdres}<br /></span>}
            {bedrijfBtw   && <span><strong>BTW:</strong> {bedrijfBtw}<br /></span>}
            {bedrijfEmail && <span>{bedrijfEmail}<br /></span>}
            {bedrijfTel   && <span>{bedrijfTel}<br /></span>}
            {bedrijfWeb   && <span>{bedrijfWeb}<br /></span>}
            {iban         && <span><strong>IBAN:</strong> {iban}<br /></span>}
            {bic          && <span><strong>BIC:</strong> {bic}</span>}
          </div>
        </div>

        {/* Rechts: factuurinfo */}
        <div className="fp-factuur-blok">
          {isCreditnota && <div className="fp-creditnota-badge">CREDITNOTA</div>}
          <div className="fp-factuur-titel">
            {isCreditnota ? 'CREDITNOTA' : (factuur.is_voorschot ? 'VOORSCHOT' : 'FACTUUR')}
          </div>
          <div className="fp-factuur-meta">
            <strong>{factuur.factuur_nummer}</strong><br />
            <span>Datum: </span><strong>{datumNL(factuur.factuur_datum)}</strong><br />
            {factuur.verval_datum && (
              <><span>Vervaldatum: </span><strong>{datumNL(factuur.verval_datum)}</strong><br /></>
            )}
            {factuur.offertes?.nummer && (
              <><span>Ref. offerte: </span><strong>{factuur.offertes.nummer}</strong><br /></>
            )}
          </div>
        </div>
      </div>

      {/* ── Primaire kleurlijn ─────────────────────────────────────────────── */}
      <hr className="fp-divider-primair" />

      {/* ── KLANT SECTIE ──────────────────────────────────────────────────── */}
      <div className="fp-klant-kader">
        <div className="fp-klant-label">Aan:</div>
        <div className="fp-klant-naam">{klantNm}</div>
        <div className="fp-klant-details">
          {klant.adres && <span>{klant.adres}<br /></span>}
          {klant.btw_nummer && <span>BTW: {klant.btw_nummer}<br /></span>}
          {klant.email && <span>{klant.email}</span>}
        </div>
      </div>

      {/* ── PROJECT SECTIE ────────────────────────────────────────────────── */}
      {(factuur.projecten?.naam || factuur.offertes?.nummer) && (
        <div className="fp-project">
          {factuur.projecten?.naam && (
            <div><strong>Betreft:</strong> {factuur.projecten.naam}</div>
          )}
          {factuur.offertes?.nummer && (
            <div><strong>Referentie:</strong> {factuur.offertes.nummer}</div>
          )}
        </div>
      )}

      {/* ── ITEMTABEL ─────────────────────────────────────────────────────── */}
      <table className="fp-tabel">
        <thead>
          <tr>
            <th style={{ width: '7mm' }}>Nr</th>
            <th>Omschrijving</th>
            <th className="rechts" style={{ width: '16mm' }}>Aantal</th>
            <th style={{ width: '14mm' }}>Eenh.</th>
            <th className="rechts" style={{ width: '22mm' }}>Prijs/eenh.</th>
            <th className="center" style={{ width: '12mm' }}>BTW%</th>
            <th className="rechts" style={{ width: '22mm' }}>Totaal excl.</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const lijnTotaal = (Number(item.hoeveelheid) || 0) * (Number(item.eenheidsprijs) || 0)
            return (
              <tr key={idx}>
                <td className="nr">{idx + 1}</td>
                <td className="omschrijving">{item.omschrijving || '—'}</td>
                <td className="rechts">{Number(item.hoeveelheid)}</td>
                <td>{item.eenheid}</td>
                <td className="rechts">€ {fmt(item.eenheidsprijs)}</td>
                <td className="center">{item.btw_percentage ?? 21}%</td>
                <td className="rechts">€ {fmt(lijnTotaal)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* ── TOTALEN SECTIE ────────────────────────────────────────────────── */}
      <div className="fp-totalen-wrapper">
        <div className="fp-totalen-kader">
          {/* Subtotaal */}
          <div className="fp-totalen-rij">
            <span className="label">Subtotaal excl. BTW</span>
            <span className="bedrag">€ {fmt(subtotaal)}</span>
          </div>

          {/* BTW per tarief */}
          {Object.entries(groepen).sort(([a], [b]) => Number(a) - Number(b)).map(([tarief, g]) => (
            <div key={tarief} className="fp-totalen-rij">
              <span className="label">BTW {tarief}% (op € {fmt(g.basis)})</span>
              <span className="bedrag">€ {fmt(g.btw)}</span>
            </div>
          ))}

          <hr className="fp-totalen-lijn-dik" />

          {/* Hoofdtotaal */}
          <div className="fp-totalen-rij hoofdtotaal">
            <span className="label">TOTAAL incl. BTW</span>
            <span className="bedrag">€ {fmt(incl)}</span>
          </div>

          {/* Gedeeltelijk betaald */}
          {betaald > 0.01 && (
            <>
              <hr className="fp-totalen-lijn" />
              <div className="fp-totalen-rij betaald">
                <span className="label">Reeds betaald</span>
                <span className="bedrag">-€ {fmt(betaald)}</span>
              </div>
              <hr className="fp-totalen-lijn" />
              <div className="fp-totalen-rij saldo">
                <span className="label">OPENSTAAND SALDO</span>
                <span className="bedrag">€ {fmt(openSaldo)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── BETALINGSINFORMATIE ───────────────────────────────────────────── */}
      {!isCreditnota && (iban || bic) && (
        <div className="fp-betaling-kader">
          <div className="fp-betaling-titel">Betalingsinformatie</div>
          {factuur.verval_datum && (
            <div className="fp-betaling-vervaldatum">
              Gelieve te betalen vóór {datumNL(factuur.verval_datum)}
            </div>
          )}
          {iban && (
            <div className="fp-betaling-rij">
              <span className="sleutel">IBAN</span>
              <span className="waarde">{iban}</span>
            </div>
          )}
          {bic && (
            <div className="fp-betaling-rij">
              <span className="sleutel">BIC / SWIFT</span>
              <span className="waarde">{bic}</span>
            </div>
          )}
          {factuur.notities && (
            <div className="fp-betaling-rij">
              <span className="sleutel">Mededeling</span>
              <span className="waarde">{factuur.notities}</span>
            </div>
          )}
        </div>
      )}

      {/* ── KLANTNOTITIES ─────────────────────────────────────────────────── */}
      {factuur.notities && !factuur.notities.startsWith('+++') && (
        <div className="fp-notities">
          <div className="fp-notities-label">Opmerking</div>
          {factuur.notities}
        </div>
      )}

      {/* ── WETTELIJKE VOETTEKST ──────────────────────────────────────────── */}
      <div className="fp-voettekst">
        <span className="fp-voettekst-tekst">
          Bij laattijdige betaling is van rechtswege en zonder ingebrekestelling een nalatigheidsintrest verschuldigd
          van {intrest}% per jaar, alsook een forfaitaire schadevergoeding van € {fmt(forfait)}.
          Toepasselijk recht: Belgisch recht. {bedrijfBtw && `BTW: ${bedrijfBtw}.`}
        </span>
        <span>{bedrijfNaam}{bedrijfEmail ? ` · ${bedrijfEmail}` : ''}</span>
      </div>
    </div>
  )
}
