// HuisstijlBriefing.jsx — Blanco huisstijl-briefingdocument (printbaar) per project
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, Printer } from 'lucide-react'
import '../styles/print.css'

const KLEUREN = ['Primaire kleur', 'Secundaire kleur', 'Accentkleur']

export default function HuisstijlBriefing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [instelling, setInstelling] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fout, setFout] = useState('')

  useEffect(() => {
    document.title = 'Huisstijl Briefing — BYT Studio'
    Promise.all([
      supabase.from('projecten').select('*, klanten(naam, bedrijfsnaam)').eq('id', id).single(),
      supabase.from('instellingen').select('*').limit(1).single(),
    ]).then(([{ data: p, error }, { data: inst }]) => {
      if (error || !p) { setFout('Project niet gevonden.'); setLoading(false); return }
      setProject(p)
      setInstelling(inst ?? null)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return <div className="p-8 text-sm text-gray-400">Laden...</div>
  }
  if (fout || !project) {
    return <div className="p-8 text-sm text-red-500">{fout || 'Project niet gevonden.'}</div>
  }

  const klantNaam = project.klanten?.bedrijfsnaam || project.klanten?.naam || '—'
  const vandaag = new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(`/projecten/${id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ChevronLeft size={14} /> Terug naar project
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Blanco huisstijl briefing</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Print dit document uit — de klant vult het samen met de ontwerper in.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
          style={{ background: '#185FA5' }}
        >
          <Printer size={14} /> Afdrukken
        </button>
      </div>

      {createPortal(
        <div className="hb-print">
          <div className="hb-balk" />

          <div className="hb-header">
            <img src={instelling?.logo_url || '/logo-byt.png'} alt="Logo" className="hb-logo" />
            <div>
              <h1>Huisstijl Briefing</h1>
              <p className="hb-subtitel">Vul dit document in samen met uw ontwerper</p>
            </div>
          </div>

          <div className="hb-meta">
            <div><strong>Datum:</strong> {vandaag}</div>
            <div><strong>Projectnaam:</strong> {project.naam}</div>
            <div><strong>Klantnaam:</strong> {klantNaam}</div>
          </div>

          <h2>1. Kleuren</h2>
          <div className="hb-kleuren">
            {KLEUREN.map(label => (
              <div className="hb-kleurvak" key={label}>
                <div className="hb-swatch-leeg" />
                <p className="hb-kleur-label">{label}</p>
                <p className="hb-veld">HEX: <span className="hb-lijn" /></p>
                <p className="hb-veld">RGB: <span className="hb-lijn" /></p>
                <p className="hb-veld">CMYK: <span className="hb-lijn" /></p>
                <p className="hb-veld">Naam kleur: <span className="hb-lijn" /></p>
              </div>
            ))}
          </div>
          <p className="hb-label-vrij">Opmerkingen kleuren:</p>
          <div className="hb-schrijfkader">
            <div className="hb-schrijflijn" />
            <div className="hb-schrijflijn" />
            <div className="hb-schrijflijn" />
            <div className="hb-schrijflijn" />
          </div>

          <h2>2. Typografie</h2>
          <div className="hb-typo-blok">
            <p className="hb-font-titel">Titelfont</p>
            <p className="hb-veld">Naam font: <span className="hb-lijn hb-lijn-lang" /></p>
            <div className="hb-veld-dubbel">
              <span>Gewicht: <span className="hb-lijn" /></span>
              <span>Grootte: <span className="hb-lijn" /></span>
            </div>
          </div>
          <div className="hb-typo-blok">
            <p className="hb-font-titel">Broodtekstfont</p>
            <p className="hb-veld">Naam font: <span className="hb-lijn hb-lijn-lang" /></p>
            <p className="hb-veld">Grootte: <span className="hb-lijn" /></p>
          </div>
          <p className="hb-label-vrij">Voorbeeld titeltekst:</p>
          <div className="hb-schrijfkader hb-schrijfkader-klein">
            <div className="hb-schrijflijn" />
          </div>

          <h2>3. Logo &amp; slogan</h2>
          <p className="hb-label-vrij">Logo (plak hier een voorbeeld of noteer "zie bijlage"):</p>
          <div className="hb-logovak" />
          <p className="hb-veld">Slogan: <span className="hb-lijn hb-lijn-lang" /></p>

          <h2>4. Bedrijfsprofiel</h2>
          <p className="hb-veld">Sector: <span className="hb-lijn hb-lijn-lang" /></p>
          <p className="hb-label-vrij">Gewenste stijl / sfeer (bv. professioneel, speels, minimalistisch):</p>
          <div className="hb-schrijfkader">
            <div className="hb-schrijflijn" />
            <div className="hb-schrijflijn" />
          </div>

          <h2>5. Contactgegevens (voor briefpapier &amp; visitekaartjes)</h2>
          <div className="hb-contact-grid">
            <p className="hb-veld">Adres: <span className="hb-lijn" /></p>
            <p className="hb-veld">BTW-nummer: <span className="hb-lijn" /></p>
            <p className="hb-veld">IBAN: <span className="hb-lijn" /></p>
            <p className="hb-veld">E-mail: <span className="hb-lijn" /></p>
            <p className="hb-veld">Telefoon: <span className="hb-lijn" /></p>
            <p className="hb-veld">Website: <span className="hb-lijn" /></p>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
