// src/pages/Instellingen.jsx — Persoonlijke configuratie voor de developer/eigenaar
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { useInstellingen } from '../context/InstellingenContext'
import { Building2, CreditCard, Megaphone, Settings, CheckCircle, AlertCircle, Download, LogOut, Trash2, Package, Plus, X, Edit3 } from 'lucide-react'

const LEGE_INST = {
  eigenaar_naam: '',
  bedrijfsnaam: 'Build Your Tools',
  btw_nummer: '',
  adres: '',
  email: '',
  telefoon: '',
  website: '',
  iban: '',
  bic: '',
  logo_url: '',
  uurtarief: 75,
  btw_percentage: 21,
  marge_percentage: 15,
  offerte_geldigheid: 30,
  offerte_voorwaarden: 'Onderhavige offerte is vrijblijvend en geldig gedurende 30 dagen. Bij aanvaarding wordt een voorschot van 30% gefactureerd.',
  factuur_voorwaarden: 'Bij laattijdige betaling is van rechtswege en zonder ingebrekestelling een nalatigheidsintrrest verschuldigd van 10% per jaar, alsook een forfaitaire schadevergoeding van €40. Toepasselijk recht: Belgisch recht. Bevoegde rechtbank: arrondissement Gent.',
  betalingstermijn: 30,
  nalatigheidsintrest: 10,
  forfait_schadevergoeding: 40,
  rechtbank: 'arrondissement Gent',
  standaard_projectstatus: 'intake',
  standaard_handleiding_versie: 'v1.0',
  standaard_auteur_handleiding: 'Build Your Tools',
  banner_zichtbaar: true,
  banner_titel: 'Welkom bij Build Your Tools',
  banner_subtitel: 'Slimme apps voor slimme bedrijven',
}

function Bericht({ tekst }) {
  if (!tekst) return null
  const isError = tekst.startsWith('Fout')
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
      {isError
        ? <AlertCircle size={13} />
        : <CheckCircle size={13} />}
      {tekst}
    </div>
  )
}

function SectieKaart({ icon: Icon, titel, subtitel, children, onOpslaan, laden, bericht, opslaanLabel = 'Opslaan' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#78C833]/10 flex items-center justify-center">
            <Icon size={16} className="text-[#78C833]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{titel}</p>
            <p className="text-xs text-gray-400 mt-0.5">{subtitel}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        {children}
        <div className="pt-1 flex items-center gap-3">
          <button
            onClick={onOpslaan}
            disabled={laden}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: '#78C833' }}
          >
            {laden ? 'Opslaan...' : opslaanLabel}
          </button>
          <Bericht tekst={bericht} />
        </div>
      </div>
    </div>
  )
}

function Veld({ label, children }) {
  return (
    <div>
      <div className="block text-xs font-medium text-gray-500 mb-1.5">{label}</div>
      {children}
    </div>
  )
}

const inputKlasse = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#78C833]/20 focus:border-[#78C833] transition-colors"
const textareaKlasse = `${inputKlasse} resize-none`

