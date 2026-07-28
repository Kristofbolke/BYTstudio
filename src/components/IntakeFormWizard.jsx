// IntakeFormWizard.jsx — Gedeelde 6-staps wizard voor intern tabblad en publieke pagina
import { useState } from 'react'
import { CheckCircle, Plus, Trash2 } from 'lucide-react'

// ── Kleuren ───────────────────────────────────────────────────────────────────
const C = {
  green:    '#22C35D',
  green600: '#17A84B',
  ink:      '#0B0F0E',
  g200:     '#D5DAD8',
  g400:     '#929996',
  g700:     '#373C39',
  paper:    '#F4F6F5',
  red:      '#e53e3e',
}

// ── Staplabels ────────────────────────────────────────────────────────────────
const STAP_LABELS = [
  'Het bedrijf',
  'Problematiek',
  'De app',
  'Features',
  'IT-situatie',
  'Doelgroep',
]

// ── Dropdown-opties ───────────────────────────────────────────────────────────
const OPT_ONDVORM   = ['Eenmanszaak', 'BV', 'VZW', 'Andere']
const OPT_MEDEW     = ['1', '2-5', '6-20', '21-50', '50+']
const OPT_TYPE_APP  = ['Webapp', 'PWA / mobiele app', 'Dashboard', 'Interne tool', 'Klantportaal', 'Andere']
const OPT_PRIORITEIT = ['Dringend', 'Komende 3 maanden', 'Geen haast', 'Verkennend']
const OPT_TECH_KENNIS = ['Geen', 'Basis', 'Gevorderd', 'Eigen IT-dienst']
const OPT_HOSTING   = ['Geen voorkeur', 'Bestaande hosting behouden', 'Advies gewenst']
const OPT_BUDGET    = ['< 2.500 €', '2.500 – 5.000 €', '5.000 – 10.000 €', '10.000 € +', 'Nog te bepalen']
const OPT_TECH_VAARD = ['Laag', 'Gemiddeld', 'Hoog', 'Gemengd']
const OPT_GEBR_TYPE = ['Intern personeel', 'Klanten', 'Leveranciers', 'Publiek / iedereen']
const OPT_DEVICES   = ['Desktop', 'Tablet', 'Smartphone']
const OPT_TALEN     = ['NL', 'FR', 'EN', 'DE']

// ── Formulier initialiseren vanuit DB-rij ─────────────────────────────────────
function initForm(intake) {
  return {
    bedrijfsnaam:                     intake?.bedrijfsnaam ?? '',
    ondernemingsvorm:                 intake?.ondernemingsvorm ?? '',
    sector:                           intake?.sector ?? '',
    aantal_medewerkers:               intake?.aantal_medewerkers ?? '',
    contactpersoon_naam:              intake?.contactpersoon_naam ?? '',
    contactpersoon_functie:           intake?.contactpersoon_functie ?? '',
    contactpersoon_email:             intake?.contactpersoon_email ?? '',
    contactpersoon_telefoon:          intake?.contactpersoon_telefoon ?? '',
    website:                          intake?.website ?? '',
    adres:                            intake?.adres ?? '',
    huidige_werkwijze:                intake?.huidige_werkwijze ?? '',
    grootste_pijnpunt:                intake?.grootste_pijnpunt ?? '',
    tijd_verloren:                    intake?.tijd_verloren ?? '',
    gevolg_bij_niet_oplossen:         intake?.gevolg_bij_niet_oplossen ?? '',
    eerdere_pogingen:                 intake?.eerdere_pogingen ?? '',
    type_app:                         intake?.type_app ?? '',
    omschrijving_app:                 intake?.omschrijving_app ?? '',
    vergelijkbaar_voorbeeld:          intake?.vergelijkbaar_voorbeeld ?? '',
    prioriteit:                       intake?.prioriteit ?? '',
    features:                         intake?.features ?? [],
    huidige_tools:                    intake?.huidige_tools ?? '',
    bestaande_data:                   intake?.bestaande_data ?? '',
    benodigde_integraties:            intake?.benodigde_integraties ?? '',
    technische_kennis_bedrijf:        intake?.technische_kennis_bedrijf ?? '',
    hosting_voorkeur:                 intake?.hosting_voorkeur ?? '',
    budget_indicatie:                 intake?.budget_indicatie ?? '',
    gebruikers_type:                  intake?.gebruikers_type
                                        ? intake.gebruikers_type.split(', ').filter(Boolean)
                                        : [],
    aantal_gebruikers:                intake?.aantal_gebruikers ?? '',
    technische_vaardigheid_gebruikers: intake?.technische_vaardigheid_gebruikers ?? '',
    devices:                          intake?.devices ?? [],
    talen:                            intake?.talen ?? [],
    notities_intern:                  intake?.notities_intern ?? '',
  }
}

