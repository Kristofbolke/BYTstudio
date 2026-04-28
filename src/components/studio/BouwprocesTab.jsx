// BouwprocesTab.jsx — Gedeelde component voor Bouwproces tabblad
// Gebruikt in: Studio.jsx en ProjectDetail.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronDown, ChevronRight, CheckCircle } from 'lucide-react'
import KopieerKnop from '../KopieerKnop'

const VOORTGANG_STAPPEN = [
  { key: 'scaffold_klaar',      label: 'Scaffold gekopieerd' },
  { key: 'supabase_klaar',      label: 'Supabase aangemaakt' },
  { key: 'claude_code_gestart', label: 'Claude Code gestart' },
  { key: 'afgeleverd',          label: 'Afgeleverd op Netlify' },
]
const STATUS_VOLGORDE = ['gegenereerd', 'scaffold_klaar', 'supabase_klaar', 'claude_code_gestart', 'afgeleverd']

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
    </div>
  )
}

export default function BouwprocesTab({ project }) {
  const [pakket, setPakket]       = useState(null)
  const [laden, setLaden]         = useState(true)
  const [uitgebreid, setUitgebreid] = useState({ s1: true, s2: false, s3: false, s4: false, s5: false })

  useEffect(() => {
    if (!project?.id) return
    setLaden(true)
    supabase
      .from('bouwpakketten')
      .select('*')
      .eq('project_id', project.id)
      .maybeSingle()
      .then(({ data }) => {
        setPakket(data ?? null)
        setLaden(false)
      })
  }, [project?.id])

  async function updateVoortgang(stapKey) {
    if (!pakket) return
    const nieuweStatus = pakket.status === stapKey ? 'gegenereerd' : stapKey
    const { error } = await supabase
      .from('bouwpakketten')
      .update({ status: nieuweStatus, bijgewerkt_op: new Date().toISOString() })
      .eq('id', pakket.id)
    if (!error) setPakket(p => ({ ...p, status: nieuweStatus }))
  }

  if (laden) return <Spinner />

  if (!pakket) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">
        <p>Nog geen bouwpakket gegenereerd voor dit project.</p>
        <p className="mt-1 text-xs text-gray-300">
          Ga naar het project → tabblad "Bouwproces" om een pakket te genereren.
        </p>
      </div>
    )
  }

  const currentStatusIdx = STATUS_VOLGORDE.indexOf(pakket.status)

  const secties = [
    {
      key: 's1',
      stap: 'Stap 1 — Scaffold kopiëren',
      sub: 'Voer dit uit in Terminal',
      inhoud: pakket.scaffold_commando,
    },
    {
      key: 's2',
      stap: 'Stap 2 — .env bestand aanmaken',
      sub: 'Kopieer dit naar een nieuw .env bestand in de projectmap',
      inhoud: pakket.env_inhoud,
      extra: (
        <p className="text-xs text-gray-500 mt-2">
          Vervang [INVULLEN] door de waarden uit je nieuwe Supabase project.<br />
          Ga naar supabase.com → nieuw project → Settings → API
        </p>
      ),
    },
    {
      key: 's3',
      stap: 'Stap 3 — CLAUDE.md invullen',
      sub: 'Hernoem CLAUDE.md.template naar CLAUDE.md en vervang de inhoud',
      inhoud: pakket.claude_md_inhoud,
    },
    {
      key: 's4',
      stap: 'Stap 4 — Supabase instellen',
      sub: 'Maak een nieuw Supabase project aan en voer deze SQL uit in SQL Editor',
      inhoud: pakket.sql_migraties,
      extra: (
        <ol className="text-xs text-gray-500 mt-2 space-y-0.5 list-decimal list-inside">
          <li>Ga naar supabase.com → New project</li>
          <li>Regio: Frankfurt</li>
          <li>Na aanmaken: SQL Editor → plak bovenstaande SQL → Run</li>
          <li>Kopieer URL en anon key naar .env</li>
        </ol>
      ),
    },
    {
      key: 's5',
      stap: 'Stap 5 — Deployen op Netlify',
      sub: 'Voeg deze variabelen toe in Netlify → Site settings → Environment variables',
      inhoud: pakket.netlify_variabelen,
      extra: (
        <ol className="text-xs text-gray-500 mt-3 space-y-0.5 list-decimal list-inside">
          <li>Ga naar netlify.com → Add new site</li>
          <li>Import from GitHub</li>
          <li>Build command: <span className="font-mono">npm run build</span></li>
          <li>Publish directory: <span className="font-mono">dist</span></li>
          <li>Voeg bovenstaande variabelen toe</li>
          <li>Deploy site</li>
        </ol>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      {secties.map(({ key, stap, sub, inhoud, extra }) => (
        <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setUitgebreid(u => ({ ...u, [key]: !u[key] }))}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">{stap}</p>
              <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
            </div>
            <div className="flex items-center gap-2">
              {inhoud && (
                <span onClick={e => e.stopPropagation()}>
                  <KopieerKnop tekst={inhoud} />
                </span>
              )}
              {uitgebreid[key]
                ? <ChevronDown size={16} className="text-gray-400" />
                : <ChevronRight size={16} className="text-gray-400" />
              }
            </div>
          </button>
          {uitgebreid[key] && (
            <div className="p-4">
              {inhoud && (
                <pre className="bg-gray-900 text-green-300 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {inhoud}
                </pre>
              )}
              {extra}
            </div>
          )}
        </div>
      ))}

      {/* Voortgangsbalk */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Voortgang</p>
        <div className="flex items-start gap-0">
          {VOORTGANG_STAPPEN.map((stap, idx) => {
            const stapIdx = STATUS_VOLGORDE.indexOf(stap.key)
            const voltooid = currentStatusIdx >= stapIdx
            return (
              <div key={stap.key} className="flex items-center flex-1">
                <button
                  onClick={() => updateVoortgang(stap.key)}
                  className="flex flex-col items-center gap-1.5 flex-1"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all"
                    style={{
                      background: voltooid ? '#185FA5' : 'white',
                      borderColor: voltooid ? '#185FA5' : '#d1d5db',
                    }}
                  >
                    {voltooid
                      ? <CheckCircle size={14} color="white" />
                      : <span className="text-xs text-gray-400 font-bold">{idx + 1}</span>
                    }
                  </div>
                  <span className="text-xs text-center leading-tight max-w-16"
                    style={{ color: voltooid ? '#185FA5' : '#9ca3af' }}>
                    {stap.label}
                  </span>
                </button>
                {idx < VOORTGANG_STAPPEN.length - 1 && (
                  <div className="h-0.5 flex-1 mb-5 rounded-full"
                    style={{ background: currentStatusIdx > stapIdx ? '#185FA5' : '#e5e7eb' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
