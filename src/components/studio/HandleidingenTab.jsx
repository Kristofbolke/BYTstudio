// HandleidingenTab.jsx — Handleidingen tabblad voor Studio
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Plus, ExternalLink, FileText, Clock } from 'lucide-react'

const TYPE_BADGE = {
  gebruiker: { label: 'Gebruiker', bg: '#dbeafe', tekst: '#1d4ed8' },
  technisch:  { label: 'Technisch', bg: '#ffedd5', tekst: '#c2410c' },
}

function formatDatum(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
    </div>
  )
}

export default function HandleidingenTab({ project }) {
  const navigate = useNavigate()
  const [handleidingen, setHandleidingen] = useState([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    if (!project?.id) return
    laad()
  }, [project?.id])

  async function laad() {
    setLaden(true)
    const { data } = await supabase
      .from('handleidingen')
      .select('id, type, aangemaakt_op, bijgewerkt_op, inhoud_markdown, projecten(naam)')
      .eq('project_id', project.id)
      .order('aangemaakt_op', { ascending: false })
    setHandleidingen(data ?? [])
    setLaden(false)
  }

  function naarNieuw(type) {
    navigate(`/handleidingen/nieuw?project_id=${project.id}&type=${type}`)
  }

  function naarHandleiding(id) {
    navigate(`/handleidingen/${id}`)
  }

  const gebruiker = handleidingen.find(h => h.type === 'gebruiker') ?? null
  const technisch  = handleidingen.find(h => h.type === 'technisch')  ?? null

  if (laden) return <Spinner />

  return (
    <div className="p-6 space-y-6">

      {/* ── Twee type-secties ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: 'gebruiker', label: 'Gebruikershandleiding', record: gebruiker },
          { key: 'technisch',  label: 'Technische handleiding', record: technisch  },
        ].map(({ key, label, record }) => {
          const badge = TYPE_BADGE[key]
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: badge.bg, color: badge.tekst }}>
                  {badge.label}
                </span>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
              </div>

              {record ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={11} />
                    Bijgewerkt {formatDatum(record.bijgewerkt_op)}
                  </div>
                  <button
                    onClick={() => naarHandleiding(record.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: '#185FA5' }}
                  >
                    <ExternalLink size={12} /> Bekijk / bewerk
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400">Nog niet aangemaakt.</p>
                  <button
                    onClick={() => naarNieuw(key)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Plus size={12} /> Aanmaken
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Volledige lijst ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">
            Alle handleidingen
            <span className="ml-2 text-xs font-normal text-gray-400">({handleidingen.length})</span>
          </h3>
          <button
            onClick={() => naarNieuw('gebruiker')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-85"
            style={{ background: '#185FA5' }}
          >
            <Plus size={13} /> Nieuwe handleiding
          </button>
        </div>

        {handleidingen.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 py-10 flex flex-col items-center gap-3 text-gray-400">
            <FileText size={28} strokeWidth={1.25} />
            <p className="text-sm">Nog geen handleidingen voor dit project.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {handleidingen.map(h => {
              const badge = TYPE_BADGE[h.type] ?? TYPE_BADGE.gebruiker
              const eersteRegel = h.inhoud_markdown?.split('\n').find(r => r.startsWith('# '))?.replace(/^# /, '') ?? '(geen titel)'
              return (
                <div key={h.id}
                  className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                  <FileText size={15} className="text-gray-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{eersteRegel}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Bijgewerkt {formatDatum(h.bijgewerkt_op)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: badge.bg, color: badge.tekst }}>
                    {badge.label}
                  </span>
                  <button
                    onClick={() => naarHandleiding(h.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    <ExternalLink size={11} /> Bewerk
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
