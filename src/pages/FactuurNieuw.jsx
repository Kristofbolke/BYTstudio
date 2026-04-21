// FactuurNieuw.jsx — Nieuwe factuur aanmaken (met Belgische wettelijke vereisten)
import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useInstellingen } from '../context/InstellingenContext'
import { Plus, Trash2, ChevronLeft, Save, ChevronDown, Info, CheckCircle, AlertTriangle } from 'lucide-react'

const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#78C833]/20 focus:border-[#78C833] bg-white transition-colors'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

const LEEG_ITEM = { omschrijving: '', hoeveelheid: 1, eenheid: 'uur', eenheidsprijs: 0, btw_percentage: 21 }
const EENHEDEN  = ['uur', 'dag', 'stuk', 'forfait', 'maand', 'km', '%']
const BTW_OPTIES = [0, 6, 12, 21]

function addDagen(datum, dagen) {
  const d = new Date(datum)
  d.setDate(d.getDate() + Number(dagen))
  return d.toISOString().split('T')[0]
}

function fmt(n) { return Number(n ?? 0).toFixed(2).replace('.', ',') }

// Bereken BTW-subtotalen gegroepeerd per tarief
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

// Belgische gestructureerde mededeling +++XXX/XXXX/XXXXX++
function genereerMededeling(nummer) {
  const digits = String(nummer).replace(/\D/g, '').padStart(10, '0').slice(-10)
  const a = digits.slice(0, 3)
  const b = digits.slice(3, 7)
  const c = digits.slice(7, 9)
  const rest = Number(digits) % 97 || 97
  const chk = String(rest).padStart(2, '0')
  return `+++${a}/${b}/${c}${chk}+++`
}

