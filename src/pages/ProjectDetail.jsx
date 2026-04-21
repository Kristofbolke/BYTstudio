// ProjectDetail.jsx — Detailpagina van één project met 6 tabs
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { genereerGebruiker, genereerTechnisch, moduleNamenVanProject } from '../lib/handleidingGenerators'
import { supabase } from '../lib/supabase'
import { statusCfg, StatusBadge, STATUSSEN } from './Projecten'
import {
  ChevronLeft, ExternalLink, Trash2, Save, Plus, X,
  CheckCircle, AlertTriangle, FileText, Palette, BookOpen,
  Bug, Info, FolderKanban, ChevronDown, Zap, Edit3, FileDown, Clock, Lightbulb,
  Receipt,
} from 'lucide-react'
import AICheck from '../components/AICheck'

// ── Hulpfuncties ─────────────────────────────────────────────────────────────
function formatDatum(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
    </div>
  )
}

function FoutMelding({ tekst }) {
  return tekst ? (
    <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2">{tekst}</p>
  ) : null
}

function OpslaanBericht({ tekst }) {
  return tekst ? (
    <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg mt-2 flex items-center gap-1.5">
      <CheckCircle size={12} /> {tekst}
    </p>
  ) : null
}

const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

// ── Tab 1: Overzicht ──────────────────────────────────────────────────────────
function TabOverzicht({ project, klanten, onBijgewerkt }) {
  const [form, setForm] = useState({
    naam: project.naam ?? '',
    beschrijving: project.beschrijving ?? '',
    status: project.status ?? 'intake',
    github_url: project.github_url ?? '',
    netlify_url: project.netlify_url ?? '',
    klant_id: project.klant_id ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const [ok, setOk] = useState('')

  function stelIn(v, w) { setForm(f => ({ ...f, [v]: w })) }

  async function opslaan(e) {
    e.preventDefault()
    if (!form.naam.trim()) { setFout('Naam is verplicht.'); return }
    setLoading(true); setFout(''); setOk('')
    const { error } = await supabase.from('projecten').update({
      naam: form.naam,
      beschrijving: form.beschrijving || null,
      status: form.status,
      github_url: form.github_url || null,
      netlify_url: form.netlify_url || null,
      klant_id: form.klant_id || null,
    }).eq('id', project.id)
    setLoading(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    setOk('Wijzigingen opgeslagen.')
    onBijgewerkt()
    setTimeout(() => setOk(''), 3000)
  }

  return (
    <form onSubmit={opslaan} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={lbl}>Projectnaam <span className="text-red-400">*</span></label>
          <input value={form.naam} onChange={e => stelIn('naam', e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Klant</label>
          <div className="relative">
            <select value={form.klant_id} onChange={e => stelIn('klant_id', e.target.value)} className={inp + ' appearance-none pr-8'}>
              <option value="">— Geen klant —</option>
              {klanten.map(k => (
                <option key={k.id} value={k.id}>{k.naam}{k.bedrijfsnaam ? ` (${k.bedrijfsnaam})` : ''}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>Status</label>
          <div className="relative">
            <select value={form.status} onChange={e => stelIn('status', e.target.value)} className={inp + ' appearance-none pr-8'}>
              {STATUSSEN.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Beschrijving</label>
          <textarea value={form.beschrijving} onChange={e => stelIn('beschrijving', e.target.value)}
            rows={4} className={inp + ' resize-none'} placeholder="Omschrijving van het project..." />
        </div>
        <div>
          <label className={lbl}>GitHub URL</label>
          <input value={form.github_url} onChange={e => stelIn('github_url', e.target.value)}
            placeholder="https://github.com/..." className={inp} />
        </div>
        <div>
          <label className={lbl}>Netlify URL</label>
          <input value={form.netlify_url} onChange={e => stelIn('netlify_url', e.target.value)}
            placeholder="https://....netlify.app" className={inp} />
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">
        <div className="flex gap-3"><span className="text-gray-400 w-28">Aangemaakt op</span><span>{formatDatum(project.aangemaakt_op)}</span></div>
        <div className="flex gap-3"><span className="text-gray-400 w-28">Laatste wijziging</span><span>{formatDatum(project.bijgewerkt_op)}</span></div>
      </div>

      <FoutMelding tekst={fout} />
      <OpslaanBericht tekst={ok} />

      <button type="submit" disabled={loading}
        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: '#185FA5' }}>
        <Save size={14} /> {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
      </button>
    </form>
  )
}

// ── Tab 2: Huisstijl ─────────────────────────────────────────────────────────
const FONT_OPTIES = [
  'Poppins','Inter','Montserrat','Raleway','Oswald','Lato',
  'Open Sans','Roboto','Nunito','Playfair Display','Roboto Slab',
  'Eigen lettertype invoeren',
]
const FONT_GEWICHTEN = [
  { val: '400', label: '400 — Normaal' },
  { val: '500', label: '500 — Medium' },
  { val: '600', label: '600 — Semi-bold' },
  { val: '700', label: '700 — Bold' },
  { val: '800', label: '800 — Extra bold' },
]
const FONT_GROOTTES = ['13px','14px','15px','16px']
const SECTOREN = [
  'Horeca','Retail','Bouw & vastgoed','Zorg & welzijn','IT & software',
  'Marketing & communicatie','Onderwijs','Logistiek','Financiën',
  'Evenementen','Overheid','Sport & recreatie','Overige',
]

// ── Kleurconversies ──────────────────────────────────────────────────────────
function hexNaarRgb(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function rgbNaarCmyk(r, g, b) {
  let rp = r / 255, gp = g / 255, bp = b / 255
  const k = 1 - Math.max(rp, gp, bp)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round((1 - rp - k) / (1 - k) * 100),
    m: Math.round((1 - gp - k) / (1 - k) * 100),
    y: Math.round((1 - bp - k) / (1 - k) * 100),
    k: Math.round(k * 100),
  }
}

function cmykNaarRgb(c, m, y, k) {
  const r = Math.round(255 * (1 - c / 100) * (1 - k / 100))
  const g = Math.round(255 * (1 - m / 100) * (1 - k / 100))
  const b = Math.round(255 * (1 - y / 100) * (1 - k / 100))
  return { r, g, b }
}

function rgbNaarHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('')
}

// ── KleurBlok component ──────────────────────────────────────────────────────
function KleurBlok({ label, waarde, onChange }) {
  const [hexInput, setHexInput] = useState(waarde || '#000000')

  useEffect(() => { setHexInput(waarde || '#000000') }, [waarde])

  const rgb  = hexNaarRgb(waarde)
  const cmyk = rgb ? rgbNaarCmyk(rgb.r, rgb.g, rgb.b) : null

  function handleHexInput(val) {
    setHexInput(val)
    const schoon = val.startsWith('#') ? val : '#' + val
    if (/^#[0-9a-fA-F]{6}$/.test(schoon)) onChange(schoon)
  }

  function handlePicker(val) {
    setHexInput(val)
    onChange(val)
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 flex-1 min-w-0">
      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</p>

      {/* Kleurvlak (colorpicker) */}
      <input
        type="color"
        value={waarde || '#000000'}
        onChange={e => handlePicker(e.target.value)}
        className="w-full cursor-pointer rounded-lg border border-gray-200"
        style={{ height: 56, padding: 2 }}
      />

      {/* HEX invoer */}
      <div>
        <label className={lbl}>HEX</label>
        <input
          value={hexInput}
          onChange={e => handleHexInput(e.target.value)}
          maxLength={7}
          placeholder="#000000"
          className={inp + ' font-mono uppercase text-sm'}
          style={{ borderColor: /^#[0-9a-fA-F]{6}$/.test(hexInput) ? undefined : '#f87171' }}
        />
      </div>

      {/* RGB read-only */}
      {rgb && (
        <div>
          <label className={lbl}>RGB</label>
          <div className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-mono text-gray-500 select-all">
            {rgb.r}, {rgb.g}, {rgb.b}
          </div>
        </div>
      )}

      {/* CMYK read-only */}
      {cmyk && (
        <div>
          <label className={lbl}>CMYK</label>
          <div className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-mono text-gray-500 select-all">
            {cmyk.c}% &nbsp;{cmyk.m}% &nbsp;{cmyk.y}% &nbsp;{cmyk.k}%
          </div>
        </div>
      )}
    </div>
  )
}

// ── CMYK converter ──────────────────────────────────────────────────────────
function CmykConverter({ onVoegToe }) {
  const [cmyk, setCmyk] = useState({ c: 0, m: 0, y: 0, k: 0 })
  const [resultaat, setResultaat] = useState(null)

  function bereken() {
    const rgb = cmykNaarRgb(cmyk.c, cmyk.m, cmyk.y, cmyk.k)
    setResultaat({ hex: rgbNaarHex(rgb.r, rgb.g, rgb.b), rgb })
  }

  const numInp = 'w-full px-2 py-2 rounded-lg border border-gray-200 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-400/30 bg-white'

  return (
    <div className="mt-5 bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">CMYK → HEX converter</p>
      <div className="grid grid-cols-4 gap-2">
        {['c','m','y','k'].map(ch => (
          <div key={ch}>
            <label className="block text-xs font-bold text-center text-gray-400 mb-1 uppercase">{ch}</label>
            <input
              type="number" min="0" max="100"
              value={cmyk[ch]}
              onChange={e => setCmyk(v => ({ ...v, [ch]: Number(e.target.value) }))}
              className={numInp}
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={bereken}
        className="w-full py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: '#185FA5' }}>
        Bereken HEX
      </button>
      {resultaat && (
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
            style={{ background: resultaat.hex }} />
          <div className="flex-1">
            <p className="text-sm font-mono font-bold text-gray-800">{resultaat.hex.toUpperCase()}</p>
            <p className="text-xs text-gray-400 font-mono">
              RGB: {resultaat.rgb.r}, {resultaat.rgb.g}, {resultaat.rgb.b}
            </p>
          </div>
          <button type="button"
            onClick={() => onVoegToe(resultaat.hex)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
            Toevoegen als accentkleur
          </button>
        </div>
      )}
    </div>
  )
}

// ── Google Fonts link generator ──────────────────────────────────────────────
function googleFontsLink(fontTitel, fontTekst, gewichtTitel, grootsteTekst) {
  const gewichten = [...new Set(['400', gewichtTitel].filter(Boolean))].sort().join(';')
  const gewichtenTekst = '400;500'
  const fonts = []
  if (fontTitel && fontTitel !== 'Eigen lettertype invoeren')
    fonts.push(`family=${fontTitel.replace(/ /g, '+')}:wght@${gewichten}`)
  if (fontTekst && fontTekst !== 'Eigen lettertype invoeren' && fontTekst !== fontTitel)
    fonts.push(`family=${fontTekst.replace(/ /g, '+')}:wght@${gewichtenTekst}`)
  if (!fonts.length) return ''
  return `<link href="https://fonts.googleapis.com/css2?${fonts.join('&')}&display=swap" rel="stylesheet">`
}

// ── TabHuisstijl (volledig) ───────────────────────────────────────────────────
function TabHuisstijl({ projectId }) {
  const leeg = {
    primaire_kleur:   '#185FA5',
    secundaire_kleur: '#78C833',
    accent_kleur:     '#f8fafc',
    font_titel:       'Poppins',
    font_titel_eigen: '',
    font_gewicht:     '700',
    font_tekst:       'Inter',
    font_tekst_eigen: '',
    font_grootte:     '15px',
    logo_url:         '',
    bedrijfsslogan:   '',
    sector:           '',
    stijlomschrijving:'',
    adres:            '',
    btw:              '',
    iban:             '',
    email:            '',
    telefoon:         '',
    website:          '',
  }

  const [form, setForm]           = useState(leeg)
  const [bestaandId, setBestaandId] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [opslaan, setOpslaan]     = useState(false)
  const [fout, setFout]           = useState('')
  const [ok, setOk]               = useState('')
  const [gekopieerd, setGekopieerd] = useState(false)

  // ── Data laden ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('huisstijlen').select('*').eq('project_id', projectId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const extra = data.extra_json ?? {}
          setForm({
            ...leeg,
            primaire_kleur:    data.primaire_kleur   ?? leeg.primaire_kleur,
            secundaire_kleur:  data.secundaire_kleur ?? leeg.secundaire_kleur,
            accent_kleur:      data.accent_kleur     ?? leeg.accent_kleur,
            font_titel:        data.font_titel       ?? leeg.font_titel,
            font_tekst:        data.font_tekst       ?? leeg.font_tekst,
            logo_url:          data.logo_url         ?? '',
            bedrijfsslogan:    data.bedrijfsslogan   ?? '',
            adres:             data.adres            ?? '',
            btw:               data.btw              ?? '',
            iban:              data.iban             ?? '',
            email:             data.email            ?? '',
            website:           data.website          ?? '',
            font_gewicht:      extra.font_gewicht    ?? leeg.font_gewicht,
            font_titel_eigen:  extra.font_titel_eigen  ?? '',
            font_tekst_eigen:  extra.font_tekst_eigen  ?? '',
            font_grootte:      extra.font_grootte    ?? leeg.font_grootte,
            sector:            extra.sector          ?? '',
            stijlomschrijving: extra.stijlomschrijving ?? '',
            telefoon:          extra.telefoon        ?? '',
          })
          setBestaandId(data.id)
        }
        setLoading(false)
      })
  }, [projectId])

  const [briefing, setBriefing]   = useState('')
  const [cssBlok, setCssBlok]     = useState('')
  const [briefingKop, setBriefingKop] = useState(false)
  const [cssKop, setCssKop]           = useState(false)

  // Sjablonen
  const [sjabloonOpslaanOpen, setSjabloonOpslaanOpen] = useState(false)
  const [sjabloonNaam,        setSjabloonNaam]        = useState('')
  const [sjabloonOpslaan,     setSjabloonOpslaan]     = useState(false)
  const [sjablonenOpen,       setSjablonenOpen]       = useState(false)
  const [sjablonen,           setSjablonen]           = useState([])
  const [sjablonenLaden,      setSjablonenLaden]      = useState(false)
  const [bevestigLaad,        setBevestigLaad]        = useState(null)   // sjabloon-object
  const [verwijderBevestig,   setVerwijderBevestig]   = useState(null)   // id
  const [hernoem,             setHernoem]             = useState(null)   // { id, naam }

  function stelIn(v, w) { setForm(f => ({ ...f, [v]: w })) }

  const effectiefFontTitel = form.font_titel === 'Eigen lettertype invoeren'
    ? (form.font_titel_eigen || 'sans-serif')
    : form.font_titel
  const effectiefFontTekst = form.font_tekst === 'Eigen lettertype invoeren'
    ? (form.font_tekst_eigen || 'sans-serif')
    : form.font_tekst

  const fontsLink = googleFontsLink(
    form.font_titel === 'Eigen lettertype invoeren' ? null : form.font_titel,
    form.font_tekst === 'Eigen lettertype invoeren' ? null : form.font_tekst,
    form.font_gewicht,
    form.font_grootte,
  )

  // ── Opslaan ───────────────────────────────────────────────────────────────
  async function bewaar(e) {
    e.preventDefault()
    setOpslaan(true); setFout(''); setOk('')
    const payload = {
      project_id:       projectId,
      primaire_kleur:   form.primaire_kleur,
      secundaire_kleur: form.secundaire_kleur,
      accent_kleur:     form.accent_kleur,
      font_titel:       effectiefFontTitel,
      font_tekst:       effectiefFontTekst,
      logo_url:         form.logo_url   || null,
      bedrijfsslogan:   form.bedrijfsslogan || null,
      adres:            form.adres      || null,
      btw:              form.btw        || null,
      iban:             form.iban       || null,
      email:            form.email      || null,
      website:          form.website    || null,
      extra_json: {
        font_gewicht:       form.font_gewicht,
        font_grootte:       form.font_grootte,
        font_titel_eigen:   form.font_titel_eigen,
        font_tekst_eigen:   form.font_tekst_eigen,
        sector:             form.sector,
        stijlomschrijving:  form.stijlomschrijving,
        telefoon:           form.telefoon,
      },
    }
    let error
    if (bestaandId) {
      ;({ error } = await supabase.from('huisstijlen').update(payload).eq('id', bestaandId))
    } else {
      const res = await supabase.from('huisstijlen').insert(payload).select('id').single()
      error = res.error
      if (res.data) setBestaandId(res.data.id)
    }
    setOpslaan(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    setOk('Huisstijl opgeslagen.')
    setTimeout(() => setOk(''), 3000)
  }

  async function kopieerFontsLink() {
    if (!fontsLink) return
    await navigator.clipboard.writeText(fontsLink)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2000)
  }

  // ── Sjabloon-functies ─────────────────────────────────────────────────────
  async function laadSjablonen() {
    setSjablonenLaden(true)
    const { data } = await supabase
      .from('huisstijl_sjablonen')
      .select('*')
      .order('aangemaakt_op', { ascending: false })
    setSjablonen(data ?? [])
    setSjablonenLaden(false)
  }

  async function slaOpAlsSjabloon() {
    if (!sjabloonNaam.trim()) return
    setSjabloonOpslaan(true)
    await supabase.from('huisstijl_sjablonen').insert({
      naam: sjabloonNaam.trim(),
      huisstijl_json: {
        primaire_kleur:    form.primaire_kleur,
        secundaire_kleur:  form.secundaire_kleur,
        accent_kleur:      form.accent_kleur,
        font_titel:        form.font_titel,
        font_titel_eigen:  form.font_titel_eigen,
        font_gewicht:      form.font_gewicht,
        font_tekst:        form.font_tekst,
        font_tekst_eigen:  form.font_tekst_eigen,
        font_grootte:      form.font_grootte,
        sector:            form.sector,
        stijlomschrijving: form.stijlomschrijving,
      },
    })
    setSjabloonOpslaan(false)
    setSjabloonOpslaanOpen(false)
    setSjabloonNaam('')
    setOk('Sjabloon opgeslagen.')
    setTimeout(() => setOk(''), 3000)
  }

  function bevestigLaadSjabloon(sj) {
    const j = sj.huisstijl_json ?? {}
    setForm(f => ({
      ...f,
      primaire_kleur:    j.primaire_kleur    ?? f.primaire_kleur,
      secundaire_kleur:  j.secundaire_kleur  ?? f.secundaire_kleur,
      accent_kleur:      j.accent_kleur      ?? f.accent_kleur,
      font_titel:        j.font_titel        ?? f.font_titel,
      font_titel_eigen:  j.font_titel_eigen  ?? '',
      font_gewicht:      j.font_gewicht      ?? f.font_gewicht,
      font_tekst:        j.font_tekst        ?? f.font_tekst,
      font_tekst_eigen:  j.font_tekst_eigen  ?? '',
      font_grootte:      j.font_grootte      ?? f.font_grootte,
      sector:            j.sector            ?? f.sector,
      stijlomschrijving: j.stijlomschrijving ?? f.stijlomschrijving,
    }))
    setBevestigLaad(null)
    setSjablonenOpen(false)
    setOk(`Sjabloon "${sj.naam}" ingeladen.`)
    setTimeout(() => setOk(''), 3000)
  }

  async function verwijderSjabloon(id) {
    await supabase.from('huisstijl_sjablonen').delete().eq('id', id)
    setSjablonen(s => s.filter(x => x.id !== id))
    setVerwijderBevestig(null)
  }

  async function hernoemSjabloon() {
    if (!hernoem?.naam.trim()) return
    await supabase.from('huisstijl_sjablonen').update({ naam: hernoem.naam.trim() }).eq('id', hernoem.id)
    setSjablonen(s => s.map(x => x.id === hernoem.id ? { ...x, naam: hernoem.naam.trim() } : x))
    setHernoem(null)
  }

  if (loading) return <Spinner />

  return (
    <form onSubmit={bewaar} className="space-y-8 max-w-3xl">

      {/* ── SECTIE 1 — Kleuren ─────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Kleuren</p>
        <div className="flex gap-4">
          <KleurBlok
            label="Primaire kleur"
            waarde={form.primaire_kleur}
            onChange={w => stelIn('primaire_kleur', w)}
          />
          <KleurBlok
            label="Secundaire kleur"
            waarde={form.secundaire_kleur}
            onChange={w => stelIn('secundaire_kleur', w)}
          />
          <KleurBlok
            label="Accentkleur"
            waarde={form.accent_kleur}
            onChange={w => stelIn('accent_kleur', w)}
          />
        </div>

        {/* CMYK converter */}
        <CmykConverter onVoegToe={hex => stelIn('accent_kleur', hex)} />
      </section>

      {/* ── SECTIE 2 — Typografie ──────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Typografie</p>

        <div className="grid grid-cols-2 gap-4">
          {/* Titelfont */}
          <div className="space-y-2">
            <label className={lbl}>Titelfont</label>
            <div className="relative">
              <select value={form.font_titel} onChange={e => stelIn('font_titel', e.target.value)}
                className={inp + ' appearance-none pr-8'}>
                {FONT_OPTIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            {form.font_titel === 'Eigen lettertype invoeren' && (
              <input value={form.font_titel_eigen}
                onChange={e => stelIn('font_titel_eigen', e.target.value)}
                placeholder="Exact de naam zoals op Google Fonts"
                className={inp} />
            )}
          </div>

          {/* Gewicht titels */}
          <div>
            <label className={lbl}>Gewicht titels</label>
            <div className="relative">
              <select value={form.font_gewicht} onChange={e => stelIn('font_gewicht', e.target.value)}
                className={inp + ' appearance-none pr-8'}>
                {FONT_GEWICHTEN.map(g => <option key={g.val} value={g.val}>{g.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Broodtekstfont */}
          <div className="space-y-2">
            <label className={lbl}>Broodtekstfont</label>
            <div className="relative">
              <select value={form.font_tekst} onChange={e => stelIn('font_tekst', e.target.value)}
                className={inp + ' appearance-none pr-8'}>
                {FONT_OPTIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
            {form.font_tekst === 'Eigen lettertype invoeren' && (
              <input value={form.font_tekst_eigen}
                onChange={e => stelIn('font_tekst_eigen', e.target.value)}
                placeholder="Exact de naam zoals op Google Fonts"
                className={inp} />
            )}
          </div>

          {/* Lettergrootte tekst */}
          <div>
            <label className={lbl}>Lettergrootte tekst</label>
            <div className="relative">
              <select value={form.font_grootte} onChange={e => stelIn('font_grootte', e.target.value)}
                className={inp + ' appearance-none pr-8'}>
                {FONT_GROOTTES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Live font previews */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Titelfont preview</p>
            <p style={{
              fontFamily: `'${effectiefFontTitel}', sans-serif`,
              fontWeight: form.font_gewicht,
              fontSize: '1.1rem',
              color: '#1e293b',
            }}>
              Bedrijfsnaam &amp; Titels
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Broodtekst preview</p>
            <p style={{
              fontFamily: `'${effectiefFontTekst}', sans-serif`,
              fontWeight: 400,
              fontSize: form.font_grootte,
              color: '#475569',
              lineHeight: 1.6,
            }}>
              Dit is hoe de broodtekst eruitziet in jouw app.
            </p>
          </div>
        </div>

        {/* Google Fonts importregel */}
        {fontsLink && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <label className={lbl}>Google Fonts &lt;link&gt; tag</label>
              <button type="button" onClick={kopieerFontsLink}
                className="text-xs text-blue-500 hover:text-blue-700 transition font-semibold">
                {gekopieerd ? '✓ Gekopieerd' : 'Kopieer'}
              </button>
            </div>
            <pre className="text-xs font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {fontsLink}
            </pre>
          </div>
        )}
      </section>

      {/* ── SECTIE 3 — Logo & Identiteit ──────────────────────────────────── */}
      <section>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Logo &amp; Identiteit</p>
        <div className="space-y-3">

          {/* Logo URL + preview */}
          <div>
            <label className={lbl}>Logo URL</label>
            <div className="flex gap-3 items-start">
              <input value={form.logo_url} onChange={e => stelIn('logo_url', e.target.value)}
                placeholder="https://..." className={inp} />
              {form.logo_url && (
                <img
                  src={form.logo_url} alt="Logo preview"
                  className="h-10 w-20 object-contain rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0"
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}
            </div>
          </div>

          <div>
            <label className={lbl}>Bedrijfsslogan</label>
            <input value={form.bedrijfsslogan} onChange={e => stelIn('bedrijfsslogan', e.target.value)}
              placeholder="Slimme apps voor slimme bedrijven" className={inp} />
          </div>

          <div>
            <label className={lbl}>Sector</label>
            <div className="relative">
              <select value={form.sector} onChange={e => stelIn('sector', e.target.value)}
                className={inp + ' appearance-none pr-8'}>
                <option value="">— Kies een sector —</option>
                {SECTOREN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={lbl}>Stijlomschrijving</label>
            <textarea value={form.stijlomschrijving} onChange={e => stelIn('stijlomschrijving', e.target.value)}
              rows={3}
              placeholder="Bv. Professioneel maar toegankelijk, warm kleurenpalet, modern zonder te technisch"
              className={inp + ' resize-none'} />
          </div>
        </div>
      </section>

      {/* ── SECTIE 4 — Contactgegevens ────────────────────────────────────── */}
      <section>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contactgegevens</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {/* Links */}
          <div className="space-y-3">
            <div>
              <label className={lbl}>Adres</label>
              <input value={form.adres} onChange={e => stelIn('adres', e.target.value)}
                placeholder="Straat 1, 9000 Gent" className={inp} />
            </div>
            <div>
              <label className={lbl}>BTW-nummer</label>
              <input value={form.btw} onChange={e => stelIn('btw', e.target.value)}
                placeholder="BE0000000000" className={inp} />
            </div>
            <div>
              <label className={lbl}>E-mail</label>
              <input type="email" value={form.email} onChange={e => stelIn('email', e.target.value)}
                placeholder="info@bedrijf.be" className={inp} />
            </div>
          </div>
          {/* Rechts */}
          <div className="space-y-3">
            <div>
              <label className={lbl}>IBAN</label>
              <input value={form.iban} onChange={e => stelIn('iban', e.target.value)}
                placeholder="BE00 0000 0000 0000" className={inp} />
            </div>
            <div>
              <label className={lbl}>Telefoon</label>
              <input value={form.telefoon} onChange={e => stelIn('telefoon', e.target.value)}
                placeholder="+32 9 000 00 00" className={inp} />
            </div>
            <div>
              <label className={lbl}>Website</label>
              <input value={form.website} onChange={e => stelIn('website', e.target.value)}
                placeholder="https://bedrijf.be" className={inp} />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTIE 5 — Live preview banner ────────────────────────────────── */}
      <section>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Live preview</p>
        <div
          className="rounded-2xl flex items-center justify-between px-8 overflow-hidden"
          style={{ background: form.primaire_kleur || '#185FA5', height: 80 }}
        >
          <p
            style={{
              fontFamily:  `'${effectiefFontTitel}', sans-serif`,
              fontWeight:  form.font_gewicht,
              fontSize:    '1.25rem',
              color:       '#fff',
              lineHeight:  1.2,
            }}
          >
            {form.bedrijfsslogan || 'Jouw slogan hier'}
          </p>
          {form.website && (
            <p
              style={{
                fontFamily: `'${effectiefFontTekst}', sans-serif`,
                fontSize:   form.font_grootte,
                color:      'rgba(255,255,255,0.7)',
              }}
            >
              {form.website}
            </p>
          )}
        </div>

        {/* Kleurenpalet onder banner */}
        <div className="flex items-center gap-3 mt-3">
          {[
            { kleur: form.primaire_kleur,   naam: 'Primair' },
            { kleur: form.secundaire_kleur, naam: 'Secundair' },
            { kleur: form.accent_kleur,     naam: 'Accent' },
          ].map(({ kleur, naam }) => (
            <div key={naam} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border border-gray-200 shadow-sm" style={{ background: kleur }} />
              <span className="text-xs text-gray-400">{naam}</span>
              <span className="text-xs font-mono text-gray-600">{kleur?.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTIE 6 — Exporteren ─────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Exporteren</p>
        <p className="text-sm text-gray-500 mb-4">Gebruik huisstijl in een app-prompt</p>

        <div className="space-y-5">

          {/* Briefing */}
          <div>
            <button type="button"
              onClick={() => {
                const rgb1 = hexNaarRgb(form.primaire_kleur)
                const rgb2 = hexNaarRgb(form.secundaire_kleur)
                const rgb3 = hexNaarRgb(form.accent_kleur)
                const cm1 = rgb1 ? rgbNaarCmyk(rgb1.r, rgb1.g, rgb1.b) : null
                const cm2 = rgb2 ? rgbNaarCmyk(rgb2.r, rgb2.g, rgb2.b) : null
                const cm3 = rgb3 ? rgbNaarCmyk(rgb3.r, rgb3.g, rgb3.b) : null
                const fmtRgb  = rgb  => rgb  ? `${rgb.r},${rgb.g},${rgb.b}` : '—'
                const fmtCmyk = cmyk => cmyk ? `${cmyk.c}% ${cmyk.m}% ${cmyk.y}% ${cmyk.k}%` : '—'
                const bedrijf = form.bedrijfsslogan || form.email || 'klant'
                setBriefing(
`HUISSTIJL-BRIEFING voor ${bedrijf}:

IDENTITEIT:
- Bedrijf: ${form.bedrijfsslogan || '—'}
- Slogan: "${form.bedrijfsslogan || '—'}"
- Sector: ${form.sector || '—'}
- Stijl: ${form.stijlomschrijving || '—'}

KLEURENPALET:
- Primair:   HEX ${form.primaire_kleur?.toUpperCase()}  / RGB ${fmtRgb(rgb1)} / CMYK ${fmtCmyk(cm1)}
- Secundair: HEX ${form.secundaire_kleur?.toUpperCase()} / RGB ${fmtRgb(rgb2)} / CMYK ${fmtCmyk(cm2)}
- Accent:    HEX ${form.accent_kleur?.toUpperCase()}    / RGB ${fmtRgb(rgb3)} / CMYK ${fmtCmyk(cm3)}

TYPOGRAFIE:
- Titelfont: ${effectiefFontTitel} (gewicht ${form.font_gewicht})
- Broodtekstfont: ${effectiefFontTekst} (${form.font_grootte})
- Google Fonts importregel: ${fontsLink || '—'}

BEDRIJFSGEGEVENS (voor facturen/offertes):
- Adres: ${form.adres || '—'}
- BTW: ${form.btw || '—'}
- IBAN: ${form.iban || '—'}
- E-mail: ${form.email || '—'}
- Website: ${form.website || '—'}

INSTRUCTIE:
Pas deze huisstijl toe op alle visuele elementen:
header, knoppen, titels, badges, facturen en banners.
Gebruik geen andere kleuren tenzij functioneel nodig
(bv. rood voor foutmeldingen).`
                )
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition">
              <FileText size={14} /> Genereer huisstijl-briefing
            </button>

            {briefing && (
              <div className="mt-3 relative">
                <button type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(briefing)
                    setBriefingKop(true)
                    setTimeout(() => setBriefingKop(false), 2000)
                  }}
                  className="absolute top-2 right-2 text-xs font-semibold text-blue-500 hover:text-blue-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1 transition z-10">
                  {briefingKop ? '✓ Gekopieerd' : 'Kopieer'}
                </button>
                <textarea
                  readOnly
                  value={briefing}
                  rows={22}
                  className="w-full font-mono text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-24 resize-none focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* CSS-variabelen */}
          <div>
            <button type="button"
              onClick={() => {
                setCssBlok(
`:root {
  --kleur-primair:       ${form.primaire_kleur};
  --kleur-secundair:     ${form.secundaire_kleur};
  --kleur-accent:        ${form.accent_kleur};
  --font-titel:          '${effectiefFontTitel}', sans-serif;
  --font-tekst:          '${effectiefFontTekst}', sans-serif;
  --font-gewicht-titel:  ${form.font_gewicht};
  --font-grootte-tekst:  ${form.font_grootte};
  --knop-achtergrond:    var(--kleur-primair);
  --knop-tekst:          #ffffff;
  --header-achtergrond:  var(--kleur-primair);
}`
                )
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition">
              <FileText size={14} /> Genereer CSS-variabelen
            </button>

            {cssBlok && (
              <div className="mt-3 relative">
                <button type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(cssBlok)
                    setCssKop(true)
                    setTimeout(() => setCssKop(false), 2000)
                  }}
                  className="absolute top-2 right-2 text-xs font-semibold text-blue-500 hover:text-blue-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1 transition z-10">
                  {cssKop ? '✓ Gekopieerd' : 'Kopieer'}
                </button>
                <textarea
                  readOnly
                  value={cssBlok}
                  rows={13}
                  className="w-full font-mono text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-24 resize-none focus:outline-none"
                />
              </div>
            )}
          </div>

        </div>
      </section>

      <FoutMelding tekst={fout} />
      <OpslaanBericht tekst={ok} />

      {/* ── Actieknoppen ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={opslaan}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: '#185FA5' }}>
          <Save size={14} /> {opslaan ? 'Opslaan...' : 'Huisstijl opslaan'}
        </button>

        <button type="button"
          onClick={() => setSjabloonOpslaanOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition">
          ↓ Opslaan als sjabloon
        </button>

        <button type="button"
          onClick={() => { setSjablonenOpen(true); laadSjablonen() }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition">
          ↑ Laad uit sjabloon
        </button>
      </div>

      {/* ── Modal: Opslaan als sjabloon ──────────────────────────────────────── */}
      {sjabloonOpslaanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSjabloonOpslaanOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">Sjabloon opslaan</p>
              <button type="button" onClick={() => setSjabloonOpslaanOpen(false)}
                className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div>
              <label className={lbl}>Sjabloonnaam</label>
              <input
                autoFocus
                value={sjabloonNaam}
                onChange={e => setSjabloonNaam(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && slaOpAlsSjabloon()}
                placeholder="bv. Horeca warm rood"
                className={inp}
              />
            </div>
            {/* Preview kleuren */}
            <div className="flex items-center gap-2">
              {[form.primaire_kleur, form.secundaire_kleur, form.accent_kleur].map((k, i) => (
                <div key={i} className="w-6 h-6 rounded-md border border-gray-200 shadow-sm"
                  style={{ background: k }} />
              ))}
              <span className="text-xs text-gray-400 ml-1">{effectiefFontTitel} / {effectiefFontTekst}</span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setSjabloonOpslaanOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition">
                Annuleren
              </button>
              <button type="button" onClick={slaOpAlsSjabloon}
                disabled={!sjabloonNaam.trim() || sjabloonOpslaan}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#185FA5' }}>
                {sjabloonOpslaan ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Laad uit sjabloon ─────────────────────────────────────────── */}
      {sjablonenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => { setSjablonenOpen(false); setBevestigLaad(null); setVerwijderBevestig(null); setHernoem(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-800">Sjablonen</p>
              <button type="button"
                onClick={() => { setSjablonenOpen(false); setBevestigLaad(null); setVerwijderBevestig(null); setHernoem(null) }}
                className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>

            {/* Lijst */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
              {sjablonenLaden ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : sjablonen.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-400">Nog geen sjablonen opgeslagen.</p>
                  <p className="text-xs text-gray-300 mt-1">Gebruik "Opslaan als sjabloon" om er een aan te maken.</p>
                </div>
              ) : sjablonen.map(sj => {
                const j = sj.huisstijl_json ?? {}
                const datum = sj.aangemaakt_op
                  ? new Date(sj.aangemaakt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'
                const isHernoem = hernoem?.id === sj.id
                const isVerwijder = verwijderBevestig === sj.id
                const isBevestig = bevestigLaad?.id === sj.id

                return (
                  <div key={sj.id}
                    className="border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-50 transition space-y-2">

                    {/* Rij info */}
                    <div className="flex items-start gap-3">
                      {/* Kleurblokjes */}
                      <div className="flex gap-1 mt-0.5 flex-shrink-0">
                        {[j.primaire_kleur, j.secundaire_kleur, j.accent_kleur].map((k, i) => (
                          <div key={i} className="w-5 h-5 rounded border border-gray-200"
                            style={{ background: k || '#ccc' }} />
                        ))}
                      </div>

                      {/* Naam + meta */}
                      <div className="flex-1 min-w-0">
                        {isHernoem ? (
                          <div className="flex gap-2">
                            <input
                              autoFocus
                              value={hernoem.naam}
                              onChange={e => setHernoem(h => ({ ...h, naam: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') hernoemSjabloon(); if (e.key === 'Escape') setHernoem(null) }}
                              className="flex-1 text-sm px-2 py-1 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                            />
                            <button type="button" onClick={hernoemSjabloon}
                              className="text-xs font-semibold text-blue-600 px-2 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition">
                              OK
                            </button>
                            <button type="button" onClick={() => setHernoem(null)}
                              className="text-xs text-gray-400 hover:text-gray-600 px-1">
                              ×
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-gray-800 truncate">{sj.naam}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[j.font_titel, j.font_tekst].filter(Boolean).join(' / ') || 'Geen fonts'}
                          <span className="mx-1.5">·</span>{datum}
                        </p>
                      </div>

                      {/* Actieknoppen */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button type="button"
                          onClick={() => setHernoem({ id: sj.id, naam: sj.naam })}
                          title="Hernoem"
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition">
                          ✏
                        </button>
                        <button type="button"
                          onClick={() => setVerwijderBevestig(isVerwijder ? null : sj.id)}
                          title="Verwijder"
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition">
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Verwijder bevestiging */}
                    {isVerwijder && (
                      <div className="flex items-center gap-2 pt-1 pl-8">
                        <span className="text-xs text-red-600">Sjabloon verwijderen?</span>
                        <button type="button" onClick={() => verwijderSjabloon(sj.id)}
                          className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition">
                          Verwijderen
                        </button>
                        <button type="button" onClick={() => setVerwijderBevestig(null)}
                          className="text-xs text-gray-400 hover:text-gray-600">
                          Annuleren
                        </button>
                      </div>
                    )}

                    {/* Laad bevestiging */}
                    {isBevestig ? (
                      <div className="flex items-center gap-2 pt-1 pl-8">
                        <span className="text-xs text-amber-700">Huidige huisstijl overschrijven met "{sj.naam}"?</span>
                        <button type="button" onClick={() => bevestigLaadSjabloon(sj)}
                          className="text-xs font-semibold text-white px-3 py-1 rounded-lg transition"
                          style={{ background: '#185FA5' }}>
                          Laden
                        </button>
                        <button type="button" onClick={() => setBevestigLaad(null)}
                          className="text-xs text-gray-400 hover:text-gray-600">
                          Annuleren
                        </button>
                      </div>
                    ) : (
                      !isVerwijder && !isHernoem && (
                        <div className="pl-8">
                          <button type="button"
                            onClick={() => setBevestigLaad(sj)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
                            Laad dit sjabloon →
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

// ── Tab 3: Offertes ──────────────────────────────────────────────────────────
const OFFERTE_STATUS = {
  concept:      { label: 'Concept',      kleur: '#64748b', bg: '#f1f5f9' },
  verzonden:    { label: 'Verzonden',    kleur: '#2563eb', bg: '#dbeafe' },
  goedgekeurd:  { label: 'Goedgekeurd', kleur: '#16a34a', bg: '#dcfce7' },
  gefactureerd: { label: 'Gefactureerd',kleur: '#7c3aed', bg: '#ede9fe' },
}

function formatDatumKort(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function berekenOfferteTotaal(o) {
  if (!o.items_json) return null
  const items = Array.isArray(o.items_json) ? o.items_json : []
  const sub  = items.reduce((s, i) => s + (Number(i.hoeveelheid) || 0) * (Number(i.eenheidsprijs) || 0), 0)
  const excl = sub + sub * (Number(o.marge_percentage ?? 0) / 100)
  return excl + excl * (Number(o.btw_percentage ?? 21) / 100)
}

function fmtEuro(n) {
  return n == null ? '—' : `€ ${Number(n).toFixed(2).replace('.', ',')}`
}

function OfferteStatusBadge({ status }) {
  const cfg = OFFERTE_STATUS[status] ?? OFFERTE_STATUS.concept
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.kleur }}>
      {cfg.label}
    </span>
  )
}

function TabOffertes({ projectId, klantId }) {
  const navigate = useNavigate()
  const [offertes,      setOffertes]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [bezigFactuur,  setBezigFactuur]  = useState(null) // offerte.id of null
  const [bevestigOffId, setBevestigOffId] = useState(null) // offerte.id om te bevestigen

  useEffect(() => {
    supabase
      .from('offertes')
      .select('*')
      .eq('project_id', projectId)
      .order('aangemaakt_op', { ascending: false })
      .then(({ data }) => { setOffertes(data ?? []); setLoading(false) })
  }, [projectId])

  async function zetOmNaarFactuur(offerte) {
    setBezigFactuur(offerte.id); setBevestigOffId(null)
    const jaar    = new Date().getFullYear()
    const vandaag = new Date().toISOString().split('T')[0]

    const { count } = await supabase.from('facturen')
      .select('id', { count: 'exact', head: true })
      .gte('factuur_datum', `${jaar}-01-01`)
    const volg = String((count ?? 0) + 1).padStart(3, '0')
    const factuurNummer = `FACT-${jaar}-${volg}`

    const vervalDate = new Date()
    vervalDate.setDate(vervalDate.getDate() + 30)
    const vervalDatum = vervalDate.toISOString().split('T')[0]

    const items = Array.isArray(offerte.items_json) ? offerte.items_json : []
    const sub   = items.reduce((s, i) => s + (Number(i.hoeveelheid) || 0) * (Number(i.eenheidsprijs) || 0), 0)
    const mrgB  = sub * ((Number(offerte.marge_percentage) || 0) / 100)
    const excl  = sub + mrgB
    const btwB  = excl * ((Number(offerte.btw_percentage) || 21) / 100)
    const incl  = excl + btwB

    const { data: factuurData, error } = await supabase.from('facturen').insert({
      project_id:     projectId,
      klant_id:       offerte.klant_id || klantId || null,
      offerte_id:     offerte.id,
      factuur_nummer: factuurNummer,
      status:         'verstuurd',
      factuur_datum:  vandaag,
      verval_datum:   vervalDatum,
      items_json:     offerte.items_json,
      btw_percentage: Number(offerte.btw_percentage) || 21,
      subtotaal:      excl,
      btw_bedrag:     btwB,
      totaal_incl:    incl,
      betaald_bedrag: 0,
      notities:       offerte.notities || null,
    }).select('id').single()

    if (error) { setBezigFactuur(null); return }

    await supabase.from('offertes').update({
      status: 'gefactureerd',
      bijgewerkt_op: new Date().toISOString(),
    }).eq('id', offerte.id)

    navigate(`/facturen/${factuurData.id}`)
  }

  function nieuweOffertUrl() {
    const params = new URLSearchParams({ project_id: projectId })
    if (klantId) params.set('klant_id', klantId)
    return `/offertes/nieuw?${params.toString()}`
  }

  // Samenvattingen
  const goedgekeurdTotaal = offertes
    .filter(o => o.status === 'goedgekeurd')
    .reduce((s, o) => s + (berekenOfferteTotaal(o) ?? 0), 0)

  const gefactureerdTotaal = offertes
    .filter(o => o.status === 'gefactureerd')
    .reduce((s, o) => s + (berekenOfferteTotaal(o) ?? 0), 0)

  if (loading) return <Spinner />

  // ── Lege staat ────────────────────────────────────────────────────────────
  if (offertes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <FileText size={40} className="text-gray-200" />
        <p className="text-sm text-gray-400 font-medium">
          Nog geen offertes voor dit project.
        </p>
        <button
          onClick={() => navigate(nieuweOffertUrl())}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#185FA5' }}>
          <Plus size={14} /> Eerste offerte aanmaken
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Knop bovenaan */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {offertes.length} offerte{offertes.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => navigate(nieuweOffertUrl())}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#185FA5' }}>
          <Plus size={14} /> Nieuwe offerte voor dit project
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Offertenummer','Datum','Geldig tot','Status','Totaal incl. BTW','',''].map((h, i) => (
                <th key={i}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i >= 4 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {offertes.map(o => {
              const totaal = berekenOfferteTotaal(o)
              return (
                <tr key={o.id}
                  onClick={() => navigate(`/offertes/${o.id}`)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {o.offerte_nummer ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums">
                    {formatDatumKort(o.aangemaakt_op)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums">
                    {formatDatumKort(o.geldig_tot)}
                  </td>
                  <td className="px-4 py-3">
                    <OfferteStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800 tabular-nums">
                    {fmtEuro(totaal)}
                  </td>
                  {/* PDF-knop */}
                  <td className="px-2 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        const win = window.open(`/offertes/${o.id}`, '_blank')
                        if (win) win.addEventListener('load', () => win.print())
                      }}
                      title="Afdrukken / PDF"
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300">
                      PDF
                    </button>
                  </td>
                  {/* → Factuur knop (enkel bij goedgekeurd) */}
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    {o.status === 'goedgekeurd' && (
                      bevestigOffId === o.id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setBevestigOffId(null)}
                            className="px-2 py-1 rounded-lg text-xs text-gray-500 border border-gray-200 hover:bg-gray-100">
                            ✕
                          </button>
                          <button onClick={() => zetOmNaarFactuur(o)} disabled={bezigFactuur === o.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-60"
                            style={{ background: '#78C833' }}>
                            {bezigFactuur === o.id ? '...' : '✓ Bevestig'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setBevestigOffId(o.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors"
                          style={{ color: '#78C833', borderColor: '#78C833', background: '#f0fae5' }}>
                          → Factuur
                        </button>
                      )
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Samenvatting */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <p className="text-xs text-gray-400 mb-0.5">Totaal aantal offertes</p>
          <p className="text-lg font-bold text-gray-800">{offertes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <p className="text-xs text-gray-400 mb-0.5">Goedgekeurde waarde</p>
          <p className="text-lg font-bold" style={{ color: '#16a34a' }}>
            {fmtEuro(goedgekeurdTotaal || null)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <p className="text-xs text-gray-400 mb-0.5">Gefactureerde waarde</p>
          <p className="text-lg font-bold" style={{ color: '#7c3aed' }}>
            {fmtEuro(gefactureerdTotaal || null)}
          </p>
        </div>
      </div>

    </div>
  )
}

// ── Tab 4: Handleidingen ─────────────────────────────────────────────────────
function TabHandleidingen({ project }) {
  const navigate   = useNavigate()
  const projectId  = project.id

  const [handleidingen,    setHandleidingen]    = useState([])
  const [laden,            setLaden]            = useState(true)
  const [genereerOpen,     setGenereerOpen]     = useState(false)
  const [genereerTab,      setGenereerTab]      = useState('gebruiker')
  const [gegenereerd,      setGegenereerd]      = useState({ gebruiker: '', technisch: '' })
  const [opslaanStatus,    setOpslaanStatus]    = useState({ gebruiker: false, technisch: false })
  const [opgeslagen,       setOpgeslagen]       = useState({ gebruiker: false, technisch: false })

  async function laad() {
    setLaden(true)
    const { data } = await supabase
      .from('handleidingen')
      .select('id, type, aangemaakt_op, bijgewerkt_op')
      .eq('project_id', projectId)
      .order('type')
    setHandleidingen(data ?? [])
    setLaden(false)
  }

  useEffect(() => { laad() }, [projectId])

  function vanType(type) {
    return handleidingen.find(h => h.type === type) ?? null
  }

  function openGenereerModal() {
    const moduleNamen = moduleNamenVanProject(project.features_json)
    setGegenereerd({
      gebruiker: genereerGebruiker(project.naam, moduleNamen),
      technisch:  genereerTechnisch(project.naam, moduleNamen),
    })
    setOpgeslagen({ gebruiker: false, technisch: false })
    setGenereerTab('gebruiker')
    setGenereerOpen(true)
  }

  async function slaOpAlsConcept(type) {
    setOpslaanStatus(p => ({ ...p, [type]: true }))
    const bestaand = vanType(type)
    if (bestaand) {
      await supabase.from('handleidingen').update({ inhoud_markdown: gegenereerd[type] }).eq('id', bestaand.id)
    } else {
      await supabase.from('handleidingen').insert({ project_id: projectId, type, inhoud_markdown: gegenereerd[type] })
    }
    setOpslaanStatus(p => ({ ...p, [type]: false }))
    setOpgeslagen(p => ({ ...p, [type]: true }))
    laad()
  }

  if (laden) return <Spinner />

  const KAARTEN = [
    { type: 'gebruiker', label: 'Gebruikershandleiding', kleur: '#2563eb', bg: '#dbeafe' },
    { type: 'technisch',  label: 'Technische handleiding',  kleur: '#d97706', bg: '#fef3c7' },
  ]

  return (
    <div className="space-y-5">

      {/* ── Twee kaarten naast elkaar ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {KAARTEN.map(({ type, label, kleur, bg }) => {
          const h = vanType(type)
          return (
            <div key={type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={15} style={{ color: kleur }} />
                  <h3 className="text-sm font-bold text-gray-800">{label}</h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: bg, color: kleur }}>
                  {h ? 'Aanwezig' : 'Niet aangemaakt'}
                </span>
              </div>

              {h ? (
                <>
                  {/* Datum */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={12} />
                    Gewijzigd: {formatDatum(h.bijgewerkt_op ?? h.aangemaakt_op)}
                  </div>
                  {/* Knoppen */}
                  <div className="flex flex-col gap-2 mt-auto">
                    <button
                      onClick={() => navigate(`/handleidingen/${h.id}`)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
                      style={{ background: kleur }}
                    >
                      <Edit3 size={12} /> Openen en bewerken
                    </button>
                    <button
                      onClick={() => window.open(`/handleidingen/${h.id}?print=1`, '_blank')}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <FileDown size={12} /> PDF exporteren
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-400 flex-1">Nog niet aangemaakt</p>
                  <button
                    onClick={() => navigate(`/handleidingen/nieuw?project_id=${projectId}&type=${type}`)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Plus size={12} /> Aanmaken
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Versiegeschiedenis placeholder ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-2">Versiegeschiedenis</h3>
        <p className="text-sm text-gray-400 italic">
          Versiegeschiedenis wordt hier getoond wanneer beschikbaar.
        </p>
      </div>

      {/* ── Genereer knop ──────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={openGenereerModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors"
        >
          <Zap size={14} /> Genereer beide handleidingen
        </button>
      </div>

      {/* ── Genereer modal ─────────────────────────────────────────── */}
      {genereerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Gegenereerde handleidingen</h2>
              <button onClick={() => setGenereerOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {[
                { key: 'gebruiker', label: 'Gebruikershandleiding', kleur: '#2563eb' },
                { key: 'technisch',  label: 'Technische handleiding',  kleur: '#d97706' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setGenereerTab(t.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    genereerTab === t.key ? 'text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                  style={genereerTab === t.key ? { borderColor: t.kleur } : {}}
                >{t.label}</button>
              ))}
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-xs font-mono text-gray-600 leading-relaxed whitespace-pre-wrap">
                {gegenereerd[genereerTab]}
              </pre>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-400">
                {opgeslagen[genereerTab]
                  ? '✓ Opgeslagen als concept'
                  : vanType(genereerTab)
                    ? 'Overschrijft de bestaande handleiding'
                    : 'Maakt een nieuwe handleiding aan'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setGenereerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >Sluiten</button>
                <button
                  onClick={() => slaOpAlsConcept(genereerTab)}
                  disabled={opslaanStatus[genereerTab] || opgeslagen[genereerTab]}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {opslaanStatus[genereerTab] ? (
                    <><div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" /> Opslaan…</>
                  ) : opgeslagen[genereerTab] ? (
                    <><CheckCircle size={13} /> Opgeslagen</>
                  ) : (
                    <><Save size={13} /> Opslaan als concept</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 5: Meldingen ─────────────────────────────────────────────────────────
const ERNST_CFG = {
  laag:   { label: 'Laag',   kleur: '#16a34a', bg: '#dcfce7' },
  medium: { label: 'Medium', kleur: '#d97706', bg: '#fef3c7' },
  hoog:   { label: 'Hoog',   kleur: '#dc2626', bg: '#fee2e2' },
}
const MELDING_STATUSSEN = [
  { key: 'nieuw',          label: 'Nieuw' },
  { key: 'in_behandeling', label: 'In behandeling' },
  { key: 'opgelost',       label: 'Opgelost' },
  { key: 'gesloten',       label: 'Gesloten' },
]
const MELDING_STATUS_KLEUREN = {
  nieuw:          { kleur: '#64748b', bg: '#f1f5f9' },
  in_behandeling: { kleur: '#d97706', bg: '#fef3c7' },
  opgelost:       { kleur: '#16a34a', bg: '#dcfce7' },
  gesloten:       { kleur: '#94a3b8', bg: '#f8fafc' },
}

function formatDatumKortMeldingen(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function TabMeldingen({ projectId }) {
  const [meldingen, setMeldingen]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [notities, setNotities]     = useState({})   // { [id]: tekst }
  const [opslaans, setOpslaans]     = useState({})   // { [id]: bool }
  const [bewaard, setBewaard]       = useState({})   // { [id]: bool }
  const [embedOpen, setEmbedOpen]   = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)

  async function laad() {
    setLoading(true)
    const { data } = await supabase
      .from('bug_meldingen')
      .select('*')
      .eq('project_id', projectId)
      .order('aangemaakt_op', { ascending: false })
    const rijen = data ?? []
    setMeldingen(rijen)
    // Initialiseer notitie-state vanuit DB
    const init = {}
    rijen.forEach(m => { init[m.id] = m.notities_developer ?? '' })
    setNotities(init)
    setLoading(false)
  }

  useEffect(() => { laad() }, [projectId])

  async function updateStatus(id, status) {
    await supabase.from('bug_meldingen').update({ status }).eq('id', id)
    setMeldingen(m => m.map(x => x.id === id ? { ...x, status } : x))
  }

  async function slaNotitieOp(id) {
    setOpslaans(s => ({ ...s, [id]: true }))
    await supabase.from('bug_meldingen')
      .update({ notities_developer: notities[id] })
      .eq('id', id)
    setMeldingen(m => m.map(x => x.id === id ? { ...x, notities_developer: notities[id] } : x))
    setOpslaans(s => ({ ...s, [id]: false }))
    setBewaard(s => ({ ...s, [id]: true }))
    setTimeout(() => setBewaard(s => ({ ...s, [id]: false })), 2000)
  }

  const embedSnippet = `<!-- BYT Meldingsformulier -->
<script src="https://byt-studio.netlify.app/byt-melding.js"
  data-project="${projectId}">
</script>`

  async function kopieer() {
    await navigator.clipboard.writeText(embedSnippet)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2000)
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-5">
      {/* Tabel of lege staat */}
      {meldingen.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
          <Bug size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Geen meldingen ontvangen voor dit project.</p>
          <p className="text-xs text-gray-300 mt-1">Meldingen verschijnen hier zodra klanten het formulier invullen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500">{meldingen.length} melding{meldingen.length !== 1 ? 'en' : ''}</p>
            <div className="flex gap-2 text-xs text-gray-400">
              {Object.entries(ERNST_CFG).map(([key, cfg]) => {
                const n = meldingen.filter(m => m.ernst === key).length
                return n > 0 ? (
                  <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: cfg.bg, color: cfg.kleur }}>
                    {n} {cfg.label}
                  </span>
                ) : null
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Datum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Klant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Onderdeel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Ernst</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide min-w-[200px]">Notitie developer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {meldingen.map(m => {
                  const ec  = ERNST_CFG[m.ernst] ?? ERNST_CFG.medium
                  const sc  = MELDING_STATUS_KLEUREN[m.status] ?? MELDING_STATUS_KLEUREN.nieuw
                  const nid = m.id
                  return (
                    <tr key={nid} className="hover:bg-gray-50/50 transition-colors align-top">
                      {/* Datum */}
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDatumKortMeldingen(m.aangemaakt_op)}
                      </td>

                      {/* Klant */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{m.klant_naam || '—'}</p>
                        {m.klant_email && (
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{m.klant_email}</p>
                        )}
                      </td>

                      {/* Onderdeel */}
                      <td className="px-4 py-3">
                        {m.onderdeel
                          ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">{m.onderdeel}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                        {m.beschrijving && (
                          <p className="text-xs text-gray-400 mt-1 max-w-[160px] line-clamp-2">{m.beschrijving}</p>
                        )}
                      </td>

                      {/* Ernst badge */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ background: ec.bg, color: ec.kleur }}>
                          <AlertTriangle size={9} /> {ec.label}
                        </span>
                      </td>

                      {/* Status dropdown */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={m.status}
                            onChange={e => updateStatus(nid, e.target.value)}
                            className="appearance-none text-xs font-semibold pl-2.5 pr-6 py-1.5 rounded-full border focus:outline-none cursor-pointer"
                            style={{
                              background: sc.bg,
                              color: sc.kleur,
                              borderColor: sc.bg,
                            }}
                          >
                            {MELDING_STATUSSEN.map(s => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-2 pointer-events-none"
                            style={{ color: sc.kleur }} />
                        </div>
                      </td>

                      {/* Notitie inline */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <textarea
                            value={notities[nid] ?? ''}
                            onChange={e => setNotities(n => ({ ...n, [nid]: e.target.value }))}
                            rows={2}
                            placeholder="Notitie…"
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none min-w-0"
                          />
                          <button
                            onClick={() => slaNotitieOp(nid)}
                            disabled={opslaans[nid]}
                            className="flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white disabled:opacity-50 transition whitespace-nowrap"
                            style={{ background: bewaard[nid] ? '#16a34a' : '#185FA5' }}
                          >
                            {bewaard[nid] ? '✓' : opslaans[nid] ? '…' : 'OK'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Embed code sectie */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm font-semibold text-gray-700">Meldingsformulier voor klanten</p>
            <p className="text-xs text-gray-400 mt-0.5">Genereer een embed-snippet die klanten op hun site kunnen plakken.</p>
          </div>
          <button
            onClick={() => setEmbedOpen(o => !o)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-white transition"
          >
            <Bug size={14} /> {embedOpen ? 'Verbergen' : 'Genereer snippet'}
          </button>
        </div>

        {embedOpen && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500">HTML snippet</p>
              <button
                onClick={kopieer}
                className="text-xs text-blue-500 hover:text-blue-700 transition flex items-center gap-1"
              >
                {gekopieerd ? '✓ Gekopieerd!' : 'Kopieer'}
              </button>
            </div>
            <pre className="text-xs font-mono text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-4 overflow-x-auto whitespace-pre leading-relaxed">
              {embedSnippet}
            </pre>
            <p className="text-xs text-gray-400">
              ⚠️ De script-URL is een placeholder. De echte embed bouwen we in een latere fase.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 6: Info ──────────────────────────────────────────────────────────────
function TabInfo({ project, onVerwijderd }) {
  const navigate = useNavigate()
  const [bevestig, setBevestig] = useState(false)
  const [loading, setLoading] = useState(false)

  async function verwijder() {
    setLoading(true)
    await supabase.from('projecten').delete().eq('id', project.id)
    onVerwijderd()
    navigate('/projecten')
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Links</p>
        {project.github_url ? (
          <a href={project.github_url} target="_blank" rel="noopener"
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <ExternalLink size={14} /> {project.github_url}
          </a>
        ) : <p className="text-sm text-gray-400">Geen GitHub URL</p>}
        {project.netlify_url ? (
          <a href={project.netlify_url} target="_blank" rel="noopener"
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <ExternalLink size={14} /> {project.netlify_url}
          </a>
        ) : <p className="text-sm text-gray-400">Geen Netlify URL</p>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2 text-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tijdlijn</p>
        <div className="flex gap-4 text-gray-500"><span className="w-36 text-gray-400">Aangemaakt op</span><span>{formatDatum(project.aangemaakt_op)}</span></div>
        <div className="flex gap-4 text-gray-500"><span className="w-36 text-gray-400">Laatste wijziging</span><span>{formatDatum(project.bijgewerkt_op)}</span></div>
        <div className="flex gap-4 text-gray-500"><span className="w-36 text-gray-400">Project-ID</span><span className="font-mono text-xs text-gray-400">{project.id}</span></div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-red-700 mb-1">Gevarenzone</p>
        <p className="text-xs text-red-500 mb-4">Dit verwijdert het project permanent, inclusief alle gekoppelde handleidingen en huisstijl. Dit kan niet ongedaan gemaakt worden.</p>
        {!bevestig ? (
          <button onClick={() => setBevestig(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-100 transition">
            <Trash2 size={14} /> Project verwijderen
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={verwijder} disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition">
              {loading ? 'Verwijderen...' : 'Ja, definitief verwijderen'}
            </button>
            <button onClick={() => setBevestig(false)}
              className="text-sm text-gray-500 hover:text-gray-700 transition">
              Annuleren
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Facturatie ──────────────────────────────────────────────────────────
const FACTUUR_STATUS = {
  concept:              { label: 'Concept',              kleur: '#64748b', bg: '#f1f5f9' },
  verstuurd:            { label: 'Verstuurd',            kleur: '#2563eb', bg: '#dbeafe' },
  gedeeltelijk_betaald: { label: 'Gedeeltelijk betaald', kleur: '#d97706', bg: '#fef9ee' },
  betaald:              { label: 'Betaald',              kleur: '#16a34a', bg: '#dcfce7' },
  vervallen:            { label: 'Vervallen',            kleur: '#dc2626', bg: '#fee2e2' },
}

function FactuurStatusBadge({ status }) {
  const cfg = FACTUUR_STATUS[status] ?? FACTUUR_STATUS.concept
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.kleur }}>
      {cfg.label}
    </span>
  )
}

function TabFacturatie({ projectId, klantId }) {
  const navigate = useNavigate()
  const [facturen,  setFacturen]  = useState([])
  const [offertes,  setOffertes]  = useState([])
  const [loading,   setLoading]   = useState(true)

  const vandaagStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    Promise.all([
      supabase.from('facturen').select('*').eq('project_id', projectId).order('factuur_datum', { ascending: true }),
      supabase.from('offertes').select('id, status, aangemaakt_op, bijgewerkt_op').eq('project_id', projectId).order('aangemaakt_op', { ascending: true }),
    ]).then(([{ data: f }, { data: o }]) => {
      setFacturen(f ?? [])
      setOffertes(o ?? [])
      setLoading(false)
    })
  }, [projectId])

  if (loading) return <Spinner />

  // ── Financiële samenvatting ───────────────────────────────────────────────
  const totaalGefactureerd = facturen
    .filter(f => !f.is_creditnota)
    .reduce((s, f) => s + Number(f.totaal_incl ?? 0), 0)
  const totaalBetaald = facturen.reduce((s, f) => s + Number(f.betaald_bedrag ?? 0), 0)
  const totaalOpenstaand = Math.max(0, totaalGefactureerd - totaalBetaald)

  // ── URL helpers ─────────────────────────────────────────────────────────
  function nieuweFactuurUrl(extra = {}) {
    const p = new URLSearchParams({ project_id: projectId })
    if (klantId) p.set('klant_id', klantId)
    Object.entries(extra).forEach(([k, v]) => p.set(k, v))
    return `/facturen/nieuw?${p.toString()}`
  }

  // ── Betalingstimeline opbouwen ───────────────────────────────────────────
  function bouwTimeline() {
    const stappen = []

    // Offerte goedgekeurd
    const goedgekeurde = offertes.find(o => o.status === 'goedgekeurd' || o.status === 'gefactureerd')
    stappen.push({
      label:     'Offerte goedgekeurd',
      datum:     goedgekeurde?.bijgewerkt_op ?? null,
      voltooid:  !!goedgekeurde,
      kleur:     '#185FA5',
    })

    // Voorschot gefactureerd
    const voorschot = facturen.find(f => f.is_voorschot)
    stappen.push({
      label:    'Voorschot gefactureerd',
      datum:    voorschot?.factuur_datum ?? null,
      voltooid: !!voorschot,
      kleur:    '#d97706',
    })

    // Voorschot betaald
    stappen.push({
      label:    'Voorschot betaald',
      datum:    voorschot?.betaaldatum ?? null,
      voltooid: !!voorschot?.betaaldatum,
      kleur:    '#16a34a',
    })

    // Eindfactuur verstuurd (niet-voorschot, niet-creditnota)
    const eindfactuur = facturen.find(f => !f.is_voorschot && !f.is_creditnota)
    stappen.push({
      label:    'Eindfactuur verstuurd',
      datum:    eindfactuur?.factuur_datum ?? null,
      voltooid: !!eindfactuur,
      kleur:    '#2563eb',
    })

    // Eindfactuur betaald
    stappen.push({
      label:    'Eindfactuur betaald',
      datum:    eindfactuur?.betaaldatum ?? null,
      voltooid: !!eindfactuur?.betaaldatum,
      kleur:    '#16a34a',
    })

    return stappen
  }

  const tijdlijn = bouwTimeline()

  // ── Lege staat ────────────────────────────────────────────────────────────
  if (facturen.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Receipt size={40} className="text-gray-200" />
        <p className="text-sm text-gray-400 font-medium">Nog geen facturen voor dit project.</p>
        <button
          onClick={() => navigate(nieuweFactuurUrl())}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#78C833' }}>
          <Plus size={14} /> Eerste factuur aanmaken
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Actieknopen ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          {facturen.length} factuur{facturen.length !== 1 ? 'en' : ''}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(nieuweFactuurUrl({ type: 'voorschot' }))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <Receipt size={13} /> Voorschotfactuur (30%)
          </button>
          <button
            onClick={() => navigate(nieuweFactuurUrl())}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#78C833' }}>
            <Plus size={14} /> Nieuwe factuur
          </button>
        </div>
      </div>

      {/* ── Financiële kaarten ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Gefactureerd */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Gefactureerd</p>
          <p className="text-2xl font-bold text-gray-900">{fmtEuro(totaalGefactureerd)}</p>
          <p className="text-xs text-gray-400 mt-1">{facturen.filter(f => !f.is_creditnota).length} factuur{facturen.filter(f => !f.is_creditnota).length !== 1 ? 'en' : ''}</p>
        </div>

        {/* Betaald */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Betaald</p>
          <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>{fmtEuro(totaalBetaald)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {totaalGefactureerd > 0
              ? `${Math.round((totaalBetaald / totaalGefactureerd) * 100)}% van totaal`
              : '—'}
          </p>
        </div>

        {/* Openstaand */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Openstaand</p>
          <p className="text-2xl font-bold" style={{ color: totaalOpenstaand > 0 ? '#dc2626' : '#16a34a' }}>
            {fmtEuro(totaalOpenstaand)}
          </p>
          <p className="text-xs mt-1" style={{ color: totaalOpenstaand > 0 ? '#dc2626' : '#9ca3af' }}>
            {totaalOpenstaand > 0 ? 'Te innen' : 'Volledig betaald'}
          </p>
        </div>
      </div>

      {/* ── Factuurlijst ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Nummer','Type','Datum','Vervaldatum','Totaal incl. BTW','Betaald','Status',''].map((h, i) => (
                <th key={i}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i >= 4 ? 'text-right' : 'text-left'} last:text-center`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {facturen.map(f => {
              const isVervallen = f.verval_datum && f.verval_datum < vandaagStr && f.status === 'verstuurd'
              const volledigBetaald = Number(f.betaald_bedrag ?? 0) >= Number(f.totaal_incl ?? 0) - 0.01
              return (
                <tr key={f.id}
                  onClick={() => navigate(`/facturen/${f.id}`)}
                  className="hover:bg-green-50/30 cursor-pointer transition-colors group">
                  {/* Nummer */}
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800 group-hover:text-[#78C833]">
                    {f.factuur_nummer}
                  </td>
                  {/* Type badge */}
                  <td className="px-4 py-3">
                    {f.is_creditnota ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Creditnota</span>
                    ) : f.is_voorschot ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Voorschot</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">Factuur</span>
                    )}
                  </td>
                  {/* Factuurdatum */}
                  <td className="px-4 py-3 text-gray-500 tabular-nums text-xs">
                    {f.factuur_datum
                      ? new Date(f.factuur_datum).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : '—'}
                  </td>
                  {/* Vervaldatum */}
                  <td className="px-4 py-3 tabular-nums text-xs">
                    {f.verval_datum ? (
                      <span style={{ color: isVervallen ? '#dc2626' : '#6b7280', fontWeight: isVervallen ? 600 : 400 }}>
                        {new Date(f.verval_datum).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {isVervallen && ' ⚠'}
                      </span>
                    ) : '—'}
                  </td>
                  {/* Totaal */}
                  <td className="px-4 py-3 text-right font-semibold text-gray-800 tabular-nums">
                    {f.is_creditnota
                      ? <span className="text-gray-400">{fmtEuro(f.totaal_incl)}</span>
                      : fmtEuro(f.totaal_incl)}
                  </td>
                  {/* Betaald */}
                  <td className="px-4 py-3 text-right tabular-nums text-xs"
                    style={{ color: volledigBetaald ? '#16a34a' : '#6b7280', fontWeight: volledigBetaald ? 600 : 400 }}>
                    {fmtEuro(f.betaald_bedrag)}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3 text-right">
                    <FactuurStatusBadge status={f.status} />
                  </td>
                  {/* Open link */}
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/facturen/${f.id}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100">
                      Open
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Betalingstimeline ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Betalingstimeline</p>
        <div className="relative">
          {/* Verticale verbindingslijn */}
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-100" />

          <div className="space-y-4">
            {tijdlijn.map((stap, i) => (
              <div key={i} className="flex items-start gap-4 relative">
                {/* Icoon */}
                <div className="flex-shrink-0 relative z-10">
                  {stap.voltooid ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: stap.kleur }}>
                      <CheckCircle size={12} className="text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 bg-white" />
                  )}
                </div>

                {/* Label + datum */}
                <div className="flex-1 min-w-0 pb-1">
                  <p className={`text-sm font-medium ${stap.voltooid ? 'text-gray-800' : 'text-gray-400'}`}>
                    {stap.label}
                  </p>
                  {stap.datum && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(stap.datum).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tabs definitie ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overzicht',     label: 'Overzicht',     icon: FolderKanban },
  { key: 'huisstijl',     label: 'Huisstijl',     icon: Palette },
  { key: 'offertes',      label: 'Offertes',       icon: FileText },
  { key: 'facturatie',    label: 'Facturatie',     icon: Receipt },
  { key: 'handleidingen', label: 'Handleidingen',  icon: BookOpen },
  { key: 'meldingen',     label: 'Meldingen',      icon: Bug },
  { key: 'info',          label: 'Info',           icon: Info },
  { key: 'aicheck',       label: 'AI-check',       icon: Lightbulb },
]

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [klanten, setKlanten] = useState([])
  const [huisstijl, setHuisstijl] = useState(null)
  const [aiCheckOngelezen, setAiCheckOngelezen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actieveTab, setActieveTab] = useState('overzicht')
  const [fout, setFout] = useState('')

  async function laadProject() {
    const { data, error } = await supabase
      .from('projecten')
      .select('*, klanten(naam, bedrijfsnaam)')
      .eq('id', id)
      .single()
    if (error || !data) { setFout('Project niet gevonden.'); setLoading(false); return }
    setProject(data)
    document.title = `${data.naam} — BYT Studio`
    setLoading(false)
  }

  useEffect(() => {
    laadProject()
    supabase.from('klanten').select('id, naam, bedrijfsnaam').order('naam')
      .then(({ data }) => setKlanten(data ?? []))
    supabase.from('huisstijlen').select('*').eq('project_id', id).maybeSingle()
      .then(({ data }) => setHuisstijl(data ?? null))
    supabase.from('ai_checks').select('id', { count: 'exact', head: true })
      .eq('project_id', id).eq('gelezen', false)
      .then(({ count }) => setAiCheckOngelezen((count ?? 0) > 0))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
    </div>
  )

  if (fout || !project) return (
    <div className="text-center py-24">
      <p className="text-gray-500">{fout || 'Project niet gevonden.'}</p>
      <Link to="/projecten" className="text-sm text-blue-500 hover:underline mt-2 inline-block">← Terug naar projecten</Link>
    </div>
  )

  const klantNaam = project.klanten?.bedrijfsnaam || project.klanten?.naam || null

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link to="/projecten" className="hover:text-gray-600 transition flex items-center gap-1">
          <ChevronLeft size={14} /> Projecten
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{project.naam}</span>
      </div>

      {/* Project header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{project.naam}</h1>
            <StatusBadge status={project.status} />
          </div>
          {klantNaam && (
            <p className="text-sm text-gray-400 mt-1">{klantNaam}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(t => {
            const Icon = t.icon
            const actief = actieveTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => {
                  setActieveTab(t.key)
                  if (t.key === 'aicheck') setAiCheckOngelezen(false)
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  actief
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                }`}
              >
                <Icon size={14} style={{ color: actief ? '#185FA5' : undefined }} />
                {t.label}
                {t.key === 'aicheck' && aiCheckOngelezen && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab inhoud */}
      <div>
        {actieveTab === 'overzicht'     && <TabOverzicht     project={project} klanten={klanten} onBijgewerkt={laadProject} />}
        {actieveTab === 'huisstijl'     && <TabHuisstijl     projectId={project.id} />}
        {actieveTab === 'offertes'      && <TabOffertes      projectId={project.id} klantId={project.klant_id} />}
        {actieveTab === 'facturatie'    && <TabFacturatie    projectId={project.id} klantId={project.klant_id} />}
        {actieveTab === 'handleidingen' && <TabHandleidingen project={project} />}
        {actieveTab === 'meldingen'     && <TabMeldingen     projectId={project.id} />}
        {actieveTab === 'info'          && <TabInfo          project={project} onVerwijderd={() => {}} />}
        {actieveTab === 'aicheck'       && (
          <AICheck
            projectId={project.id}
            projectNaam={project.naam}
            sector={huisstijl?.sector || 'Algemeen'}
            features={project.features_json?.modules ?? []}
            huisstijl={huisstijl}
          />
        )}
      </div>
    </div>
  )
}
