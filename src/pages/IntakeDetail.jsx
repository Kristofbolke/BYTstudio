// IntakeDetail.jsx — Alle ingevulde velden van intake_forms in leesbare vorm
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ChevronLeft, Pencil, FileDown, Building2, AlertTriangle,
  Lightbulb, Server, Users, ClipboardList, CheckCircle,
} from 'lucide-react'

// ── Hulpfuncties ─────────────────────────────────────────────────────────────
function formatDatum(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
    </div>
  )
}

const STATUS_LABELS = { draft: 'Concept', submitted: 'Ingediend' }
const STATUS_STIJLEN = {
  draft:     { kleur: '#64748b', bg: '#f1f5f9' },
  submitted: { kleur: '#16a34a', bg: '#f0fdf4' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_STIJLEN[status] ?? STATUS_STIJLEN.draft
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.kleur }}>
      {STATUS_LABELS[status] ?? status ?? '—'}
    </span>
  )
}

// ── Weergavehulpen ───────────────────────────────────────────────────────────
function Sectie({ icon: Icon, titel, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
        <Icon size={15} className="text-gray-400" /> {titel}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function Veld({ label, waarde }) {
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{waarde || '—'}</p>
    </div>
  )
}

function BadgeLijst({ label, items }) {
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <p className="text-xs text-gray-400 mb-1.5">{label}</p>
      {!items || items.length === 0 ? (
        <p className="text-sm text-gray-300">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => (
            <span key={item} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{item}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function FeaturesLijst({ features }) {
  return (
    <div className="py-2">
      <p className="text-xs text-gray-400 mb-1.5">Gewenste features</p>
      {!features || features.length === 0 ? (
        <p className="text-sm text-gray-300">—</p>
      ) : (
        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={f.id ?? i} className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-800">{f.naam || '—'}</span>
                {f.prioriteit && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    f.prioriteit === 'must' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {f.prioriteit === 'must' ? 'Must-have' : 'Nice-to-have'}
                  </span>
                )}
              </div>
              {f.beschrijving && <p className="text-xs text-gray-500 mt-0.5">{f.beschrijving}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function IntakeDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [intake, setIntake] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fout, setFout] = useState('')

  useEffect(() => {
    async function laad() {
      const [{ data: projectData, error: projectFout }, { data: intakeData }] = await Promise.all([
        supabase.from('projecten').select('id, naam').eq('id', id).single(),
        supabase.from('intake_forms').select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      if (projectFout || !projectData) { setFout('Project niet gevonden.'); setLoading(false); return }
      setProject(projectData)
      setIntake(intakeData ?? null)
      document.title = `Intake — ${projectData.naam} — BYT Studio`
      setLoading(false)
    }
    laad()
  }, [id])

  if (loading) return <Spinner />

  if (fout || !project) return (
    <div className="text-center py-24">
      <p className="text-gray-500">{fout || 'Project niet gevonden.'}</p>
      <Link to="/projecten" className="text-sm text-blue-500 hover:underline mt-2 inline-block">← Terug naar projecten</Link>
    </div>
  )

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb + acties */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link to={`/projecten/${id}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition">
          <ChevronLeft size={14} /> Terug naar project
        </Link>
        <div className="flex items-center gap-2">
          <button
            disabled
            title="Binnenkort beschikbaar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 border border-gray-200 cursor-not-allowed"
          >
            <Pencil size={12} /> Bewerk intake
          </button>
          <button
            disabled
            title="Binnenkort beschikbaar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 border border-gray-200 cursor-not-allowed"
          >
            <FileDown size={12} /> Exporteer als PDF
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Intake — {project.naam}</h1>
      </div>

      {!intake ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
          <ClipboardList size={28} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Nog geen intake ingevuld voor dit project.</p>
          <p className="text-xs text-gray-300 mt-2">Genereer een publieke link via het Overzicht-tabblad van het project.</p>
        </div>
      ) : (
        <>
          {intake.status !== 'submitted' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
              Deze intake is nog niet ingediend — onderstaande velden kunnen onvolledig zijn.
            </div>
          )}

          <Sectie icon={Building2} titel="Bedrijf">
            <Veld label="Bedrijfsnaam" waarde={intake.bedrijfsnaam} />
            <Veld label="Ondernemingsvorm" waarde={intake.ondernemingsvorm} />
            <Veld label="Sector" waarde={intake.sector} />
            <Veld label="Aantal medewerkers" waarde={intake.aantal_medewerkers} />
            <Veld label="Contactpersoon naam" waarde={intake.contactpersoon_naam} />
            <Veld label="Contactpersoon functie" waarde={intake.contactpersoon_functie} />
            <Veld label="Contactpersoon e-mail" waarde={intake.contactpersoon_email} />
            <Veld label="Contactpersoon telefoon" waarde={intake.contactpersoon_telefoon} />
            <Veld label="Website" waarde={intake.website} />
            <Veld label="Adres" waarde={intake.adres} />
          </Sectie>

          <Sectie icon={AlertTriangle} titel="Problematiek">
            <Veld label="Huidige werkwijze" waarde={intake.huidige_werkwijze} />
            <Veld label="Grootste pijnpunt" waarde={intake.grootste_pijnpunt} />
            <Veld label="Tijd verloren" waarde={intake.tijd_verloren} />
            <Veld label="Gevolg bij niet oplossen" waarde={intake.gevolg_bij_niet_oplossen} />
            <Veld label="Eerdere pogingen" waarde={intake.eerdere_pogingen} />
          </Sectie>

          <Sectie icon={Lightbulb} titel="De gewenste app">
            <Veld label="Type app" waarde={intake.type_app} />
            <Veld label="Omschrijving app" waarde={intake.omschrijving_app} />
            <Veld label="Vergelijkbaar voorbeeld" waarde={intake.vergelijkbaar_voorbeeld} />
            <Veld label="Prioriteit" waarde={intake.prioriteit} />
            <FeaturesLijst features={intake.features} />
          </Sectie>

          <Sectie icon={Server} titel="Technisch">
            <Veld label="Huidige tools" waarde={intake.huidige_tools} />
            <Veld label="Bestaande data" waarde={intake.bestaande_data} />
            <Veld label="Benodigde integraties" waarde={intake.benodigde_integraties} />
            <Veld label="Technische kennis bedrijf" waarde={intake.technische_kennis_bedrijf} />
            <Veld label="Hosting voorkeur" waarde={intake.hosting_voorkeur} />
            <Veld label="Budget indicatie" waarde={intake.budget_indicatie} />
          </Sectie>

          <Sectie icon={Users} titel="Gebruikers">
            <Veld label="Type gebruikers" waarde={intake.gebruikers_type} />
            <Veld label="Aantal gebruikers" waarde={intake.aantal_gebruikers} />
            <Veld label="Technische vaardigheid gebruikers" waarde={intake.technische_vaardigheid_gebruikers} />
            <BadgeLijst label="Devices" items={intake.devices} />
            <BadgeLijst label="Talen" items={intake.talen} />
          </Sectie>

          <Sectie icon={ClipboardList} titel="Intern">
            <Veld label="Notities intern" waarde={intake.notities_intern} />
            <div className="py-2 border-b border-gray-50 flex items-center gap-2">
              <p className="text-xs text-gray-400 w-40 flex-shrink-0">Status</p>
              <StatusBadge status={intake.status} />
            </div>
            <div className="py-2 border-b border-gray-50 flex items-center gap-2">
              <p className="text-xs text-gray-400 w-40 flex-shrink-0">Ingevuld door</p>
              <p className="text-sm text-gray-800">{intake.filled_by === 'klant' ? 'Klant' : intake.filled_by === 'intern' ? 'Intern' : '—'}</p>
            </div>
            <div className="py-2 flex items-center gap-2">
              <p className="text-xs text-gray-400 w-40 flex-shrink-0">Datum ingediend</p>
              <p className="text-sm text-gray-800 flex items-center gap-1.5">
                {intake.submitted_at ? (<><CheckCircle size={13} className="text-green-500" /> {formatDatum(intake.submitted_at)}</>) : '—'}
              </p>
            </div>
          </Sectie>
        </>
      )}
    </div>
  )
}