export default function FactuurNieuw() {
  const navigate         = useNavigate()
  const location         = useLocation()
  const [searchParams]   = useSearchParams()
  const { instellingen, laden: instLaden } = useInstellingen()

  const vandaag = new Date().toISOString().split('T')[0]

  const [klanten,     setKlanten]     = useState([])
  const [projecten,   setProjecten]   = useState([])
  const [offertes,    setOffertes]    = useState([])
  const [laden,       setLaden]       = useState(false)
  const [initLaden,   setInitLaden]   = useState(true)
  const [fout,        setFout]        = useState('')
  const [foutKlanten, setFoutKlanten] = useState(false)
  const [foutOfferte, setFoutOfferte] = useState(false)
  const [type,        setType]        = useState('standaard') // 'standaard' | 'voorschot'

  const [form, setForm] = useState({
    klant_id:             '',
    project_id:           '',
    offerte_id:           '',
    factuur_nummer:       '',
    factuur_datum:        vandaag,
    verval_datum:         addDagen(vandaag, 30),
    is_voorschot:         false,
    voorschot_percentage: 30,
    iban:                 '',
    bic:                  '',
    mededeling:           '',
    notities:             '',
    interne_notities:     '',
    items:                [{ ...LEEG_ITEM }],
  })

  // ── Stamdata laden ──────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Nieuwe factuur — BYT Studio'

    async function init() {
      const jaar = new Date().getFullYear()

      // 1. Factuurnummer (COUNT) — eigen try/catch met fallback op -001
      try {
        const { count, error } = await supabase
          .from('facturen')
          .select('id', { count: 'exact', head: true })
          .gte('factuur_datum', `${jaar}-01-01`)
        if (error) throw error
        const volg = String((count ?? 0) + 1).padStart(3, '0')
        setForm(f => ({
          ...f,
          factuur_nummer: `FACT-${jaar}-${volg}`,
          mededeling: genereerMededeling(volg),
        }))
      } catch (err) {
        console.error('Factuurnummer ophalen mislukt:', err)
        setForm(f => ({
          ...f,
          factuur_nummer: `FACT-${jaar}-001`,
          mededeling: genereerMededeling('001'),
        }))
      }

      // 2. Klanten laden — eigen try/catch, blokkerend bij fout
      try {
        const { data, error } = await supabase
          .from('klanten')
          .select('id, naam, bedrijfsnaam, email, btw_nummer, adres')
          .order('naam')
        if (error) throw error
        setKlanten(data ?? [])
      } catch {
        setFoutKlanten(true)
      }

      // 3. Projecten + offertes — niet-blokkerend, stille fallback
      const { data: prData } = await supabase
        .from('projecten').select('id, naam, klant_id').order('naam')
      setProjecten(prData ?? [])
      const { data: offData } = await supabase
        .from('offertes').select('id, nummer, klant_id, project_id, items_json, btw').eq('status', 'goedgekeurd')
      setOffertes(offData ?? [])

      setInitLaden(false)
    }
    init()
  }, [])

  // ── Instellingen toepassen ──────────────────────────────────────────────────
  useEffect(() => {
    if (instLaden) return
    setForm(f => ({
      ...f,
      verval_datum: addDagen(f.factuur_datum, instellingen.betalingstermijn ?? 30),
      iban: instellingen.iban ?? '',
      bic:  instellingen.bic  ?? '',
      items: f.items.map(it => ({ ...it, btw_percentage: instellingen.btw_percentage ?? 21 })),
    }))
  }, [instLaden])

  // ── Query params: offerte_id, project_id, klant_id, type ────────────────────
  useEffect(() => {
    if (initLaden) return
    const qOffId = searchParams.get('offerte_id')
    const qProjId = searchParams.get('project_id')
    const qKlantId = searchParams.get('klant_id')
    const qType = searchParams.get('type')

    if (qType === 'voorschot') setType('voorschot')

    if (qOffId) {
      // Laad offertedata — eigen try/catch, form blijft bruikbaar bij fout
      async function laadOfferte() {
        try {
          const { data: off, error } = await supabase
            .from('offertes').select('*').eq('id', qOffId).single()
          if (error) throw error
          if (!off) throw new Error('Offerte niet gevonden')
          const items = Array.isArray(off.items_json)
            ? off.items_json.map(it => ({ ...LEEG_ITEM, ...it, btw_percentage: it.btw_percentage ?? off.btw ?? 21 }))
            : [{ ...LEEG_ITEM }]
          setForm(f => ({
            ...f,
            klant_id:   off.klant_id   ?? qKlantId ?? '',
            project_id: off.project_id ?? qProjId  ?? '',
            offerte_id: off.id,
            items,
          }))
        } catch {
          setFoutOfferte(true)
        }
      }
      laadOfferte()
    } else {
      if (qKlantId) setForm(f => ({ ...f, klant_id: qKlantId }))
      if (qProjId)  setForm(f => ({ ...f, project_id: qProjId }))
    }

    // location.state.offerte (van Offertes-pagina)
    const off = location.state?.offerte
    if (off) {
      const items = Array.isArray(off.items_json)
        ? off.items_json.map(it => ({ ...LEEG_ITEM, ...it, btw_percentage: it.btw_percentage ?? off.btw ?? 21 }))
        : [{ ...LEEG_ITEM }]
      setForm(f => ({
        ...f,
        klant_id:   off.klant_id   ?? '',
        project_id: off.project_id ?? '',
        offerte_id: off.id,
        items,
      }))
    }
  }, [initLaden])

  function stelIn(veld, waarde) { setForm(f => ({ ...f, [veld]: waarde })) }

  function itemWijzig(idx, veld, waarde) {
    setForm(f => {
      const items = f.items.map((it, i) => i === idx ? { ...it, [veld]: waarde } : it)
      return { ...f, items }
    })
  }

  function voegItemToe() { setForm(f => ({ ...f, items: [...f.items, { ...LEEG_ITEM, btw_percentage: instellingen.btw_percentage ?? 21 }] })) }
  function verwijderItem(idx) { setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) })) }

  const { subtotaal, btwBedrag, incl, groepen } = berekenTotalen(form.items)
  const gefilterdePro = projecten.filter(p => !form.klant_id || p.klant_id === form.klant_id)
  const gefilterdOff  = offertes.filter(o  => !form.klant_id || o.klant_id === form.klant_id)
  const klantNaam = (k) => k.bedrijfsnaam || k.naam

  // Geselecteerde klant voor BTW-nummer weergave
  const geselecteerdeKlant = klanten.find(k => k.id === form.klant_id)

  async function opslaan(statusOvr = 'concept') {
    if (!form.klant_id)       { setFout('Selecteer een klant.'); return }
    if (!form.factuur_nummer) { setFout('Factuurnummer is verplicht.'); return }
    setLaden(true); setFout('')

    const isVoorschot = type === 'voorschot'
    const { data, error } = await supabase.from('facturen').insert({
      klant_id:             form.klant_id   || null,
      project_id:           form.project_id || null,
      offerte_id:           form.offerte_id || null,
      factuur_nummer:       form.factuur_nummer,
      status:               statusOvr,
      factuur_datum:        form.factuur_datum,
      verval_datum:         form.verval_datum || null,
      items_json:           form.items,
      subtotaal,
      btw_percentage:       21, // hoofdtarief, detail staat in items_json
      btw_bedrag:           btwBedrag,
      totaal_incl:          incl,
      betaald_bedrag:       0,
      is_voorschot:         isVoorschot,
      voorschot_percentage: isVoorschot ? Number(form.voorschot_percentage) : null,
      notities:             form.notities         || null,
      interne_notities:     form.interne_notities || null,
    }).select('id').single()

    setLaden(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    navigate(`/facturen/${data.id}`)
  }

  if (initLaden) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#78C833', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="max-w-5xl space-y-5">
      {/* Breadcrumb */}
      <button onClick={() => navigate('/facturen')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        <ChevronLeft size={15} /> Facturen
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nieuwe factuur</h1>
          <p className="text-xs text-gray-400 mt-0.5">{form.factuur_nummer}</p>
        </div>

        {/* Type toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {[{ key: 'standaard', label: 'Standaard' }, { key: 'voorschot', label: 'Voorschotfactuur' }].map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                type === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Hoofdformulier ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Klant + Project + Offerte */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Relatie</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Klant <span className="text-red-400">*</span></label>
                {foutKlanten ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50">
                    <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                    <span className="text-xs text-red-600 flex-1">Klanten konden niet worden geladen. Herlaad de pagina.</span>
                    <button onClick={() => window.location.reload()}
                      className="text-xs font-semibold text-red-600 underline underline-offset-2 whitespace-nowrap">
                      Herlaad
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <select value={form.klant_id} onChange={e => stelIn('klant_id', e.target.value)}
                        className={inp + ' appearance-none pr-8'}>
                        <option value="">— Kies klant —</option>
                        {klanten.map(k => <option key={k.id} value={k.id}>{klantNaam(k)}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                    {geselecteerdeKlant?.btw_nummer && (
                      <p className="text-xs text-gray-400 mt-1">BTW: {geselecteerdeKlant.btw_nummer}</p>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className={lbl}>Project</label>
                <div className="relative">
                  <select value={form.project_id} onChange={e => stelIn('project_id', e.target.value)}
                    className={inp + ' appearance-none pr-8'}>
                    <option value="">— Optioneel —</option>
                    {gefilterdePro.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            {gefilterdOff.length > 0 && (
              <div>
                <label className={lbl}>Gebaseerd op offerte</label>
                <div className="relative">
                  <select value={form.offerte_id} onChange={e => {
                    const off = offertes.find(o => o.id === e.target.value)
                    if (off) {
                      const items = Array.isArray(off.items_json)
                        ? off.items_json.map(it => ({ ...LEEG_ITEM, ...it, btw_percentage: it.btw_percentage ?? off.btw ?? 21 }))
                        : [{ ...LEEG_ITEM }]
                      setForm(f => ({ ...f, offerte_id: off.id, project_id: off.project_id ?? f.project_id, items }))
                    } else {
                      stelIn('offerte_id', '')
                    }
                  }} className={inp + ' appearance-none pr-8'}>
                    <option value="">— Geen —</option>
                    {gefilterdOff.map(o => <option key={o.id} value={o.id}>{o.nummer}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Offerte laadwaarschuwing */}
          {foutOfferte && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Offerte kon niet worden geladen. Vul de gegevens manueel in.
              </p>
            </div>
          )}

          {/* Regelitems */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Regelitems</p>

            {/* Header */}
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
              {form.items.map((item, idx) => {
                const lijnTotaal = (Number(item.hoeveelheid) || 0) * (Number(item.eenheidsprijs) || 0)
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input value={item.omschrijving}
                        onChange={e => itemWijzig(idx, 'omschrijving', e.target.value)}
                        placeholder="Omschrijving..."
                        className={inp + ' text-xs'} />
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
                        <select value={item.btw_percentage}
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
                      {form.items.length > 1 && (
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
              className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-[#78C833] transition-colors mt-2">
              <Plus size={14} /> Regel toevoegen
            </button>
          </div>

          {/* BTW-subtotalen per tarief */}
          {Object.keys(groepen).length > 1 && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">BTW-detail per tarief</p>
              {Object.entries(groepen).sort(([a], [b]) => Number(a) - Number(b)).map(([tarief, g]) => (
                <div key={tarief} className="flex justify-between text-xs text-gray-600">
                  <span>BTW {tarief}% op € {fmt(g.basis)}</span>
                  <span>€ {fmt(g.btw)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Belgische wettelijke vermeldingen */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-blue-500 flex-shrink-0" />
              <p className="text-xs font-bold text-blue-700">Verplichte Belgische vermeldingen</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                'Naam en adres leverancier',
                'BTW-nummer leverancier',
                'Naam en adres klant',
                'BTW-nummer klant (B2B)',
                'Uniek factuurnummer',
                'Factuurdatum',
                'Vervaldatum betaling',
                'Beschrijving dienst/product',
                'Maatstaf van heffing per BTW-tarief',
                'Toe te passen BTW-tarief',
                'Totaal BTW-bedrag',
                'Totaal te betalen bedrag',
              ].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-blue-600">
                  <CheckCircle size={12} className="text-blue-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Betalingsinformatie */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Betalingsinformatie</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>IBAN</label>
                <input value={form.iban} onChange={e => stelIn('iban', e.target.value)}
                  placeholder="BE68 5390 0754 7034"
                  className={inp + ' font-mono'} />
              </div>
              <div>
                <label className={lbl}>BIC / SWIFT</label>
                <input value={form.bic} onChange={e => stelIn('bic', e.target.value)}
                  placeholder="TRIOBEBB"
                  className={inp + ' font-mono'} />
              </div>
            </div>
            <div>
              <label className={lbl}>Gestructureerde mededeling</label>
              <div className="flex gap-2">
                <input value={form.mededeling} onChange={e => stelIn('mededeling', e.target.value)}
                  placeholder="+++XXX/XXXX/XXXXX+++"
                  className={inp + ' font-mono flex-1'} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Automatisch gegenereerd op basis van factuurnummer. Aanpasbaar.
              </p>
            </div>
          </div>

          {/* Notities */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notities</p>
            <div>
              <label className={lbl}>Klantnotities (zichtbaar op factuur)</label>
              <textarea value={form.notities} onChange={e => stelIn('notities', e.target.value)}
                rows={3} placeholder="Betalingsinstructies, referenties..."
                className={inp + ' resize-none'} />
            </div>
            <div>
              <label className={lbl}>Interne notities (niet zichtbaar voor klant)</label>
              <textarea value={form.interne_notities} onChange={e => stelIn('interne_notities', e.target.value)}
                rows={2} placeholder="Interne opmerkingen..."
                className={inp + ' resize-none'} />
            </div>
          </div>
        </div>

        {/* ── Rechterpaneel ───────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Factuurgegevens */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Factuurgegevens</p>
            <div>
              <label className={lbl}>Factuurnummer <span className="text-red-400">*</span></label>
              <input value={form.factuur_nummer}
                onChange={e => {
                  stelIn('factuur_nummer', e.target.value)
                  setForm(f => ({ ...f, factuur_nummer: e.target.value, mededeling: genereerMededeling(e.target.value) }))
                }}
                className={inp + ' font-mono'} />
            </div>
            <div>
              <label className={lbl}>Factuurdatum</label>
              <input type="date" value={form.factuur_datum}
                onChange={e => {
                  const d = e.target.value
                  setForm(f => ({ ...f, factuur_datum: d, verval_datum: addDagen(d, instellingen.betalingstermijn ?? 30) }))
                }}
                className={inp} />
            </div>
            <div>
              <label className={lbl}>Vervaldatum</label>
              <input type="date" value={form.verval_datum}
                onChange={e => stelIn('verval_datum', e.target.value)} className={inp} />
            </div>
          </div>

          {/* Voorschot (enkel als type === 'voorschot') */}
          {type === 'voorschot' && (
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 space-y-3">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Voorschotfactuur</p>
              <div>
                <label className={lbl}>Voorschot percentage</label>
                <div className="flex gap-1.5">
                  {[25, 30, 50, 100].map(p => (
                    <button key={p} onClick={() => stelIn('voorschot_percentage', p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        Number(form.voorschot_percentage) === p
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-amber-400'
                      }`}>
                      {p}%
                    </button>
                  ))}
                </div>
                <input type="number" min="1" max="100" value={form.voorschot_percentage}
                  onChange={e => stelIn('voorschot_percentage', e.target.value)}
                  className={inp + ' mt-2'} />
              </div>
              <div className="flex justify-between text-sm font-semibold text-amber-700 pt-1 border-t border-amber-100">
                <span>Voorschotbedrag</span>
                <span>€ {fmt(incl * (Number(form.voorschot_percentage) / 100))}</span>
              </div>
            </div>
          )}

          {/* Totalen */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Totalen</p>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotaal excl. BTW</span>
              <span>€ {fmt(subtotaal)}</span>
            </div>

            {/* BTW per tarief (als er meerdere zijn) */}
            {Object.entries(groepen).sort(([a], [b]) => Number(a) - Number(b)).map(([tarief, g]) => (
              <div key={tarief} className="flex justify-between text-xs text-gray-400">
                <span>BTW {tarief}%</span>
                <span>€ {fmt(g.btw)}</span>
              </div>
            ))}

            <div className="flex justify-between text-sm text-gray-600">
              <span>Totaal BTW</span>
              <span>€ {fmt(btwBedrag)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Totaal incl. BTW</span>
              <span style={{ color: '#78C833' }}>€ {fmt(incl)}</span>
            </div>
          </div>

          {/* Foutmelding */}
          {fout && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              {fout}
            </div>
          )}

          {/* Acties */}
          <div className="space-y-2">
            <button onClick={() => opslaan('verstuurd')} disabled={laden}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ background: '#78C833' }}>
              <Save size={14} />
              {laden ? 'Opslaan...' : 'Sla op als verstuurd'}
            </button>
            <button onClick={() => opslaan('concept')} disabled={laden}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-60">
              Bewaar als concept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
