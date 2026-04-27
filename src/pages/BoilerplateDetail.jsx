// src/pages/BoilerplateDetail.jsx — Boilerplate aanmaken / bewerken
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ChevronLeft, Save, Trash2, Plus, X, CheckCircle, AlertTriangle,
  Code2, Layers, Package, Wrench, Tag, ExternalLink,
} from 'lucide-react'

const BYT_GREEN = '#78C833'

const TYPES = [
  { value: 'component',    label: 'Component',    icon: Code2 },
  { value: 'configurator', label: 'Configurator', icon: Layers },
  { value: 'scaffold',     label: 'Scaffold',     icon: Package },
  { value: 'service',      label: 'Service',      icon: Wrench },
]

const LEEG = {
  naam: '',
  type: 'component',
  categorie: '',
  beschrijving: '',
  versie: '1.0',
  github_url: '',
  bestand_pad: '',
  afhankelijkheden_json: [],
  aanpassingsprompt_template: '',
  tags_json: [],
  actief: true,
}

const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

function Sectie({ titel, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-bold text-gray-700">{titel}</h2>
      {children}
    </div>
  )
}

export default function BoilerplateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNieuw = id === 'nieuw'

  const [form, setForm] = useState(LEEG)
  const [laden, setLaden] = useState(!isNieuw)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')
  const [ok, setOk] = useState('')
  const [verwijderBevestig, setVerwijderBevestig] = useState(false)
  const [nieuwTag, setNieuwTag] = useState('')
  const [nieuwAfh, setNieuwAfh] = useState('')

  useEffect(() => {
    document.title = isNieuw ? 'Nieuwe boilerplate — BYT Studio' : 'Boilerplate — BYT Studio'
    if (!isNieuw) laad()
  }, [id])

  async function laad() {
    setLaden(true)
    const { data, error } = await supabase.from('boilerplates').select('*').eq('id', id).single()
    if (error || !data) { setFout('Boilerplate niet gevonden.'); setLaden(false); return }
    setForm({
      ...LEEG,
      ...data,
      afhankelijkheden_json: data.afhankelijkheden_json ?? [],
      tags_json: data.tags_json ?? [],
    })
    document.title = `${data.naam} — BYT Studio`
    setLaden(false)
  }

  function stel(veld) {
    return e => setForm(f => ({ ...f, [veld]: e.target.value }))
  }

  function voegTagToe() {
    const tag = nieuwTag.trim().toLowerCase()
    if (!tag || form.tags_json.includes(tag)) return
    setForm(f => ({ ...f, tags_json: [...f.tags_json, tag] }))
    setNieuwTag('')
  }

  function verwijderTag(tag) {
    setForm(f => ({ ...f, tags_json: f.tags_json.filter(t => t !== tag) }))
  }

  function voegAfhToe() {
    const afh = nieuwAfh.trim()
    if (!afh || form.afhankelijkheden_json.includes(afh)) return
    setForm(f => ({ ...f, afhankelijkheden_json: [...f.afhankelijkheden_json, afh] }))
    setNieuwAfh('')
  }

  function verwijderAfh(afh) {
    setForm(f => ({ ...f, afhankelijkheden_json: f.afhankelijkheden_json.filter(a => a !== afh) }))
  }

  async function handleOpslaan(e) {
    e.preventDefault()
    if (!form.naam.trim()) { setFout('Naam is verplicht.'); return }
    setOpslaan(true); setFout(''); setOk('')

    const payload = {
      naam: form.naam.trim(),
      type: form.type || null,
      categorie: form.categorie.trim() || null,
      beschrijving: form.beschrijving.trim() || null,
      versie: form.versie.trim() || '1.0',
      github_url: form.github_url.trim() || null,
      bestand_pad: form.bestand_pad.trim() || null,
      afhankelijkheden_json: form.afhankelijkheden_json,
      aanpassingsprompt_template: form.aanpassingsprompt_template.trim() || null,
      tags_json: form.tags_json,
      actief: form.actief,
      bijgewerkt_op: new Date().toISOString(),
    }

    if (isNieuw) {
      const { data, error } = await supabase.from('boilerplates').insert(payload).select().single()
      if (error) { setFout('Opslaan mislukt: ' + error.message); setOpslaan(false); return }
      navigate(`/boilerplates/${data.id}`, { replace: true })
    } else {
      const { error } = await supabase.from('boilerplates').update(payload).eq('id', id)
      if (error) { setFout('Opslaan mislukt: ' + error.message); setOpslaan(false); return }
      setOk('Opgeslagen.')
      setTimeout(() => setOk(''), 3000)
    }
    setOpslaan(false)
  }

  async function handleVerwijder() {
    const { error } = await supabase.from('boilerplates').delete().eq('id', id)
    if (error) { setFout('Verwijderen mislukt: ' + error.message); return }
    navigate('/boilerplates')
  }

  if (laden) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: BYT_GREEN, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* Terug + header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/boilerplates"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">
            {isNieuw ? 'Nieuwe boilerplate' : form.naam || 'Boilerplate bewerken'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isNieuw ? 'Voeg een nieuwe boilerplate toe aan de bibliotheek' : 'Bekijk en bewerk alle details'}
          </p>
        </div>
        {/* Actief toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{form.actief ? 'Actief' : 'Inactief'}</span>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, actief: !f.actief }))}
            style={{ width: 40, height: 22, flexShrink: 0 }}
            className={`relative rounded-full transition-colors ${form.actief ? 'bg-[#78C833]' : 'bg-gray-200'}`}
          >
            <span className="absolute top-0.5 left-0.5 bg-white rounded-full shadow"
              style={{ width: 18, height: 18, transform: form.actief ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.15s' }} />
          </button>
        </div>
      </div>

      <form onSubmit={handleOpslaan} className="space-y-5">

        {/* Basis */}
        <Sectie titel="Basisgegevens">
          <div>
            <label className={lbl}>Naam *</label>
            <input className={inp} style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
              value={form.naam} onChange={stel('naam')} placeholder="Adres & Contact Module" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Type</label>
              <select className={inp} style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
                value={form.type ?? ''} onChange={stel('type')}>
                <option value="">— Geen type —</option>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Versie</label>
              <input className={inp} style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
                value={form.versie} onChange={stel('versie')} placeholder="1.0" />
            </div>
          </div>
          <div>
            <label className={lbl}>Categorie</label>
            <input className={inp} style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
              value={form.categorie} onChange={stel('categorie')} placeholder="Formulieren, Intake, Auth…" />
          </div>
          <div>
            <label className={lbl}>Beschrijving</label>
            <textarea className={inp} style={{ '--tw-ring-color': `${BYT_GREEN}30`, resize: 'vertical' }}
              rows={3} value={form.beschrijving} onChange={stel('beschrijving')}
              placeholder="Korte omschrijving van wat deze boilerplate doet…" />
          </div>
        </Sectie>

        {/* Links */}
        <Sectie titel="Links & locatie">
          <div>
            <label className={lbl}>GitHub URL</label>
            <div className="flex items-center gap-2">
              <input className={inp} style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
                value={form.github_url} onChange={stel('github_url')}
                placeholder="https://github.com/…" />
              {form.github_url && (
                <a href={form.github_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 flex-shrink-0">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
          <div>
            <label className={lbl}>Bestandspad</label>
            <input className={`${inp} font-mono text-xs`} style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
              value={form.bestand_pad} onChange={stel('bestand_pad')}
              placeholder="src/components/address-contact/AddressContactForm.tsx" />
          </div>
        </Sectie>

        {/* Tags */}
        <Sectie titel="Tags">
          <div className="flex flex-wrap gap-2">
            {form.tags_json.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                <Tag size={10} />
                {tag}
                <button type="button" onClick={() => verwijderTag(tag)}
                  className="ml-0.5 hover:text-red-500 transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={`${inp} flex-1`} style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
              value={nieuwTag} onChange={e => setNieuwTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), voegTagToe())}
              placeholder="Tag toevoegen (Enter)" />
            <button type="button" onClick={voegTagToe}
              className="px-3 py-2 rounded-lg text-white text-sm font-medium flex-shrink-0"
              style={{ background: BYT_GREEN }}>
              <Plus size={14} />
            </button>
          </div>
        </Sectie>

        {/* Afhankelijkheden */}
        <Sectie titel="Afhankelijkheden">
          <div className="flex flex-wrap gap-2">
            {form.afhankelijkheden_json.map(afh => (
              <span key={afh} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-mono">
                {afh}
                <button type="button" onClick={() => verwijderAfh(afh)}
                  className="ml-0.5 hover:text-red-500 transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
            {form.afhankelijkheden_json.length === 0 && (
              <span className="text-xs text-gray-400">Nog geen afhankelijkheden</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              className={`${inp} flex-1 font-mono text-xs`} style={{ '--tw-ring-color': `${BYT_GREEN}30` }}
              value={nieuwAfh} onChange={e => setNieuwAfh(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), voegAfhToe())}
              placeholder="next, typescript, libphonenumber-js… (Enter)" />
            <button type="button" onClick={voegAfhToe}
              className="px-3 py-2 rounded-lg text-white text-sm font-medium flex-shrink-0"
              style={{ background: BYT_GREEN }}>
              <Plus size={14} />
            </button>
          </div>
        </Sectie>

        {/* Aanpassingsprompt */}
        <Sectie titel="Aanpassingsprompt template">
          <p className="text-xs text-gray-400">
            Gebruik <code className="bg-gray-100 px-1 rounded">[KLANT_NAAM]</code> en <code className="bg-gray-100 px-1 rounded">[AANPASSINGEN]</code> als placeholders. Deze worden ingevuld bij project-koppeling.
          </p>
          <textarea
            className={`${inp} font-mono text-xs`}
            style={{ '--tw-ring-color': `${BYT_GREEN}30`, resize: 'vertical' }}
            rows={10}
            value={form.aanpassingsprompt_template}
            onChange={stel('aanpassingsprompt_template')}
            placeholder={'Het bestand src/components/... bestaat al als boilerplate.\n\nPas het aan voor klant "[KLANT_NAAM]":\n[AANPASSINGEN]\n\nRaak geen andere code aan.'}
          />
        </Sectie>

        {/* Meldingen */}
        {fout && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertTriangle size={15} /> {fout}
          </div>
        )}
        {ok && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
            <CheckCircle size={15} /> {ok}
          </div>
        )}

        {/* Acties */}
        <div className="flex items-center justify-between pt-1 pb-6">
          {!isNieuw ? (
            verwijderBevestig ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Zeker verwijderen?</span>
                <button type="button" onClick={handleVerwijder}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium">
                  Ja, verwijderen
                </button>
                <button type="button" onClick={() => setVerwijderBevestig(false)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium">
                  Annuleren
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setVerwijderBevestig(true)}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors">
                <Trash2 size={13} /> Verwijderen
              </button>
            )
          ) : <div />}

          <button
            type="submit"
            disabled={opslaan}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: BYT_GREEN }}
          >
            <Save size={15} />
            {opslaan ? 'Bezig…' : isNieuw ? 'Aanmaken' : 'Opslaan'}
          </button>
        </div>

      </form>
    </div>
  )
}
