// Projecten.jsx — Kanban-bord met projecten gegroepeerd per status
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Search, X, FolderKanban, Calendar, ChevronDown } from 'lucide-react'

// ── Constanten ───────────────────────────────────────────────────────────────
export const STATUSSEN = [
  { key: 'intake',          label: 'Intake',          kleur: '#64748b', bg: '#f1f5f9', rand: '#e2e8f0' },
  { key: 'offerte',         label: 'Offerte',          kleur: '#d97706', bg: '#fef9ee', rand: '#fde68a' },
  { key: 'in_ontwikkeling', label: 'In ontwikkeling',  kleur: '#2563eb', bg: '#eff6ff', rand: '#bfdbfe' },
  { key: 'afgeleverd',      label: 'Afgeleverd',       kleur: '#16a34a', bg: '#f0fdf4', rand: '#bbf7d0' },
  { key: 'onderhoud',       label: 'Onderhoud',        kleur: '#7c3aed', bg: '#faf5ff', rand: '#ddd6fe' },
]

export function statusCfg(key) {
  return STATUSSEN.find(s => s.key === key) ?? STATUSSEN[0]
}

export function StatusBadge({ status, klein = false }) {
  const cfg = statusCfg(status)
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${klein ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}
      style={{ background: cfg.bg, color: cfg.kleur, border: `1px solid ${cfg.rand}` }}
    >
      {cfg.label}
    </span>
  )
}

function formatDatum(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Nieuw project modal ───────────────────────────────────────────────────────
const LEEG = { naam: '', beschrijving: '', klant_id: '', status: 'intake', github_url: '', netlify_url: '' }

function ProjectModal({ onSluit, onOpgeslagen }) {
  const [form, setForm] = useState(LEEG)
  const [klanten, setKlanten] = useState([])
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    supabase.from('klanten').select('id, naam, bedrijfsnaam').order('naam')
      .then(({ data }) => setKlanten(data ?? []))
  }, [])

  function stelIn(v, w) { setForm(f => ({ ...f, [v]: w })) }

  async function opslaan(e) {
    e.preventDefault()
    if (!form.klant_id)    { setFout('Klant is verplicht.'); return }
    if (!form.naam.trim()) { setFout('Projectnaam is verplicht.'); return }
    setLoading(true); setFout('')
    const { error } = await supabase.from('projecten').insert({
      naam: form.naam,
      beschrijving: form.beschrijving || null,
      klant_id: form.klant_id || null,
      status: form.status,
      github_url: form.github_url || null,
      netlify_url: form.netlify_url || null,
    })
    if (error) { setFout('Opslaan mislukt: ' + error.message); setLoading(false); return }
    onOpgeslagen()
  }

  const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white'
  const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">Nieuw project</h3>
          <button onClick={onSluit} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={opslaan} className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Projectnaam <span className="text-red-400">*</span></label>
            <input value={form.naam} onChange={e => stelIn('naam', e.target.value)}
              placeholder="Naam van het project" className={inp} />
          </div>

          <div>
            <label className={lbl}>Klant <span className="text-red-400">*</span></label>
            <div className="relative">
              <select value={form.klant_id} onChange={e => stelIn('klant_id', e.target.value)} className={inp + ' appearance-none pr-8'}>
                <option value="">— Geen klant gekoppeld —</option>
                {klanten.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.naam}{k.bedrijfsnaam ? ` (${k.bedrijfsnaam})` : ''}
                  </option>
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

          <div>
            <label className={lbl}>Beschrijving</label>
            <textarea value={form.beschrijving} onChange={e => stelIn('beschrijving', e.target.value)}
              rows={3} placeholder="Korte omschrijving van het project..."
              className={inp + ' resize-none'} />
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          {fout && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{fout}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onSluit}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
              Annuleren
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#185FA5' }}>
              {loading ? 'Opslaan...' : 'Project aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Projectkaart ──────────────────────────────────────────────────────────────
function ProjectKaart({ project, onClick }) {
  const klantNaam = project.klanten?.bedrijfsnaam || project.klanten?.naam || null
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
          {project.naam}
        </p>
      </div>
      {klantNaam && (
        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
          {klantNaam}
        </p>
      )}
      {project.beschrijving && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {project.beschrijving}
        </p>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar size={10} /> {formatDatum(project.aangemaakt_op)}
        </span>
      </div>
    </div>
  )
}

// ── Kanban kolom ─────────────────────────────────────────────────────────────
function KanbanKolom({ status, projecten, onKaartKlik }) {
  const cfg = statusCfg(status.key)
  return (
    <div className="flex flex-col min-w-[240px] w-[240px]">
      {/* Kolom header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.kleur }} />
          <span className="text-sm font-semibold text-gray-700">{status.label}</span>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {projecten.length}
        </span>
      </div>

      {/* Kaarten */}
      <div className="flex flex-col gap-2.5 flex-1">
        {projecten.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-100 p-5 text-center">
            <p className="text-xs text-gray-300">Geen projecten</p>
          </div>
        ) : (
          projecten.map(p => (
            <ProjectKaart key={p.id} project={p} onClick={() => onKaartKlik(p.id)} />
          ))
        )}
      </div>
    </div>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function Projecten() {
  useEffect(() => { document.title = 'Projecten — BYT Studio' }, [])
  const navigate = useNavigate()
  const [projecten, setProjecten] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoekterm, setZoekterm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  async function laadProjecten() {
    setLoading(true)
    const { data } = await supabase
      .from('projecten')
      .select('*, klanten(naam, bedrijfsnaam)')
      .order('aangemaakt_op', { ascending: false })
    setProjecten(data ?? [])
    setLoading(false)
  }

  useEffect(() => { laadProjecten() }, [])

  const gefilterd = projecten.filter(p => {
    const q = zoekterm.toLowerCase()
    return (
      p.naam?.toLowerCase().includes(q) ||
      p.klanten?.naam?.toLowerCase().includes(q) ||
      p.klanten?.bedrijfsnaam?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      {/* Paginaheader */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projecten</h1>
          <p className="text-sm text-gray-400 mt-0.5">{projecten.length} project{projecten.length !== 1 ? 'en' : ''} in totaal</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
          style={{ background: '#185FA5' }}
        >
          <Plus size={15} /> Nieuw project
        </button>
      </div>

      {/* Zoekbalk */}
      <div className="relative max-w-xs mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={zoekterm}
          onChange={e => setZoekterm(e.target.value)}
          placeholder="Zoek op project of klant..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
        />
      </div>

      {/* Kanban bord */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STATUSSEN.map(status => (
              <KanbanKolom
                key={status.key}
                status={status}
                projecten={gefilterd.filter(p => p.status === status.key)}
                onKaartKlik={id => navigate(`/projecten/${id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <ProjectModal
          onSluit={() => setModalOpen(false)}
          onOpgeslagen={() => { setModalOpen(false); laadProjecten() }}
        />
      )}
    </div>
  )
}