const TYPE_KLEUREN_BP = {
  component:    { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  configurator: { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
  scaffold:     { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  service:      { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
}

const LEEG_BP_FORM = {
  naam: '', type: 'component', categorie: '', beschrijving: '', versie: '1.0',
  github_url: '', bestand_pad: '', aanpassingsprompt_template: '',
  actief: true, tags_json: [], afhankelijkheden_json: [],
}

function SectieBoilerplates() {
  const [boilerplates, setBoilerplates] = useState([])
  const [koppelingTelling, setKoppelingTelling] = useState({})
  const [aantalProjecten, setAantalProjecten] = useState(0)
  const [laden, setLaden] = useState(true)
  const [formulier, setFormulier] = useState(null)
  const [tagInvoer, setTagInvoer] = useState('')
  const [depInvoer, setDepInvoer] = useState('')
  const [opslaanLaden, setOpslaanLaden] = useState(false)
  const [bericht, setBericht] = useState('')
  const [verwijderBevestig, setVerwijderBevestig] = useState(null)

  useEffect(() => { laad() }, [])

  async function laad() {
    setLaden(true)
    const [{ data: bps }, { data: koppels }] = await Promise.all([
      supabase.from('boilerplates').select('*').order('naam'),
      supabase.from('project_boilerplates').select('boilerplate_id, project_id'),
    ])
    setBoilerplates(bps ?? [])
    const telling = {}
    ;(koppels ?? []).forEach(k => { telling[k.boilerplate_id] = (telling[k.boilerplate_id] ?? 0) + 1 })
    setKoppelingTelling(telling)
    setAantalProjecten(new Set((koppels ?? []).map(k => k.project_id)).size)
    setLaden(false)
  }

  const meestGebruikt = boilerplates.reduce((best, bp) =>
    (koppelingTelling[bp.id] ?? 0) > (koppelingTelling[best?.id] ?? 0) ? bp : best
  , null)

  function stelF(veld) {
    return e => setFormulier(prev => ({ ...prev, [veld]: e.target.value }))
  }

  function voegTagToe() {
    const t = tagInvoer.trim()
    if (!t || (formulier.tags_json ?? []).includes(t)) return
    setFormulier(prev => ({ ...prev, tags_json: [...(prev.tags_json ?? []), t] }))
    setTagInvoer('')
  }

  function voegDepToe() {
    const d = depInvoer.trim()
    if (!d || (formulier.afhankelijkheden_json ?? []).includes(d)) return
    setFormulier(prev => ({ ...prev, afhankelijkheden_json: [...(prev.afhankelijkheden_json ?? []), d] }))
    setDepInvoer('')
  }

  async function slaOpBP() {
    if (!formulier?.naam?.trim()) { setBericht('Fout: naam is verplicht.'); return }
    setOpslaanLaden(true)
    setBericht('')
    const payload = {
      naam: formulier.naam.trim(),
      type: formulier.type,
      categorie: formulier.categorie || null,
      beschrijving: formulier.beschrijving || null,
      versie: formulier.versie || '1.0',
      github_url: formulier.github_url || null,
      bestand_pad: formulier.bestand_pad || null,
      aanpassingsprompt_template: formulier.aanpassingsprompt_template || null,
      actief: !!formulier.actief,
      tags_json: formulier.tags_json ?? [],
      afhankelijkheden_json: formulier.afhankelijkheden_json ?? [],
      bijgewerkt_op: new Date().toISOString(),
    }
    let error
    if (formulier.id) {
      ;({ error } = await supabase.from('boilerplates').update(payload).eq('id', formulier.id))
    } else {
      ;({ error } = await supabase.from('boilerplates').insert(payload))
    }
    if (error) setBericht('Fout: ' + error.message)
    else { await laad(); setFormulier(null); setBericht('') }
    setOpslaanLaden(false)
  }

  async function verwijder(id) {
    const { error } = await supabase.from('boilerplates').delete().eq('id', id)
    if (!error) { setVerwijderBevestig(null); await laad() }
  }

  async function toggleActief(bp) {
    await supabase.from('boilerplates').update({ actief: !bp.actief }).eq('id', bp.id)
    setBoilerplates(prev => prev.map(b => b.id === bp.id ? { ...b, actief: !b.actief } : b))
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#78C833]/10 flex items-center justify-center">
              <Package size={16} className="text-[#78C833]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Boilerplate Bibliotheek</p>
              <p className="text-xs text-gray-400 mt-0.5">Beheer herbruikbare componenten en scaffolds.</p>
            </div>
          </div>
          {!formulier && (
            <button
              onClick={() => { setFormulier({ ...LEEG_BP_FORM }); setBericht('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ background: '#78C833' }}
            >
              <Plus size={14} />
              Nieuwe boilerplate
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Statistieken */}
        {!laden && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-2xl font-bold text-gray-800">{boilerplates.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Totaal boilerplates</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm font-semibold text-gray-800 truncate">{meestGebruikt ? meestGebruikt.naam : '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Meest gebruikt</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-2xl font-bold text-gray-800">{aantalProjecten}</p>
              <p className="text-xs text-gray-400 mt-0.5">Gekoppelde projecten</p>
            </div>
          </div>
        )}

        {/* Inline formulier */}
        {formulier && (
          <div className="border border-gray-200 rounded-xl p-4 space-y-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {formulier.id ? 'Boilerplate bewerken' : 'Nieuwe boilerplate'}
              </p>
              <button onClick={() => { setFormulier(null); setBericht('') }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Veld label="Naam *">
                  <input className={inputKlasse} value={formulier.naam} onChange={stelF('naam')} placeholder="Adres & Contact Configurator" />
                </Veld>
              </div>
              <Veld label="Type">
                <select className={inputKlasse} value={formulier.type} onChange={stelF('type')}>
                  <option value="component">component</option>
                  <option value="configurator">configurator</option>
                  <option value="scaffold">scaffold</option>
                  <option value="service">service</option>
                </select>
              </Veld>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Veld label="Categorie">
                <input className={inputKlasse} value={formulier.categorie} onChange={stelF('categorie')} placeholder="ui, api, auth..." />
              </Veld>
              <Veld label="Versie">
                <input className={inputKlasse} value={formulier.versie} onChange={stelF('versie')} placeholder="1.0" />
              </Veld>
            </div>

            <Veld label="Beschrijving">
              <textarea className={`${inputKlasse} resize-none`} rows={2} value={formulier.beschrijving} onChange={stelF('beschrijving')} placeholder="Korte omschrijving van de boilerplate..." />
            </Veld>

            <div className="grid grid-cols-2 gap-3">
              <Veld label="GitHub URL">
                <input className={inputKlasse} value={formulier.github_url} onChange={stelF('github_url')} placeholder="https://github.com/..." />
              </Veld>
              <Veld label="Bestandspad">
                <input className={inputKlasse} value={formulier.bestand_pad} onChange={stelF('bestand_pad')} placeholder="src/components/..." />
              </Veld>
            </div>

            <Veld label="Aanpassingsprompt template">
              <textarea className={`${inputKlasse} resize-none`} rows={3} value={formulier.aanpassingsprompt_template} onChange={stelF('aanpassingsprompt_template')} placeholder="Gebruik [KLANT_NAAM] en [AANPASSINGEN] als variabelen..." />
            </Veld>

            <Veld label="Tags">
              <div className="flex gap-2 mb-2 flex-wrap">
                {(formulier.tags_json ?? []).map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#78C833]/10 text-[#78C833] text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => setFormulier(p => ({ ...p, tags_json: p.tags_json.filter(t => t !== tag) }))} className="hover:text-red-500">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={`${inputKlasse} flex-1`}
                  value={tagInvoer}
                  onChange={e => setTagInvoer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); voegTagToe() } }}
                  placeholder="tag toevoegen (Enter)"
                />
                <button type="button" onClick={voegTagToe} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:border-[#78C833] hover:text-[#78C833] transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </Veld>

            <Veld label="Afhankelijkheden (npm-packages)">
              <div className="flex gap-2 mb-2 flex-wrap">
                {(formulier.afhankelijkheden_json ?? []).map(dep => (
                  <span key={dep} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                    {dep}
                    <button type="button" onClick={() => setFormulier(p => ({ ...p, afhankelijkheden_json: p.afhankelijkheden_json.filter(d => d !== dep) }))} className="hover:text-red-500">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={`${inputKlasse} flex-1`}
                  value={depInvoer}
                  onChange={e => setDepInvoer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); voegDepToe() } }}
                  placeholder="package-naam (Enter)"
                />
                <button type="button" onClick={voegDepToe} className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:border-[#78C833] hover:text-[#78C833] transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </Veld>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormulier(p => ({ ...p, actief: !p.actief }))}
                style={{ width: 40, height: 22, flexShrink: 0 }}
                className={`relative rounded-full transition-colors ${formulier.actief ? 'bg-[#78C833]' : 'bg-gray-200'}`}
              >
                <span
                  className="absolute top-0.5 left-0.5 bg-white rounded-full shadow"
                  style={{ width: 18, height: 18, transform: formulier.actief ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.15s' }}
                />
              </button>
              <span className="text-sm text-gray-600">Actief (zichtbaar in projecten)</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={slaOpBP}
                disabled={opslaanLaden}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
                style={{ background: '#78C833' }}
              >
                {opslaanLaden ? 'Opslaan...' : formulier.id ? 'Wijzigingen opslaan' : 'Boilerplate aanmaken'}
              </button>
              <button
                onClick={() => { setFormulier(null); setBericht('') }}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:border-gray-300 transition-colors"
              >
                Annuleren
              </button>
              {bericht && <Bericht tekst={bericht} />}
            </div>
          </div>
        )}

        {/* Tabel */}
        {laden ? (
          <p className="text-sm text-gray-400">Laden...</p>
        ) : boilerplates.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Nog geen boilerplates. Klik op "+ Nieuwe boilerplate" om te beginnen.
          </div>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Naam</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Versie</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Gebruik</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Actief</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {boilerplates.map(bp => {
                  const tk = TYPE_KLEUREN_BP[bp.type] ?? TYPE_KLEUREN_BP.component
                  const gebruik = koppelingTelling[bp.id] ?? 0
                  return (
                    <tr key={bp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{bp.naam}</p>
                        {bp.beschrijving && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{bp.beschrijving}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium border"
                          style={{ background: tk.bg, color: tk.text, borderColor: tk.border }}
                        >
                          {bp.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{bp.versie ?? '—'}</td>
                      <td className="px-4 py-3">
                        {gebruik > 0 ? (
                          <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            {gebruik}× gebruikt
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Niet gekoppeld</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActief(bp)}
                          style={{ width: 36, height: 20 }}
                          className={`relative rounded-full transition-colors mx-auto block ${bp.actief ? 'bg-[#78C833]' : 'bg-gray-200'}`}
                        >
                          <span
                            className="absolute top-0.5 left-0.5 bg-white rounded-full shadow"
                            style={{ width: 16, height: 16, transform: bp.actief ? 'translateX(16px)' : 'translateX(0)', transition: 'transform 0.15s' }}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setFormulier({ ...bp, tags_json: bp.tags_json ?? [], afhankelijkheden_json: bp.afhankelijkheden_json ?? [] })
                              setTagInvoer('')
                              setDepInvoer('')
                              setBericht('')
                            }}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-[#78C833] hover:text-[#78C833] transition-colors"
                            title="Bewerken"
                          >
                            <Edit3 size={13} />
                          </button>
                          {gebruik === 0 ? (
                            verwijderBevestig === bp.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => verwijder(bp.id)} className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors">Ja</button>
                                <button onClick={() => setVerwijderBevestig(null)} className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:border-gray-300 transition-colors">Nee</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setVerwijderBevestig(bp.id)}
                                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
                                title="Verwijderen"
                              >
                                <Trash2 size={13} />
                              </button>
                            )
                          ) : (
                            <span className="p-1.5 text-gray-300 cursor-not-allowed" title="Kan niet verwijderen: gekoppeld aan projecten">
                              <Trash2 size={13} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Instellingen() {
  useEffect(() => { document.title = 'Instellingen — BYT Studio' }, [])
  const navigate = useNavigate()
  const { herlaad } = useInstellingen()
  const [inst, setInst] = useState(LEGE_INST)
  const [instId, setInstId] = useState(null)
  const [laden, setLaden] = useState(true)
  const [authEmail, setAuthEmail] = useState('')

  // Per-sectie laden en bericht
  const [ladenBedrijf, setLadenBedrijf] = useState(false)
  const [berichtBedrijf, setBerichtBedrijf] = useState('')
  const [ladenFinancieel, setLadenFinancieel] = useState(false)
  const [berichtFinancieel, setBerichtFinancieel] = useState('')
  const [ladenBanner, setLadenBanner] = useState(false)
  const [berichtBanner, setBerichtBanner] = useState('')
  const [ladenApp, setLadenApp] = useState(false)
  const [berichtApp, setBerichtApp] = useState('')

  // App-beheer UI-staat
  const [resetVerzonden, setResetVerzonden] = useState(false)
  const [exporterenKlanten, setExporterenKlanten] = useState(false)
  const [exporterenProjecten, setExporterenProjecten] = useState(false)
  const [verwijderTekst, setVerwijderTekst] = useState('')
  const [verwijderDialog, setVerwijderDialog] = useState(false)
  const [verwijderLaden, setVerwijderLaden] = useState(false)
  const [verwijderBericht, setVerwijderBericht] = useState('')

  useEffect(() => {
    laadInstellingen()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAuthEmail(user.email ?? '')
    })
  }, [])

  async function laadInstellingen() {
    setLaden(true)
    const { data, error } = await supabase
      .from('instellingen')
      .select('*')
      .limit(1)
      .single()
    if (data) {
      setInstId(data.id)
      setInst({ ...LEGE_INST, ...data })
    }
    setLaden(false)
  }

  function stel(veld) {
    return e => setInst(prev => ({ ...prev, [veld]: e.target.value }))
  }

  function stellNum(veld) {
    return e => setInst(prev => ({ ...prev, [veld]: parseFloat(e.target.value) || 0 }))
  }

  async function slaOp(velden, setLadenFn, setBerichtFn, succesMsg = 'Opgeslagen.') {
    if (!instId) return
    setLadenFn(true)
    setBerichtFn('')
    const payload = {}
    velden.forEach(v => { payload[v] = inst[v] })
    payload.bijgewerkt_op = new Date().toISOString()
    const { error } = await supabase.from('instellingen').update(payload).eq('id', instId)
    if (error) setBerichtFn('Fout: ' + error.message)
    else { setBerichtFn(succesMsg); herlaad() }
    setLadenFn(false)
  }

  async function stuurResetLink() {
    if (!authEmail) return
    setResetVerzonden(false)
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail)
    if (!error) setResetVerzonden(true)
  }

  function downloadCsv(bestandsnaam, rijen, kolommen) {
    const header = kolommen.join(';')
    const body = rijen.map(r => kolommen.map(k => `"${(r[k] ?? '').toString().replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = bestandsnaam; a.click()
    URL.revokeObjectURL(url)
  }

  async function exporteerKlanten() {
    setExporterenKlanten(true)
    const { data } = await supabase.from('klanten').select('naam,bedrijfsnaam,btw_nummer,adres,email,telefoon,sector,aangemaakt_op').order('aangemaakt_op')
    if (data) downloadCsv('klanten.csv', data, ['naam','bedrijfsnaam','btw_nummer','adres','email','telefoon','sector','aangemaakt_op'])
    setExporterenKlanten(false)
  }

  async function exporteerProjecten() {
    setExporterenProjecten(true)
    const { data } = await supabase.from('projecten').select('naam,status,github_url,netlify_url,aangemaakt_op,klanten(naam)').order('aangemaakt_op')
    if (data) {
      const rijen = data.map(p => ({ ...p, klantnaam: p.klanten?.naam ?? '' }))
      downloadCsv('projecten.csv', rijen, ['naam','klantnaam','status','github_url','netlify_url','aangemaakt_op'])
    }
    setExporterenProjecten(false)
  }

  async function verwijderTestdata() {
    if (verwijderTekst !== 'VERWIJDER') return
    setVerwijderLaden(true)
    setVerwijderBericht('')
    const patroon = ['%(test)%', '%(demo)%']
    for (const p of patroon) {
      await supabase.from('handleidingen').delete().ilike('project_id', '%') // via projecten
      await supabase.from('offertes').delete().ilike('naam', p)
      await supabase.from('projecten').delete().ilike('naam', p)
      await supabase.from('klanten').delete().ilike('naam', p)
    }
    setVerwijderBericht('Testdata verwijderd.')
    setVerwijderTekst('')
    setVerwijderDialog(false)
    setVerwijderLaden(false)
  }

  async function uitloggen() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (laden) {
    return (
      <PageWrapper title="Instellingen" description="Persoonlijke configuratie van BYT Studio.">
        <div className="text-sm text-gray-400">Instellingen laden...</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Instellingen"
      description="Persoonlijke configuratie van BYT Studio — enkel zichtbaar voor jou als developer."
    >
      <div className="max-w-2xl space-y-5">

        {/* 1. Jouw gegevens */}
        <SectieKaart
          icon={Building2}
          titel="Jouw gegevens"
          subtitel="Deze gegevens verschijnen op offertes, facturen en handleidingen."
          onOpslaan={() => slaOp(['eigenaar_naam','bedrijfsnaam','btw_nummer','adres','email','telefoon','website','iban','bic','logo_url'], setLadenBedrijf, setBerichtBedrijf, 'Gegevens opgeslagen.')}
          laden={ladenBedrijf}
          bericht={berichtBedrijf}
          opslaanLabel="Gegevens opslaan"
        >
          {/* Twee kolommen */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Links */}
            <div className="space-y-4">
              <Veld label="Naam eigenaar">
                <input className={inputKlasse} value={inst.eigenaar_naam} onChange={stel('eigenaar_naam')} placeholder="Voornaam Achternaam" />
              </Veld>
              <Veld label="Bedrijfsnaam">
                <input className={inputKlasse} value={inst.bedrijfsnaam} onChange={stel('bedrijfsnaam')} placeholder="Build Your Tools" />
              </Veld>
              <Veld label="BTW-nummer">
                <input className={inputKlasse} value={inst.btw_nummer} onChange={stel('btw_nummer')} placeholder="BE 0XXX.XXX.XXX" />
              </Veld>
              <Veld label="Adres">
                <input className={inputKlasse} value={inst.adres} onChange={stel('adres')} placeholder="Straat 1, 9000 Gent" />
              </Veld>
            </div>
            {/* Rechts */}
            <div className="space-y-4">
              <Veld label="E-mail">
                <input className={inputKlasse} value={inst.email} onChange={stel('email')} placeholder="info@buildyourtools.be" />
              </Veld>
              <Veld label="Telefoon">
                <input className={inputKlasse} value={inst.telefoon} onChange={stel('telefoon')} placeholder="+32 4XX XX XX XX" />
              </Veld>
              <Veld label="Website">
                <input className={inputKlasse} value={inst.website} onChange={stel('website')} placeholder="https://buildyourtools.be" />
              </Veld>
            </div>
          </div>

          {/* Volledige breedte */}
          <div className="grid grid-cols-2 gap-4">
            <Veld label="IBAN">
              <input className={inputKlasse} value={inst.iban} onChange={stel('iban')} placeholder="BE68 XXXX XXXX XXXX" />
            </Veld>
            <Veld label="BIC">
              <input className={inputKlasse} value={inst.bic} onChange={stel('bic')} placeholder="GEBABEBB" />
            </Veld>
          </div>

          {/* Logo */}
          <Veld label="Logo URL">
            <input className={inputKlasse} value={inst.logo_url} onChange={stel('logo_url')} placeholder="https://... link naar je logo" />
          </Veld>
          {inst.logo_url && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <img
                src={inst.logo_url}
                alt="Logo voorvertoning"
                style={{ maxHeight: 80, maxWidth: 200, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <span className="text-xs text-gray-400">Voorvertoning</span>
            </div>
          )}
        </SectieKaart>

        {/* 2. Financiële standaarden */}
        <SectieKaart
          icon={CreditCard}
          titel="Financiële standaarden"
          subtitel="Standaardwaarden die automatisch worden ingeladen bij nieuwe offertes en facturen. Aanpasbaar per offerte."
          onOpslaan={() => slaOp(
            ['uurtarief','btw_percentage','marge_percentage','offerte_geldigheid','betalingstermijn',
             'offerte_voorwaarden','factuur_voorwaarden','nalatigheidsintrest','forfait_schadevergoeding','rechtbank'],
            setLadenFinancieel, setBerichtFinancieel, 'Financiële instellingen opgeslagen.'
          )}
          laden={ladenFinancieel}
          bericht={berichtFinancieel}
          opslaanLabel="Financiële instellingen opslaan"
        >
          {/* Rij 1: uurtarief / BTW / marge */}
          <div className="grid grid-cols-3 gap-4">
            <Veld label="Standaard uurtarief (€)">
              <input
                type="number"
                className={inputKlasse}
                value={inst.uurtarief}
                onChange={stellNum('uurtarief')}
                min={0} step={5}
              />
              <p className="text-xs text-gray-400 mt-1">Wordt ingeladen in nieuwe offertes</p>
            </Veld>
            <Veld label="Standaard BTW (%)">
              <input
                type="number"
                className={inputKlasse}
                value={inst.btw_percentage}
                onChange={stellNum('btw_percentage')}
                min={0} max={100} step={1}
              />
              <div className="flex gap-1 mt-1.5">
                {[0, 6, 12, 21].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setInst(prev => ({ ...prev, btw_percentage: v }))}
                    className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                      inst.btw_percentage === v
                        ? 'bg-[#78C833] text-white border-[#78C833]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#78C833] hover:text-[#78C833]'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </Veld>
            <Veld label={
              <span className="flex items-center gap-1">
                Standaard marge/buffer (%)
                <span
                  title="Wordt opgeteld bij de berekende prijs als buffer voor onvoorziene zaken"
                  className="w-3.5 h-3.5 rounded-full bg-gray-300 text-white text-[9px] flex items-center justify-center cursor-help font-bold"
                  style={{ lineHeight: 1 }}
                >i</span>
              </span>
            }>
              <input
                type="number"
                className={inputKlasse}
                value={inst.marge_percentage}
                onChange={stellNum('marge_percentage')}
                min={0} max={100} step={1}
              />
            </Veld>
          </div>

          {/* Rij 2: offerte geldigheid / betalingstermijn */}
          <div className="grid grid-cols-2 gap-4">
            <Veld label="Offerte geldigheid (dagen)">
              <input type="number" className={inputKlasse} value={inst.offerte_geldigheid} onChange={stellNum('offerte_geldigheid')} min={1} />
            </Veld>
            <Veld label="Betalingstermijn facturen (dagen)">
              <input type="number" className={inputKlasse} value={inst.betalingstermijn} onChange={stellNum('betalingstermijn')} min={1} />
            </Veld>
          </div>

          {/* Scheidingslijn betalingsvoorwaarden */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Betalingsvoorwaarden</p>

            <div className="space-y-4">
              <Veld label="Algemene voorwaarden offerte">
                <textarea
                  className={textareaKlasse}
                  rows={3}
                  value={inst.offerte_voorwaarden}
                  onChange={stel('offerte_voorwaarden')}
                />
              </Veld>
              <Veld label="Algemene voorwaarden factuur">
                <textarea
                  className={textareaKlasse}
                  rows={4}
                  value={inst.factuur_voorwaarden}
                  onChange={stel('factuur_voorwaarden')}
                />
              </Veld>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <Veld label="Nalatigheidsintrest (%)">
                <input type="number" className={inputKlasse} value={inst.nalatigheidsintrest} onChange={stellNum('nalatigheidsintrest')} min={0} step={0.5} />
              </Veld>
              <Veld label="Forfait schadevergoeding (€)">
                <input type="number" className={inputKlasse} value={inst.forfait_schadevergoeding} onChange={stellNum('forfait_schadevergoeding')} min={0} />
              </Veld>
              <Veld label="Bevoegde rechtbank">
                <input className={inputKlasse} value={inst.rechtbank} onChange={stel('rechtbank')} placeholder="arrondissement Gent" />
              </Veld>
            </div>

            <div className="mt-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
              Deze voorwaarden worden automatisch onderaan elke offerte en factuur gezet.
              De parameters worden ingevuld in de tekst.
            </div>
          </div>
        </SectieKaart>

        {/* 3. App-header instellingen */}
        <SectieKaart
          icon={Megaphone}
          titel="App-header"
          subtitel="Geanimeerde header bovenaan de app met BYT-logo."
          onOpslaan={() => slaOp(
            ['banner_zichtbaar','banner_titel','banner_subtitel'],
            setLadenBanner, setBerichtBanner, 'Header-instellingen opgeslagen.'
          )}
          laden={ladenBanner}
          bericht={berichtBanner}
          opslaanLabel="Header-instellingen opslaan"
        >
          {/* Toggle — auto-opslaan bij wijziging */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                const nieuw = !inst.banner_zichtbaar
                setInst(prev => ({ ...prev, banner_zichtbaar: nieuw }))
                if (instId) {
                  await supabase.from('instellingen')
                    .update({ banner_zichtbaar: nieuw, bijgewerkt_op: new Date().toISOString() })
                    .eq('id', instId)
                  herlaad()
                }
              }}
              style={{ width: 40, height: 22, flexShrink: 0 }}
              className={`relative rounded-full transition-colors ${inst.banner_zichtbaar ? 'bg-[#78C833]' : 'bg-gray-200'}`}
            >
              <span
                className="absolute top-0.5 left-0.5 bg-white rounded-full shadow"
                style={{
                  width: 18, height: 18,
                  transform: inst.banner_zichtbaar ? 'translateX(18px)' : 'translateX(0)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
            <span className="text-sm text-gray-600">Header tonen</span>
          </div>

          <Veld label="Koptekst">
            <input
              className={inputKlasse}
              value={inst.banner_titel}
              onChange={stel('banner_titel')}
              placeholder="BYT Studio"
            />
          </Veld>
          <Veld label="Ondertitel (optioneel)">
            <input
              className={inputKlasse}
              value={inst.banner_subtitel}
              onChange={stel('banner_subtitel')}
              placeholder="Interne tool"
            />
          </Veld>

          {/* Live preview */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Live preview</p>
            <div
              className="rounded-xl flex items-center justify-center gap-4 transition-opacity overflow-hidden"
              style={{ background: '#0a0a0a', height: 68, opacity: inst.banner_zichtbaar ? 1 : 0.35, border: '1px solid rgba(120,200,51,0.18)' }}
            >
              {/* Logo animatie preview */}
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: '#78C833' }}>{'<'}</span>
                <div className="flex gap-1.5">
                  {['#7ed957','#ff0000','#ff751f'].map((k,i) => (
                    <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: k }} />
                  ))}
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: '#78C833' }}>{'>'}</span>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
                  {inst.banner_titel || 'BYT Studio'}
                </p>
                {inst.banner_subtitel && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                    {inst.banner_subtitel}
                  </p>
                )}
              </div>
            </div>
            {!inst.banner_zichtbaar && (
              <p className="text-xs text-gray-400 mt-1.5 text-center">Header is uitgeschakeld</p>
            )}
          </div>
        </SectieKaart>

        {/* 4. App-beheer */}
        <SectieKaart
          icon={Settings}
          titel="App-beheer"
          subtitel="Technische instellingen en beheer van de BYT Studio applicatie."
          onOpslaan={() => slaOp(
            ['standaard_projectstatus','standaard_handleiding_versie','standaard_auteur_handleiding'],
            setLadenApp, setBerichtApp, 'App-instellingen opgeslagen.'
          )}
          laden={ladenApp}
          bericht={berichtApp}
          opslaanLabel="App-instellingen opslaan"
        >
          {/* — Subsectie 1: Account — */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Account</p>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Ingelogd als</p>
                <p className="text-sm font-medium text-gray-800">{authEmail || '—'}</p>
              </div>
              <button
                onClick={stuurResetLink}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:border-[#78C833] hover:text-[#78C833] transition-colors"
              >
                Wachtwoord wijzigen
              </button>
            </div>
            {resetVerzonden && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg mt-2">
                <CheckCircle size={13} />
                Reset-link verzonden naar {authEmail}
              </div>
            )}
          </div>

          {/* — Subsectie 2: Standaard projectinstellingen — */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Standaard projectinstellingen</p>
            <div className="grid grid-cols-3 gap-4">
              <Veld label="Standaard projectstatus bij aanmaken">
                <select
                  className={inputKlasse}
                  value={inst.standaard_projectstatus}
                  onChange={stel('standaard_projectstatus')}
                >
                  <option value="intake">intake</option>
                  <option value="offerte">offerte</option>
                  <option value="in_ontwikkeling">in_ontwikkeling</option>
                </select>
              </Veld>
              <Veld label="Standaard handleidingsversie">
                <select
                  className={inputKlasse}
                  value={inst.standaard_handleiding_versie}
                  onChange={stel('standaard_handleiding_versie')}
                >
                  <option value="v1.0">v1.0</option>
                  <option value="v1">v1</option>
                  <option value="">Geen versienummer</option>
                </select>
              </Veld>
              <Veld label="Standaard auteursnaam handleidingen">
                <input
                  className={inputKlasse}
                  value={inst.standaard_auteur_handleiding}
                  onChange={stel('standaard_auteur_handleiding')}
                  placeholder="Build Your Tools"
                />
              </Veld>
            </div>
          </div>

          {/* — Subsectie 3: Data en backup — */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Data en backup</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={exporteerKlanten}
                disabled={exporterenKlanten}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-[#78C833] hover:text-[#78C833] disabled:opacity-50 transition-colors"
              >
                <Download size={14} />
                {exporterenKlanten ? 'Exporteren...' : 'Exporteer alle klanten als CSV'}
              </button>
              <button
                onClick={exporteerProjecten}
                disabled={exporterenProjecten}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-[#78C833] hover:text-[#78C833] disabled:opacity-50 transition-colors"
              >
                <Download size={14} />
                {exporterenProjecten ? 'Exporteren...' : 'Exporteer alle projecten als CSV'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Supabase maakt automatisch dagelijkse backups van alle data (Pro plan).<br />
              Op het Free plan: exporteer regelmatig via de knoppen hierboven.
            </p>
          </div>

          {/* — Subsectie 4: Gevaarzone — */}
          <div className="border-t border-gray-100 pt-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Gevaarzone — niet omkeerbaar</p>

              {!verwijderDialog ? (
                <button
                  onClick={() => { setVerwijderDialog(true); setVerwijderBericht('') }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={14} />
                  Alle testdata verwijderen
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-700">
                    Dit verwijdert alle klanten, projecten, offertes en handleidingen die zijn aangemaakt voor testdoeleinden.
                    Typ <strong>VERWIJDER</strong> om te bevestigen.
                  </p>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-red-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    placeholder="Typ VERWIJDER"
                    value={verwijderTekst}
                    onChange={e => setVerwijderTekst(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={verwijderTestdata}
                      disabled={verwijderTekst !== 'VERWIJDER' || verwijderLaden}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-red-700 transition-colors"
                    >
                      {verwijderLaden ? 'Verwijderen...' : 'Bevestig verwijdering'}
                    </button>
                    <button
                      onClick={() => { setVerwijderDialog(false); setVerwijderTekst('') }}
                      className="px-4 py-2 rounded-lg border border-red-200 bg-white text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                  {verwijderBericht && (
                    <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">{verwijderBericht}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Uitloggen — losgekoppeld van opslaan-knop */}
          <div className="border-t border-gray-100 pt-4 flex justify-end">
            <button
              onClick={uitloggen}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <LogOut size={14} />
              Uitloggen
            </button>
          </div>
        </SectieKaart>

        {/* 5. Boilerplate Bibliotheek */}
        <SectieBoilerplates />

      </div>
    </PageWrapper>
  )
}
