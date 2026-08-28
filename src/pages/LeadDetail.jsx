// LeadDetail.jsx — Detailpagina van een lead uit het publieke intakeformulier
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, ArrowRightCircle, Save } from 'lucide-react'

const STATUSSEN = [
  { key: 'nieuw',          label: 'Nieuw' },
  { key: 'in_behandeling', label: 'In behandeling' },
  { key: 'omgezet',        label: 'Omgezet' },
  { key: 'gesloten',       label: 'Gesloten' },
]

function Sectie({ titel, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{titel}</p>
      {children}
    </div>
  )
}

function Rij({ label, waarde }) {
  if (waarde === null || waarde === undefined || waarde === '' || (Array.isArray(waarde) && waarde.length === 0)) return null
  return (
    <div className="flex justify-between gap-4 text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-gray-800 text-right">{Array.isArray(waarde) ? waarde.join(', ') : String(waarde)}</span>
    </div>
  )
}

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [notities, setNotities] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [ok, setOk] = useState('')

  async function laadLead() {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').eq('id', id).single()
    setLead(data ?? null)
    setStatus(data?.status ?? 'nieuw')
    setNotities(data?.notities_intern ?? '')
    setLoading(false)
  }

  useEffect(() => { document.title = 'Lead — BYT Studio'; laadLead() }, [id])

  async function opslaanWijzigingen() {
    setOpslaan(true); setOk('')
    await supabase.from('leads').update({ status, notities_intern: notities || null }).eq('id', id)
    setOpslaan(false)
    setOk('Opgeslagen.')
    setTimeout(() => setOk(''), 3000)
    laadLead()
  }

  function omzettenNaarKlant() {
    navigate('/klanten', {
      state: {
        vooringevuld: {
          naam: lead.contactpersoon_naam,
          bedrijfsnaam: lead.bedrijfsnaam,
          email: lead.contactpersoon_email,
          telefoon: lead.contactpersoon_telefoon,
        },
      },
    })
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Laden...</div>
  if (!lead) return <div className="p-8 text-sm text-red-500">Lead niet gevonden.</div>

  return (
    <div className="max-w-4xl space-y-5">
      <Link to="/leads" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 w-fit transition-colors">
        <ChevronLeft size={14} /> Terug naar leads
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{lead.bedrijfsnaam}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{lead.contactpersoon_naam} · ingediend op {new Date(lead.ingediend_op).toLocaleDateString('nl-BE')}</p>
        </div>
        {lead.status !== 'omgezet' && (
          <button onClick={omzettenNaarKlant}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
            style={{ background: '#22C35D' }}>
            <ArrowRightCircle size={14} /> Omzet naar klant &amp; project
          </button>
        )}
      </div>

      {/* Status & notities */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white">
              {STATUSSEN.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Notities (intern)</label>
          <textarea rows={3} value={notities} onChange={e => setNotities(e.target.value)}
            placeholder="Interne opmerkingen over deze lead..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white resize-none" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={opslaanWijzigingen} disabled={opslaan}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition"
            style={{ background: '#185FA5' }}>
            <Save size={14} /> {opslaan ? 'Opslaan...' : 'Opslaan'}
          </button>
          {ok && <span className="text-xs text-green-600 font-medium">{ok}</span>}
        </div>
      </div>

      <Sectie titel="1. Uw bedrijf">
        <Rij label="Bedrijfsnaam" waarde={lead.bedrijfsnaam} />
        <Rij label="Contactpersoon" waarde={lead.contactpersoon_naam} />
        <Rij label="Functie/rol" waarde={lead.contactpersoon_functie} />
        <Rij label="E-mail" waarde={lead.contactpersoon_email} />
        <Rij label="Telefoon" waarde={lead.contactpersoon_telefoon} />
        <Rij label="Website" waarde={lead.website} />
        <Rij label="Sector" waarde={lead.sector} />
        <Rij label="Aantal medewerkers" waarde={lead.aantal_medewerkers} />
        <Rij label="Ondernemingsvorm" waarde={lead.ondernemingsvorm} />
        <Rij label="Adres" waarde={lead.adres} />
      </Sectie>

      <Sectie titel="2. Uw huisstijl">
        <Rij label="Heeft al huisstijl" waarde={lead.heeft_huisstijl === null ? null : (lead.heeft_huisstijl ? 'Ja' : 'Nee')} />
        <Rij label="Beschrijving" waarde={lead.huisstijl_beschrijving} />
        {lead.logo_url && (
          <div className="text-sm">
            <span className="text-gray-400">Logo: </span>
            <a href={lead.logo_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">bekijk bestand</a>
          </div>
        )}
        {lead.stijldocument_url && (
          <div className="text-sm">
            <span className="text-gray-400">Stijldocument: </span>
            <a href={lead.stijldocument_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">bekijk bestand</a>
          </div>
        )}
      </Sectie>

      <Sectie titel="3. Uw uitdaging">
        <Rij label="Huidige werkwijze" waarde={lead.huidige_werkwijze} />
        <Rij label="Grootste pijnpunt" waarde={lead.grootste_pijnpunt} />
        <Rij label="Tijd verloren" waarde={lead.tijd_verloren} />
        <Rij label="Eerder geprobeerd" waarde={lead.eerder_geprobeerd} />
      </Sectie>

      <Sectie titel="4. De gewenste app">
        <Rij label="Type app" waarde={lead.type_app} />
        <Rij label="Omschrijving" waarde={lead.omschrijving_app} />
        <Rij label="Vergelijkbaar voorbeeld" waarde={lead.vergelijkbaar_voorbeeld} />
        <Rij label="Prioriteit" waarde={lead.prioriteit} />
        <Rij label="Budget indicatie" waarde={lead.budget_indicatie} />
        <Rij label="Gewenste opleverdatum" waarde={lead.gewenste_opleverdatum} />
      </Sectie>

      <Sectie titel="5. Gewenste features">
        <Rij label="Features" waarde={lead.features} />
      </Sectie>

      <Sectie titel="6. Technisch & gebruikers">
        <Rij label="Apparaten" waarde={lead.apparaten} />
        <Rij label="Wie gebruikt de app" waarde={lead.gebruikers_type} />
        <Rij label="Aantal gebruikers" waarde={lead.aantal_gebruikers} />
        <Rij label="IT-bekwaamheid" waarde={lead.it_bekwaamheid} />
        <Rij label="Interface talen" waarde={lead.interface_talen} />
        <Rij label="Integraties nodig" waarde={lead.integraties_nodig} />
      </Sectie>

      <Sectie titel="7. Afronden">
        <Rij label="Hosting voorkeur" waarde={lead.hosting_voorkeur} />
        <Rij label="Technische kennis bedrijf" waarde={lead.technische_kennis_bedrijf} />
        <Rij label="Opmerkingen" waarde={lead.opmerkingen} />
      </Sectie>
    </div>
  )
}
