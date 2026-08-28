// Leads.jsx — Beheer van leads uit het publieke intakeformulier (/intake)
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { Search, Eye, ArrowRightCircle, UserPlus } from 'lucide-react'

const STATUSSEN = [
  { key: 'nieuw',          label: 'Nieuw',           kleur: '#dc2626', bg: '#fee2e2' },
  { key: 'in_behandeling', label: 'In behandeling',  kleur: '#d97706', bg: '#fef9ee' },
  { key: 'omgezet',        label: 'Omgezet',         kleur: '#16a34a', bg: '#f0fdf4' },
  { key: 'gesloten',       label: 'Gesloten',        kleur: '#6b7280', bg: '#f9fafb' },
]

function statusCfg(status) { return STATUSSEN.find(s => s.key === status) ?? STATUSSEN[0] }

function StatusBadge({ status }) {
  const cfg = statusCfg(status)
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.kleur }}>
      {cfg.label}
    </span>
  )
}

function formatDatum(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('alle')
  const [zoekterm, setZoekterm] = useState('')
  const [omzetten, setOmzetten] = useState(null)
  const [omzetBezig, setOmzetBezig] = useState(false)
  const [fout, setFout] = useState('')

  async function laadLeads() {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').order('ingediend_op', { ascending: false })
    setLeads(data ?? [])
    setLoading(false)
  }

  useEffect(() => { document.title = 'Leads — BYT Studio'; laadLeads() }, [])

  const gefilterd = leads.filter(l => {
    if (filter !== 'alle' && l.status !== filter) return false
    const q = zoekterm.toLowerCase()
    if (!q) return true
    return (
      l.bedrijfsnaam?.toLowerCase().includes(q) ||
      l.contactpersoon_naam?.toLowerCase().includes(q) ||
      l.contactpersoon_email?.toLowerCase().includes(q) ||
      l.sector?.toLowerCase().includes(q)
    )
  })

  const ditJaar = new Date().getFullYear()
  const kpi = {
    nieuw: leads.filter(l => l.status === 'nieuw').length,
    inBehandeling: leads.filter(l => l.status === 'in_behandeling').length,
    omgezet: leads.filter(l => l.status === 'omgezet').length,
    totaalDitJaar: leads.filter(l => l.ingediend_op && new Date(l.ingediend_op).getFullYear() === ditJaar).length,
  }

  async function bevestigOmzetten() {
    const lead = omzetten
    setOmzetBezig(true); setFout('')

    const { data: klant, error: klantFout } = await supabase.from('klanten').insert({
      naam: lead.contactpersoon_naam,
      bedrijfsnaam: lead.bedrijfsnaam,
      email: lead.contactpersoon_email,
      telefoon: lead.contactpersoon_telefoon,
      sector: lead.sector,
      website: lead.website,
      adres: lead.adres,
    }).select('id').single()
    if (klantFout) { setFout('Klant aanmaken mislukt: ' + klantFout.message); setOmzetBezig(false); return }

    const { data: project, error: projectFout } = await supabase.from('projecten').insert({
      naam: lead.bedrijfsnaam,
      klant_id: klant.id,
      status: 'intake',
      beschrijving: lead.omschrijving_app || null,
    }).select('id').single()
    if (projectFout) { setFout('Project aanmaken mislukt: ' + projectFout.message); setOmzetBezig(false); return }

    await supabase.from('intake_forms').insert({
      project_id: project.id,
      status: 'submitted',
      filled_by: 'klant',
      bedrijfsnaam: lead.bedrijfsnaam,
      ondernemingsvorm: lead.ondernemingsvorm,
      sector: lead.sector,
      aantal_medewerkers: lead.aantal_medewerkers,
      contactpersoon_naam: lead.contactpersoon_naam,
      contactpersoon_functie: lead.contactpersoon_functie,
      contactpersoon_email: lead.contactpersoon_email,
      contactpersoon_telefoon: lead.contactpersoon_telefoon,
      website: lead.website,
      adres: lead.adres,
      huidige_werkwijze: lead.huidige_werkwijze,
      grootste_pijnpunt: lead.grootste_pijnpunt,
      tijd_verloren: lead.tijd_verloren,
      eerdere_pogingen: lead.eerder_geprobeerd,
      type_app: lead.type_app,
      omschrijving_app: lead.omschrijving_app,
      vergelijkbaar_voorbeeld: lead.vergelijkbaar_voorbeeld,
      prioriteit: lead.prioriteit,
      features: (lead.features ?? []).map(naam => ({ naam, prioriteit: 'nice' })),
      benodigde_integraties: lead.integraties_nodig,
      technische_kennis_bedrijf: lead.technische_kennis_bedrijf,
      hosting_voorkeur: lead.hosting_voorkeur,
      budget_indicatie: lead.budget_indicatie,
      gebruikers_type: lead.gebruikers_type,
      aantal_gebruikers: lead.aantal_gebruikers,
      technische_vaardigheid_gebruikers: lead.it_bekwaamheid,
      devices: lead.apparaten,
      talen: lead.interface_talen,
      submitted_at: new Date().toISOString(),
    })

    await supabase.from('leads').update({
      status: 'omgezet', klant_id: klant.id, project_id: project.id,
    }).eq('id', lead.id)

    setOmzetBezig(false)
    setOmzetten(null)
    navigate(`/projecten/${project.id}`)
  }

  return (
    <PageWrapper title="Leads" description={`${leads.length} lead${leads.length !== 1 ? 's' : ''} via het publieke intakeformulier`}>
      <div className="space-y-5">
        {/* KPI kaarten */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-red-600">{kpi.nieuw}</p>
            <p className="text-xs text-gray-400 mt-0.5">Nieuwe leads</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-amber-600">{kpi.inBehandeling}</p>
            <p className="text-xs text-gray-400 mt-0.5">In behandeling</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-green-600">{kpi.omgezet}</p>
            <p className="text-xs text-gray-400 mt-0.5">Omgezet naar project</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-800">{kpi.totaalDitJaar}</p>
            <p className="text-xs text-gray-400 mt-0.5">Totaal dit jaar</p>
          </div>
        </div>

        {/* Filters + zoek */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter('alle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === 'alle' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              Alle ({leads.length})
            </button>
            {STATUSSEN.map(s => (
              <button key={s.key} onClick={() => setFilter(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === s.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {s.label} ({leads.filter(l => l.status === s.key).length})
              </button>
            ))}
          </div>
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={zoekterm} onChange={e => setZoekterm(e.target.value)}
              placeholder="Zoek op naam, e-mail, sector..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400" />
          </div>
        </div>

        {fout && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{fout}</p>}

        {/* Lijst */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
          </div>
        ) : gefilterd.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center">
            <UserPlus size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Geen leads gevonden.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {gefilterd.map(lead => (
              <div key={lead.id} className="flex items-center gap-4 px-5 py-4 flex-wrap">
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold text-gray-900">{lead.bedrijfsnaam}</p>
                  <p className="text-xs text-gray-400">{lead.contactpersoon_naam}</p>
                </div>
                <div className="min-w-[180px] flex-1 text-xs text-gray-500">
                  <p>{lead.contactpersoon_email}</p>
                  <p>{lead.contactpersoon_telefoon || '—'}</p>
                </div>
                <div className="min-w-[140px] text-xs text-gray-500">
                  <p>{lead.sector || '—'}</p>
                  <p className="text-gray-400">{lead.type_app || '—'}</p>
                </div>
                <div className="min-w-[130px] text-xs text-gray-500">{lead.budget_indicatie || '—'}</div>
                <StatusBadge status={lead.status} />
                <div className="text-xs text-gray-400 min-w-[90px]">{formatDatum(lead.ingediend_op)}</div>
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => navigate(`/leads/${lead.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition">
                    <Eye size={12} /> Bekijk
                  </button>
                  {lead.status !== 'omgezet' && (
                    <button onClick={() => setOmzetten(lead)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition"
                      style={{ background: '#22C35D' }}>
                      <ArrowRightCircle size={12} /> Omzet naar project
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bevestig omzetten */}
      {omzetten && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Omzetten naar project?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Dit maakt een klant '<strong>{omzetten.bedrijfsnaam}</strong>' en bijhorend project aan, en koppelt de
              ingevulde intakegegevens. De lead-status wordt op 'omgezet' gezet.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setOmzetten(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Annuleren</button>
              <button onClick={bevestigOmzetten} disabled={omzetBezig}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition"
                style={{ background: '#22C35D' }}>
                {omzetBezig ? 'Bezig...' : 'Ja, omzetten'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