// ── Formulier naar DB-formaat ─────────────────────────────────────────────────
function formNaarDb(form) {
  return {
    bedrijfsnaam:                     form.bedrijfsnaam || null,
    ondernemingsvorm:                 form.ondernemingsvorm || null,
    sector:                           form.sector || null,
    aantal_medewerkers:               form.aantal_medewerkers || null,
    contactpersoon_naam:              form.contactpersoon_naam || null,
    contactpersoon_functie:           form.contactpersoon_functie || null,
    contactpersoon_email:             form.contactpersoon_email || null,
    contactpersoon_telefoon:          form.contactpersoon_telefoon || null,
    website:                          form.website || null,
    adres:                            form.adres || null,
    huidige_werkwijze:                form.huidige_werkwijze || null,
    grootste_pijnpunt:                form.grootste_pijnpunt || null,
    tijd_verloren:                    form.tijd_verloren || null,
    gevolg_bij_niet_oplossen:         form.gevolg_bij_niet_oplossen || null,
    eerdere_pogingen:                 form.eerdere_pogingen || null,
    type_app:                         form.type_app || null,
    omschrijving_app:                 form.omschrijving_app || null,
    vergelijkbaar_voorbeeld:          form.vergelijkbaar_voorbeeld || null,
    prioriteit:                       form.prioriteit || null,
    features:                         form.features,
    huidige_tools:                    form.huidige_tools || null,
    bestaande_data:                   form.bestaande_data || null,
    benodigde_integraties:            form.benodigde_integraties || null,
    technische_kennis_bedrijf:        form.technische_kennis_bedrijf || null,
    hosting_voorkeur:                 form.hosting_voorkeur || null,
    budget_indicatie:                 form.budget_indicatie || null,
    gebruikers_type:                  form.gebruikers_type.length ? form.gebruikers_type.join(', ') : null,
    aantal_gebruikers:                form.aantal_gebruikers || null,
    technische_vaardigheid_gebruikers: form.technische_vaardigheid_gebruikers || null,
    devices:                          form.devices.length ? form.devices : null,
    talen:                            form.talen.length ? form.talen : null,
    notities_intern:                  form.notities_intern || null,
    updated_at:                       new Date().toISOString(),
  }
}

