// Handleidingen.jsx — Overzicht van alle handleidingen
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { BookOpen, Search, Plus, ExternalLink, FileDown } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_BADGE = {
  gebruiker: { label: 'Gebruiker', bg: 'bg-blue-100',   text: 'text-blue-700' },
  technisch:  { label: 'Technisch', bg: 'bg-orange-100', text: 'text-orange-700' },
}

const FILTER_TABS = [
  { key: 'alle',      label: 'Alle' },
  { key: 'gebruiker', label: 'Gebruiker' },
  { key: 'technisch', label: 'Technisch' },
]

function formatDatum(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function klantNaamVan(h) {
  return h.projecten?.klanten?.bedrijfsnaam || h.projecten?.klanten?.naam || '—'
}

// ── Eenvoudige PDF-export via printvenster ────────────────────────────────────
function exporteerPDF(h) {
  const projectNaam = h.projecten?.naam ?? 'Handleiding'
  const typeLabel   = TYPE_BADGE[h.type]?.label ?? h.type
  const content     = (h.inhoud_markdown ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html lang="nl"><head>
    <meta charset="UTF-8">
    <title>${projectNaam} — ${typeLabel}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px;
             margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.7; }
      h1, h2, h3, h4 { margin-top: 1.5em; }
      pre { background: #f4f4f4; padding: 1em; border-radius: 6px; overflow-x: auto; font-size: 0.85em; }
      code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
      hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }
      @media print { body { margin: 0; } }
    </style>
  </head><body>
    <h1 style="font-size:1.4em;margin-bottom:4px">${projectNaam} — ${typeLabel}</h1>
    <p style="color:#9ca3af;font-size:0.8em;margin-top:0">Gegenereerd op ${formatDatum(new Date().toISOString())}</p>
    <hr>
    <pre style="white-space:pre-wrap;font-family:inherit;background:none;padding:0;font-size:0.95em">${content}</pre>
  </body></html>`)
  win.document.close()
  win.print()
}

// ── Hoofd component ───────────────────────────────────────────────────────────
export default function Handleidingen() {
  const navigate = useNavigate()

  const [handleidingen, setHandleidingen] = useState([])
  const [laden,         setLaden]         = useState(true)
  const [zoek,          setZoek]          = useState('')
  const [filter,        setFilter]        = useState('alle')

  useEffect(() => {
    laadHandleidingen()
  }, [])

  async function laadHandleidingen() {
    setLaden(true)
    const { data } = await supabase
      .from('handleidingen')
      .select('id, type, aangemaakt_op, bijgewerkt_op, inhoud_markdown, projecten(id, naam, klanten(naam, bedrijfsnaam))')
      .order('bijgewerkt_op', { ascending: false, nullsFirst: false })
    setHandleidingen(data ?? [])
    setLaden(false)
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const gefilterd = handleidingen.filter(h => {
    const project = h.projecten?.naam ?? ''
    const klant   = klantNaamVan(h)
    const matchZoek   = !zoek || project.toLowerCase().includes(zoek.toLowerCase()) || klant.toLowerCase().includes(zoek.toLowerCase())
    const matchFilter = filter === 'alle' || h.type === filter
    return matchZoek && matchFilter
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageWrapper
      title="Handleidingen"
      description="Overzicht van alle gebruikers- en technische documentatie per project."
    >
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Zoekbalk */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            placeholder="Zoek op project of klant…"
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === t.key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {/* Nieuwe handleiding */}
        <button
          onClick={() => navigate('/handleidingen/nieuw')}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors"
        >
          <Plus size={15} /> Nieuwe handleiding
        </button>
      </div>

      {/* ── Tabel ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {laden ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="text-center py-20 px-6">
            <BookOpen size={36} className="mx-auto mb-3 text-gray-200" />
            {handleidingen.length === 0 ? (
              <>
                <p className="text-sm font-medium text-gray-500">Nog geen handleidingen aangemaakt.</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  Maak een nieuwe handleiding aan via een project of via de knop hierboven.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Geen handleidingen gevonden voor deze zoekopdracht.</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Project</th>
                <th className="text-left px-4 py-3">Klant</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Aangemaakt</th>
                <th className="text-left px-4 py-3">Laatste wijziging</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {gefilterd.map(h => {
                const badge = TYPE_BADGE[h.type] ?? TYPE_BADGE.gebruiker
                return (
                  <tr
                    key={h.id}
                    onClick={() => navigate(`/handleidingen/${h.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {h.projecten?.naam ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{klantNaamVan(h)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400">{formatDatum(h.aangemaakt_op)}</td>
                    <td className="px-4 py-3.5 text-gray-400">
                      {formatDatum(h.bijgewerkt_op ?? h.aangemaakt_op)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => navigate(`/handleidingen/${h.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          <ExternalLink size={12} /> Openen
                        </button>
                        <button
                          onClick={() => exporteerPDF(h)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          <FileDown size={12} /> PDF exporteren
                        </button>
                      </div>
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