// ── Stap-indicator ────────────────────────────────────────────────────────────
function StapIndicator({ huidig }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STAP_LABELS.map((_, i) => {
          const gedaan = i < huidig
          const actief = i === huidig
          const randKleur = gedaan ? C.green600 : actief ? C.green : C.g200
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 5 ? 1 : 'none' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: gedaan ? C.green600 : actief ? C.green : C.paper,
                border: `2px solid ${randKleur}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: (gedaan || actief) ? '#fff' : C.g400,
              }}>
                {gedaan ? <CheckCircle size={13} /> : i + 1}
              </div>
              {i < 5 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 3px',
                  background: gedaan ? C.green600 : C.g200,
                }} />
              )}
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 12, color: C.g400, marginTop: 8, marginBottom: 0 }}>
        Stap {Math.min(huidig + 1, 6)} van 6 —{' '}
        <strong style={{ color: C.g700 }}>
          {huidig < 6 ? STAP_LABELS[huidig] : 'Overzicht'}
        </strong>
      </p>
    </div>
  )
}

// ── Hulpcomponenten ───────────────────────────────────────────────────────────
const INP = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: `1.5px solid ${C.g200}`, fontSize: 14, outline: 'none',
  fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box', color: C.ink,
}
const TA = { ...INP, resize: 'vertical', minHeight: 100 }

function Veld({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.g700, marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 12, color: C.g400, marginBottom: 6, marginTop: 0 }}>{hint}</p>}
      {children}
    </div>
  )
}

function SelectVeld({ label, required, value, onChange, opties, placeholder = '— Kies een optie —' }) {
  return (
    <Veld label={label} required={required}>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...INP, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
        >
          <option value="">{placeholder}</option>
          {opties.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.g400 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
      </div>
    </Veld>
  )
}

function CheckOptie({ label, actief, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
        border: `1.5px solid ${actief ? C.green : C.g200}`,
        background: actief ? '#E9F9EF' : '#fff',
        color: actief ? C.green600 : C.g700,
        fontWeight: actief ? 600 : 400,
        width: '100%', textAlign: 'left', fontFamily: 'inherit',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `1.5px solid ${actief ? C.green : C.g200}`,
        background: actief ? C.green : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {actief && <CheckCircle size={10} color="#fff" />}
      </span>
      {label}
    </button>
  )
}

// ── Feature-rij (stap 4) ──────────────────────────────────────────────────────
function FeatureRij({ feature, onChange, onVerwijder }) {
  return (
    <div style={{
      border: `1.5px solid ${C.g200}`, borderRadius: 12, padding: 16,
      marginBottom: 12, background: C.paper, position: 'relative',
    }}>
      <button
        type="button"
        onClick={onVerwijder}
        title="Verwijder feature"
        style={{
          position: 'absolute', top: 10, right: 10, background: 'none',
          border: 'none', cursor: 'pointer', color: C.g400, padding: 4, lineHeight: 1,
        }}
      >
        <Trash2 size={14} />
      </button>
      <div style={{ marginBottom: 10, paddingRight: 28 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.g400, display: 'block', marginBottom: 5 }}>Naam</label>
        <input
          value={feature.naam}
          onChange={e => onChange({ ...feature, naam: e.target.value })}
          placeholder="bv. Gebruikersbeheer"
          style={INP}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.g400, display: 'block', marginBottom: 5 }}>Beschrijving (optioneel)</label>
        <textarea
          value={feature.beschrijving}
          onChange={e => onChange({ ...feature, beschrijving: e.target.value })}
          placeholder="Wat moet deze feature doen?"
          rows={2}
          style={{ ...TA, minHeight: 60 }}
        />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.g400, display: 'block', marginBottom: 5 }}>Prioriteit</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ val: 'must', lbl: 'Must-have' }, { val: 'nice', lbl: 'Nice-to-have' }].map(opt => (
            <button
              key={opt.val}
              type="button"
              onClick={() => onChange({ ...feature, prioriteit: opt.val })}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                border: `1.5px solid ${feature.prioriteit === opt.val ? C.green : C.g200}`,
                background: feature.prioriteit === opt.val ? '#E9F9EF' : '#fff',
                color: feature.prioriteit === opt.val ? C.green600 : C.g700,
                fontWeight: feature.prioriteit === opt.val ? 600 : 400,
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >{opt.lbl}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Overzichtsrij ─────────────────────────────────────────────────────────────
function OvRij({ label, waarde }) {
  const leeg = !waarde || (Array.isArray(waarde) && waarde.length === 0)
  if (leeg) return null
  return (
    <div style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: `1px solid ${C.g200}` }}>
      <span style={{ fontSize: 13, color: C.g400, width: 180, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: C.g700, flex: 1, wordBreak: 'break-word' }}>
        {Array.isArray(waarde) ? waarde.join(', ') : waarde}
      </span>
    </div>
  )
}

function OvSectie({ titel, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.green600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, marginTop: 0 }}>
        {titel}
      </p>
      {children}
    </div>
  )
}

// ── Validatie per stap ────────────────────────────────────────────────────────
function valideer(stap, form) {
  if (stap === 0 && !form.bedrijfsnaam.trim()) return 'Bedrijfsnaam is verplicht.'
  if (stap === 1 && !form.grootste_pijnpunt.trim()) return 'Beschrijf het grootste pijnpunt.'
  if (stap === 2 && !form.omschrijving_app.trim()) return 'Geef een omschrijving van de gewenste app.'
  if (stap === 3 && form.features.length === 0) return 'Voeg minstens één feature toe.'
  return ''
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function IntakeFormWizard({ intake, onSave, onSubmit, isPublic }) {
  const [stap, setStap] = useState(0)          // 0-5 = formulierstappen, 6 = overzicht
  const [form, setForm] = useState(() => initForm(intake))
  const [fout, setFout] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitFout, setSubmitFout] = useState('')
  const [verstuurd, setVerstuurd] = useState(intake?.status === 'submitted')

  function stel(veld, waarde) {
    setForm(f => ({ ...f, [veld]: waarde }))
  }

  function toggleArray(veld, waarde) {
    setForm(f => {
      const huidig = f[veld] ?? []
      return { ...f, [veld]: huidig.includes(waarde) ? huidig.filter(v => v !== waarde) : [...huidig, waarde] }
    })
  }

  function voegFeatureToe() {
    setForm(f => ({
      ...f,
      features: [...f.features, { id: crypto.randomUUID(), naam: '', beschrijving: '', prioriteit: 'must' }],
    }))
  }

  function wijzigFeature(id, updated) {
    setForm(f => ({ ...f, features: f.features.map(ft => ft.id === id ? updated : ft) }))
  }

  function verwijderFeature(id) {
    setForm(f => ({ ...f, features: f.features.filter(ft => ft.id !== id) }))
  }

  async function autosave(huidigeForm) {
    setSaving(true)
    await onSave(formNaarDb(huidigeForm))
    setSaving(false)
    setSavedMsg('Opgeslagen')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  async function volgende() {
    const err = valideer(stap, form)
    if (err) { setFout(err); return }
    setFout('')
    await autosave(form)
    setStap(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function vorige() {
    setFout('')
    await autosave(form)
    setStap(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function verstuur() {
    setSubmitFout('')
    setSubmitting(true)
    const { error } = await onSubmit(formNaarDb(form))
    setSubmitting(false)
    if (error) { setSubmitFout('Er ging iets mis. Probeer het opnieuw.'); return }
    setVerstuurd(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Bedankscherm ────────────────────────────────────────────────────────────
  if (verstuurd) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <img src="/assets/mark/mark-tile.svg" alt="" style={{ width: 56, height: 56, marginBottom: 20, opacity: 0.9 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 10 }}>
          {isPublic ? 'Bedankt voor je antwoorden!' : 'Formulier ingediend'}
        </h2>
        <p style={{ fontSize: 15, color: C.g400, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 24px' }}>
          {isPublic
            ? 'We hebben je ingevulde intakeformulier goed ontvangen en nemen zo snel mogelijk contact met je op.'
            : 'De intake is als "ingediend" gemarkeerd. Je vindt de gegevens terug in het Intake-tabblad.'
          }
        </p>
        {isPublic && (
          <div style={{ fontSize: 13, color: C.g400 }}>
            Vragen?{' '}
            <a href="mailto:info@buildyourtools.be" style={{ color: C.green600, fontWeight: 600 }}>
              info@buildyourtools.be
            </a>
          </div>
        )}
      </div>
    )
  }

  // ── Overzicht (stap 6) ──────────────────────────────────────────────────────
  if (stap === 6) {
    return (
      <div>
        <StapIndicator huidig={6} />

        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 20, marginTop: 0 }}>
          Controleer je antwoorden
        </h3>

        <OvSectie titel="1. Het bedrijf">
          <OvRij label="Bedrijfsnaam" waarde={form.bedrijfsnaam} />
          <OvRij label="Ondernemingsvorm" waarde={form.ondernemingsvorm} />
          <OvRij label="Sector" waarde={form.sector} />
          <OvRij label="Medewerkers" waarde={form.aantal_medewerkers} />
          <OvRij label="Contactpersoon" waarde={[form.contactpersoon_naam, form.contactpersoon_functie].filter(Boolean).join(', ')} />
          <OvRij label="E-mail" waarde={form.contactpersoon_email} />
          <OvRij label="Telefoon" waarde={form.contactpersoon_telefoon} />
          <OvRij label="Website" waarde={form.website} />
        </OvSectie>

        <OvSectie titel="2. De problematiek">
          <OvRij label="Huidige werkwijze" waarde={form.huidige_werkwijze} />
          <OvRij label="Grootste pijnpunt" waarde={form.grootste_pijnpunt} />
          <OvRij label="Tijdverlies" waarde={form.tijd_verloren} />
          <OvRij label="Gevolg" waarde={form.gevolg_bij_niet_oplossen} />
        </OvSectie>

        <OvSectie titel="3. De gewenste app">
          <OvRij label="Type" waarde={form.type_app} />
          <OvRij label="Omschrijving" waarde={form.omschrijving_app} />
          <OvRij label="Prioriteit" waarde={form.prioriteit} />
        </OvSectie>

        <OvSectie titel="4. Features">
          {form.features.map((f, i) => (
            <div key={f.id} style={{ padding: '6px 0', borderBottom: `1px solid ${C.g200}` }}>
              <span style={{ fontSize: 13, color: C.g700, fontWeight: 600 }}>{i + 1}. {f.naam || '(naamloos)'}</span>
              {f.beschrijving && <span style={{ fontSize: 12, color: C.g400, marginLeft: 8 }}>{f.beschrijving}</span>}
              <span style={{
                marginLeft: 10, fontSize: 11, fontWeight: 700,
                color: f.prioriteit === 'must' ? C.green600 : C.g400,
                textTransform: 'uppercase',
              }}>
                {f.prioriteit === 'must' ? 'Must' : 'Nice'}
              </span>
            </div>
          ))}
        </OvSectie>

        <OvSectie titel="5. IT-situatie">
          <OvRij label="Huidige tools" waarde={form.huidige_tools} />
          <OvRij label="Bestaande data" waarde={form.bestaande_data} />
          <OvRij label="Integraties" waarde={form.benodigde_integraties} />
          <OvRij label="Technische kennis" waarde={form.technische_kennis_bedrijf} />
          <OvRij label="Hosting" waarde={form.hosting_voorkeur} />
          <OvRij label="Budget" waarde={form.budget_indicatie} />
        </OvSectie>

        <OvSectie titel="6. Doelgroep">
          <OvRij label="Gebruikers" waarde={form.gebruikers_type} />
          <OvRij label="Aantal" waarde={form.aantal_gebruikers} />
          <OvRij label="Technisch niveau" waarde={form.technische_vaardigheid_gebruikers} />
          <OvRij label="Apparaten" waarde={form.devices} />
          <OvRij label="Talen" waarde={form.talen} />
        </OvSectie>

        {submitFout && (
          <p style={{ fontSize: 13, color: C.red, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            {submitFout}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
          <button
            type="button"
            onClick={() => setStap(5)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${C.g200}`,
              background: '#fff', fontSize: 14, fontWeight: 600, color: C.g700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ← Vorige
          </button>
          <button
            type="button"
            onClick={verstuur}
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 28px', borderRadius: 10, border: 'none',
              background: C.green, color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            <CheckCircle size={16} />
            {submitting ? 'Versturen...' : 'Versturen'}
          </button>
        </div>
      </div>
    )
  }

  // ── Navigatieknoppen ──────────────────────────────────────────────────────────
  const Nav = (
    <div>
      {fout && (
        <p style={{ fontSize: 13, color: C.red, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          {fout}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
        <div style={{ display: 'flex', align: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={vorige}
            disabled={stap === 0 || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${C.g200}`,
              background: '#fff', fontSize: 14, fontWeight: 600, color: C.g700,
              cursor: (stap === 0 || saving) ? 'not-allowed' : 'pointer',
              opacity: stap === 0 ? 0.4 : 1, fontFamily: 'inherit',
            }}
          >
            ← Vorige
          </button>
          {savedMsg && (
            <span style={{ fontSize: 12, color: C.green600, alignSelf: 'center', fontWeight: 500 }}>
              ✓ {savedMsg}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={volgende}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: C.green, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Opslaan...' : stap === 5 ? 'Bekijk overzicht →' : 'Volgende →'}
        </button>
      </div>
    </div>
  )

  // ── Stap 0: Het bedrijf ───────────────────────────────────────────────────────
  const Stap0 = (
    <div>
      <Veld label="Bedrijfsnaam" required>
        <input value={form.bedrijfsnaam} onChange={e => stel('bedrijfsnaam', e.target.value)} style={INP} placeholder="bv. Mijn Bedrijf BV" />
      </Veld>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SelectVeld label="Ondernemingsvorm" value={form.ondernemingsvorm} onChange={v => stel('ondernemingsvorm', v)} opties={OPT_ONDVORM} />
        <SelectVeld label="Aantal medewerkers" value={form.aantal_medewerkers} onChange={v => stel('aantal_medewerkers', v)} opties={OPT_MEDEW} />
      </div>
      <Veld label="Sector">
        <input value={form.sector} onChange={e => stel('sector', e.target.value)} style={INP} placeholder="bv. Horeca, Bouw, Zorg..." />
      </Veld>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Veld label="Contactpersoon naam">
          <input value={form.contactpersoon_naam} onChange={e => stel('contactpersoon_naam', e.target.value)} style={INP} placeholder="Voornaam Achternaam" />
        </Veld>
        <Veld label="Functie">
          <input value={form.contactpersoon_functie} onChange={e => stel('contactpersoon_functie', e.target.value)} style={INP} placeholder="bv. Zaakvoerder" />
        </Veld>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Veld label="E-mail">
          <input type="email" value={form.contactpersoon_email} onChange={e => stel('contactpersoon_email', e.target.value)} style={INP} placeholder="naam@bedrijf.be" />
        </Veld>
        <Veld label="Telefoon">
          <input type="tel" value={form.contactpersoon_telefoon} onChange={e => stel('contactpersoon_telefoon', e.target.value)} style={INP} placeholder="+32 4..." />
        </Veld>
      </div>
      <Veld label="Website (optioneel)">
        <input value={form.website} onChange={e => stel('website', e.target.value)} style={INP} placeholder="https://www.uw-bedrijf.be" />
      </Veld>
      <Veld label="Adres (optioneel)">
        <input value={form.adres} onChange={e => stel('adres', e.target.value)} style={INP} placeholder="Straat 1, 1000 Brussel" />
      </Veld>
    </div>
  )

  // ── Stap 1: De problematiek ───────────────────────────────────────────────────
  const Stap1 = (
    <div>
      <Veld label="Hoe verloopt dit vandaag?" hint="Beschrijf de huidige situatie of werkwijze.">
        <textarea value={form.huidige_werkwijze} onChange={e => stel('huidige_werkwijze', e.target.value)} rows={4} style={TA} placeholder="Vandaag werken we met Excel, we sturen manueel e-mails naar klanten..." />
      </Veld>
      <Veld label="Wat is het grootste pijnpunt?" required>
        <textarea value={form.grootste_pijnpunt} onChange={e => stel('grootste_pijnpunt', e.target.value)} rows={4} style={TA} placeholder="Het kost ons veel tijd om... We verliezen overzicht over..." />
      </Veld>
      <Veld label="Hoeveel tijd gaat hier per week/maand aan verloren?">
        <input value={form.tijd_verloren} onChange={e => stel('tijd_verloren', e.target.value)} style={INP} placeholder="bv. 5 uur per week, 2 dagen per maand..." />
      </Veld>
      <Veld label="Wat gebeurt er als dit niet wordt opgelost?">
        <textarea value={form.gevolg_bij_niet_oplossen} onChange={e => stel('gevolg_bij_niet_oplossen', e.target.value)} rows={3} style={TA} placeholder="We riskeren fouten, klanten vertrekken, groei stagneert..." />
      </Veld>
      <Veld label="Zijn er al eerdere pogingen geweest om dit op te lossen? (optioneel)">
        <textarea value={form.eerdere_pogingen} onChange={e => stel('eerdere_pogingen', e.target.value)} rows={3} style={TA} placeholder="We hebben al geprobeerd met... maar dat werkte niet omdat..." />
      </Veld>
    </div>
  )

  // ── Stap 2: De gewenste app ───────────────────────────────────────────────────
  const Stap2 = (
    <div>
      <SelectVeld label="Type app" value={form.type_app} onChange={v => stel('type_app', v)} opties={OPT_TYPE_APP} />
      <Veld label="Korte omschrijving van wat de app moet doen" required>
        <textarea value={form.omschrijving_app} onChange={e => stel('omschrijving_app', e.target.value)} rows={5} style={TA} placeholder="De app moet onze medewerkers helpen om... Klanten moeten kunnen... Het systeem moet automatisch..." />
      </Veld>
      <Veld label="Is er een vergelijkbare app of tool als voorbeeld? (optioneel)">
        <input value={form.vergelijkbaar_voorbeeld} onChange={e => stel('vergelijkbaar_voorbeeld', e.target.value)} style={INP} placeholder="bv. Trello, Exact Online, een specifieke website..." />
      </Veld>
      <SelectVeld label="Prioriteit / timing" value={form.prioriteit} onChange={v => stel('prioriteit', v)} opties={OPT_PRIORITEIT} />
    </div>
  )

  // ── Stap 3: Features ──────────────────────────────────────────────────────────
  const Stap3 = (
    <div>
      <p style={{ fontSize: 13, color: C.g400, marginBottom: 16, marginTop: 0 }}>
        Voeg de gewenste functies toe. Markeer elke feature als <strong>must-have</strong> (absoluut nodig) of <strong>nice-to-have</strong> (zou leuk zijn).
      </p>
      {form.features.map(ft => (
        <FeatureRij
          key={ft.id}
          feature={ft}
          onChange={updated => wijzigFeature(ft.id, updated)}
          onVerwijder={() => verwijderFeature(ft.id)}
        />
      ))}
      <button
        type="button"
        onClick={voegFeatureToe}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          border: `1.5px dashed ${C.green}`, background: '#E9F9EF',
          color: C.green600, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          justifyContent: 'center',
        }}
      >
        <Plus size={15} /> Feature toevoegen
      </button>
      {fout && form.features.length === 0 && (
        <p style={{ fontSize: 12, color: C.red, marginTop: 8 }}>Voeg minstens één feature toe.</p>
      )}
    </div>
  )

  // ── Stap 4: IT-situatie ───────────────────────────────────────────────────────
  const Stap4 = (
    <div>
      <Veld label="Welke software / tools worden nu gebruikt?">
        <textarea value={form.huidige_tools} onChange={e => stel('huidige_tools', e.target.value)} rows={3} style={TA} placeholder="bv. Excel, Outlook, Exact Online, Teamleader..." />
      </Veld>
      <Veld label="Bestaat er al data die moet worden overgenomen?">
        <textarea value={form.bestaande_data} onChange={e => stel('bestaande_data', e.target.value)} rows={3} style={TA} placeholder="bv. Excel-lijsten met klanten, exports uit huidig systeem..." />
      </Veld>
      <Veld label="Zijn er integraties nodig met andere systemen?">
        <textarea value={form.benodigde_integraties} onChange={e => stel('benodigde_integraties', e.target.value)} rows={3} style={TA} placeholder="bv. koppeling met boekhouding, CRM, betaalprovider, Mollie..." />
      </Veld>
      <SelectVeld label="Technische kennis binnen het bedrijf" value={form.technische_kennis_bedrijf} onChange={v => stel('technische_kennis_bedrijf', v)} opties={OPT_TECH_KENNIS} />
      <SelectVeld label="Hostingvoorkeur" value={form.hosting_voorkeur} onChange={v => stel('hosting_voorkeur', v)} opties={OPT_HOSTING} />
      <SelectVeld label="Budgetindicatie" value={form.budget_indicatie} onChange={v => stel('budget_indicatie', v)} opties={OPT_BUDGET} />
    </div>
  )

  // ── Stap 5: Doelgroep ─────────────────────────────────────────────────────────
  const Stap5 = (
    <div>
      <Veld label="Wie gebruikt de app?" hint="Meerdere opties mogelijk">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {OPT_GEBR_TYPE.map(o => (
            <CheckOptie key={o} label={o} actief={form.gebruikers_type.includes(o)} onClick={() => toggleArray('gebruikers_type', o)} />
          ))}
        </div>
      </Veld>
      <Veld label="Geschat aantal gebruikers">
        <input value={form.aantal_gebruikers} onChange={e => stel('aantal_gebruikers', e.target.value)} style={INP} placeholder="bv. 5, 20-50, meer dan 100..." />
      </Veld>
      <SelectVeld label="Technische vaardigheid van de gebruikers" value={form.technische_vaardigheid_gebruikers} onChange={v => stel('technische_vaardigheid_gebruikers', v)} opties={OPT_TECH_VAARD} />
      <Veld label="Op welke apparaten?" hint="Meerdere opties mogelijk">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {OPT_DEVICES.map(o => {
            const actief = form.devices.includes(o)
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggleArray('devices', o)}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  border: `1.5px solid ${actief ? C.green : C.g200}`,
                  background: actief ? '#E9F9EF' : '#fff',
                  color: actief ? C.green600 : C.g700,
                  fontWeight: actief ? 600 : 400, fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {o}
              </button>
            )
          })}
        </div>
      </Veld>
      <Veld label="Taal / talen van de app" hint="Meerdere opties mogelijk">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {OPT_TALEN.map(o => {
            const actief = form.talen.includes(o)
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggleArray('talen', o)}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  border: `1.5px solid ${actief ? C.green : C.g200}`,
                  background: actief ? '#E9F9EF' : '#fff',
                  color: actief ? C.green600 : C.g700,
                  fontWeight: actief ? 600 : 400, fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {o}
              </button>
            )
          })}
        </div>
      </Veld>
      {!isPublic && (
        <Veld label="Interne notities (niet zichtbaar voor klant)">
          <textarea value={form.notities_intern} onChange={e => stel('notities_intern', e.target.value)} rows={3} style={TA} placeholder="Aandachtspunten, context uit het gesprek..." />
        </Veld>
      )}
    </div>
  )

  const stapInhoud = [Stap0, Stap1, Stap2, Stap3, Stap4, Stap5][stap]

  return (
    <div>
      <StapIndicator huidig={stap} />
      {stapInhoud}
      {Nav}
    </div>
  )
}
