// OfferteDetail.jsx — Detailpagina van één offerte
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ChevronLeft, Save, Trash2, CheckCircle,
  ChevronDown, Printer, Mail, Receipt, AlertTriangle,
} from 'lucide-react'
import '../styles/print.css'
import OfferteBuilder, {
  berekenBlok, berekenAlles, vlakItemsVoorFactuur,
} from '../components/OfferteBuilder'

// ── Constanten ───────────────────────────────────────────────────────────────
const STATUSSEN = [
  { key: 'concept',      label: 'Concept',      kleur: '#64748b', bg: '#f1f5f9' },
  { key: 'verzonden',    label: 'Verzonden',     kleur: '#2563eb', bg: '#dbeafe' },
  { key: 'goedgekeurd',  label: 'Goedgekeurd',  kleur: '#16a34a', bg: '#dcfce7' },
  { key: 'gefactureerd', label: 'Gefactureerd', kleur: '#7c3aed', bg: '#ede9fe' },
]
const EENHEDEN = ['uur', 'dag', 'stuk', 'forfait', 'maand', 'km', '%']

// ── Helpers ──────────────────────────────────────────────────────────────────
function isV2(items_json) {
  return !Array.isArray(items_json) && items_json?._v === 2
}
function fmt(n) { return Number(n).toFixed(2).replace('.', ',') }

function berekenItem(i) {
  return (Number(i.hoeveelheid) || 0) * (Number(i.eenheidsprijs) || 0)
}

function berekenTotalen(items, btw, marge) {
  const sub  = items.reduce((s, i) => s + berekenItem(i), 0)
  const mrgB = sub * (Number(marge) / 100)
  const excl = sub + mrgB
  const btwB = excl * (Number(btw) / 100)
  return { sub, mrgB, excl, btwB, incl: excl + btwB }
}

function formatDatum(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDatumKort(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-BE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const cfg = STATUSSEN.find(s => s.key === status) ?? STATUSSEN[0]
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.kleur }}>
      {cfg.label}
    </span>
  )
}

const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

// ── Regelitems tabel ─────────────────────────────────────────────────────────
function RegelItems({ items, onChange }) {
  function updateItem(idx, veld, waarde) {
    onChange(items.map((it, i) => i === idx ? { ...it, [veld]: waarde } : it))
  }
  function voegToe() {
    onChange([...items, { omschrijving: '', hoeveelheid: 1, eenheid: 'uur', eenheidsprijs: 0 }])
  }
  function verwijder(idx) {
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_80px_90px_110px_90px_32px] gap-2 px-1">
        {['Omschrijving','Aantal','Eenheid','Prijs/eenheid','Totaal',''].map(h => (
          <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
        ))}
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_80px_90px_110px_90px_32px] gap-2 items-center">
          <input value={item.omschrijving} onChange={e => updateItem(idx, 'omschrijving', e.target.value)}
            placeholder="Omschrijving..." className={inp} />
          <input type="number" min="0" value={item.hoeveelheid}
            onChange={e => updateItem(idx, 'hoeveelheid', e.target.value)}
            className={inp + ' text-right'} />
          <select value={item.eenheid} onChange={e => updateItem(idx, 'eenheid', e.target.value)}
            className={inp + ' appearance-none'}>
            {EENHEDEN.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input type="number" min="0" step="0.01" value={item.eenheidsprijs}
            onChange={e => updateItem(idx, 'eenheidsprijs', e.target.value)}
            className={inp + ' text-right'} />
          <p className="text-sm text-right font-medium text-gray-700 pr-1">
            € {fmt(berekenItem(item))}
          </p>
          <button type="button" onClick={() => verwijder(idx)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition text-lg font-bold">
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={voegToe}
        className="text-xs text-blue-500 hover:text-blue-700 font-semibold px-1 py-1 transition">
        + Regel toevoegen
      </button>
    </div>
  )
}

// ── Totaalblok (scherm) ───────────────────────────────────────────────────────
function TotaalBlok({ items, btw, marge }) {
  const t = berekenTotalen(items, btw, marge)
  return (
    <div className="bg-gray-50 rounded-xl px-5 py-4 space-y-2 text-sm max-w-xs ml-auto">
      <div className="flex justify-between text-gray-500">
        <span>Subtotaal</span><span>€ {fmt(t.sub)}</span>
      </div>
      {Number(marge) > 0 && (
        <div className="flex justify-between text-gray-500">
          <span>Marge ({marge}%)</span><span>€ {fmt(t.mrgB)}</span>
        </div>
      )}
      <div className="flex justify-between text-gray-600 font-medium border-t border-gray-200 pt-2">
        <span>Excl. BTW</span><span>€ {fmt(t.excl)}</span>
      </div>
      <div className="flex justify-between text-gray-500">
        <span>BTW ({btw}%)</span><span>€ {fmt(t.btwB)}</span>
      </div>
      <div className="flex justify-between text-gray-900 font-bold text-base border-t border-gray-300 pt-2">
        <span>Totaal incl. BTW</span><span>€ {fmt(t.incl)}</span>
      </div>
    </div>
  )
}

// ── Print layout v2 (builder blokken) ────────────────────────────────────────
function PrintLayoutV2({ offerte, form, instelling, klant, primairKleur }) {
  const ur = form.items_json.uurtarief ?? form.uurtarief ?? 75
  const blokken = (form.items_json.blokken ?? []).filter(b => b.actief)
  const { excl, btw: btwTotaal, incl } = berekenAlles(form.items_json.blokken ?? [], ur)
  const accent = primairKleur || '#185FA5'
  const fmtPrint = n => Number(n ?? 0).toFixed(2).replace('.', ',')

  const bedrijfAdresRegels = [
    instelling?.adres,
    [instelling?.postcode, instelling?.gemeente].filter(Boolean).join(' '),
  ].filter(Boolean)

  return (
    <div className="offerte-print" style={{ '--hs-primair': accent }}>
      <div className="op-header-balk" />
      <div className="op-header">
        <div>
          <div className="op-bedrijf-naam">{instelling?.bedrijfsnaam || 'Build Your Tools'}</div>
          <div className="op-bedrijf-details">
            {bedrijfAdresRegels.map((r, i) => <div key={i}>{r}</div>)}
            {instelling?.btw_nummer && <div>BTW: {instelling.btw_nummer}</div>}
            {instelling?.email     && <div>{instelling.email}</div>}
          </div>
        </div>
        <div className="op-offerte-blok">
          <div className="op-offerte-label">OFFERTE</div>
          <div className="op-offerte-meta">
            <div><strong>{form.offerte_nummer}</strong></div>
            <div>Datum: {new Date(offerte.aangemaakt_op).toLocaleDateString('nl-BE')}</div>
            {form.geldig_tot && <div>Geldig tot: {new Date(form.geldig_tot).toLocaleDateString('nl-BE')}</div>}
          </div>
        </div>
      </div>

      <hr className="op-divider" />

      <div className="op-partijen">
        <div className="op-partij">
          <div className="op-partij-label">Van</div>
          <div className="op-partij-content">
            <div className="naam">{instelling?.bedrijfsnaam || 'Build Your Tools'}</div>
            {bedrijfAdresRegels.map((r, i) => <div key={i}>{r}</div>)}
            {instelling?.btw_nummer && <div className="grijs">BTW: {instelling.btw_nummer}</div>}
          </div>
        </div>
        <div className="op-partij">
          <div className="op-partij-label">Aan</div>
          <div className="op-partij-content">
            {klant ? (
              <>
                <div className="naam">{klant.bedrijfsnaam || klant.naam}</div>
                {klant.adres && <div>{klant.adres}</div>}
                {klant.btw_nummer && <div className="grijs">BTW: {klant.btw_nummer}</div>}
              </>
            ) : <div className="grijs">— Geen klant —</div>}
          </div>
        </div>
      </div>

      {offerte.projecten?.naam && (
        <div className="op-betreft"><strong>Betreft:</strong> {offerte.projecten.naam}</div>
      )}

      {/* Eén tabel per actief blok */}
      {blokken.map(blok => {
        const t = berekenBlok(blok, ur)
        const actieveItems = blok.type === 'support'
          ? blok.pakketten?.filter(p => p.actief) ?? []
          : blok.items?.filter(i => i.actief) ?? []

        const urenSub = blok.type === 'ontwikkeling'
          ? actieveItems.filter(i => i.modus === 'uren').reduce((s, i) => s + (Number(i.waarde) || 0) * ur, 0)
          : 0

        return (
          <div key={blok.id} style={{ marginBottom: '5mm' }}>
            <div style={{
              fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: accent, borderBottom: `1px solid ${accent}`, paddingBottom: '1mm', marginBottom: '2mm',
            }}>
              {blok.label}
            </div>
            <table className="op-tabel">
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>Omschrijving</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Eenheid</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Aantal</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {blok.type === 'ontwikkeling' && actieveItems.map(item => {
                  const naam = item.isAndere && item.detail ? item.detail : item.label
                  let eenhStr = '', aantalStr = '', bedragStr = ''
                  if (item.modus === 'uren') {
                    eenhStr = `€ ${fmtPrint(ur)}/u`; aantalStr = `${item.waarde}u`
                    bedragStr = fmtPrint((Number(item.waarde) || 0) * ur)
                  } else if (item.modus === 'percentage') {
                    eenhStr = '% dev-uren'; aantalStr = `${item.waarde}%`
                    bedragStr = fmtPrint((Number(item.waarde) || 0) / 100 * urenSub)
                  } else {
                    eenhStr = `€ ${fmtPrint(item.eenheidsprijs)}/stuk`; aantalStr = String(item.waarde)
                    bedragStr = fmtPrint((Number(item.waarde) || 0) * (Number(item.eenheidsprijs) || 0))
                  }
                  return (
                    <tr key={item.id}>
                      <td>{naam}{item.detail && !item.isAndere ? <span style={{ color: '#888', fontSize: '8pt' }}> — {item.detail}</span> : null}</td>
                      <td style={{ textAlign: 'right' }}>{eenhStr}</td>
                      <td style={{ textAlign: 'right' }}>{aantalStr}</td>
                      <td style={{ textAlign: 'right' }}>€ {bedragStr}</td>
                    </tr>
                  )
                })}
                {blok.type === 'abonnement' && actieveItems.map(item => {
                  const naam = item.isAndere && item.detail ? item.detail : item.label
                  const beschr = item.detail && !item.isAndere ? `${naam} (${item.detail})` : naam
                  return (
                    <tr key={item.id}>
                      <td>{beschr}</td>
                      <td style={{ textAlign: 'right' }}>per maand</td>
                      <td style={{ textAlign: 'right' }}>1</td>
                      <td style={{ textAlign: 'right' }}>€ {fmtPrint(item.prijs)}</td>
                    </tr>
                  )
                })}
                {blok.type === 'support' && actieveItems.map(p => (
                  <tr key={p.id}>
                    <td>Support {p.label} — {p.omschrijving}</td>
                    <td style={{ textAlign: 'right' }}>per maand</td>
                    <td style={{ textAlign: 'right' }}>1</td>
                    <td style={{ textAlign: 'right' }}>€ {fmtPrint(p.prijs)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="rij-subtotaal">
                  <td colSpan="3">Subtotaal excl. BTW</td>
                  <td>€ {fmtPrint(t.subtotaal)}</td>
                </tr>
                <tr className="rij-btw">
                  <td colSpan="3">BTW ({blok.btw}%)</td>
                  <td>€ {fmtPrint(t.btwBedrag)}</td>
                </tr>
                <tr className="rij-totaal">
                  <td colSpan="3">Totaal {blok.label}</td>
                  <td>€ {fmtPrint(t.totaal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      })}

      {/* Eindtotaal */}
      {blokken.length > 1 && (
        <table className="op-tabel" style={{ marginTop: '4mm' }}>
          <tfoot>
            <tr className="rij-subtotaal">
              <td colSpan="3"><strong>Totaal excl. BTW</strong></td>
              <td>€ {fmtPrint(excl)}</td>
            </tr>
            <tr className="rij-btw">
              <td colSpan="3">BTW</td>
              <td>€ {fmtPrint(btwTotaal)}</td>
            </tr>
            <tr className="rij-totaal">
              <td colSpan="3"><strong>Totaal te betalen</strong></td>
              <td>€ {fmtPrint(incl)}</td>
            </tr>
          </tfoot>
        </table>
      )}

      <div className="op-handtekening">
        <div className="op-handtekening-blok">
          <div className="op-handtekening-lijn" />
          <div className="op-handtekening-label">Handtekening opdrachtgever — "Voor akkoord"</div>
        </div>
        <div className="op-handtekening-blok">
          <div className="op-handtekening-lijn" />
          <div className="op-handtekening-label">Datum</div>
        </div>
      </div>

      <div className="op-voettekst">
        <div className="op-voettekst-titel">Betalingsvoorwaarden</div>
        Betalingstermijn: 30 dagen na factuurdatum. Bij laattijdige betaling is van rechtswege een
        nalatigheidsintrest van 10% per jaar verschuldigd, alsook een forfaitaire schadevergoeding van €40.
        {instelling?.iban && <span> — IBAN: {instelling.iban}{instelling.bic ? ` — BIC: ${instelling.bic}` : ''}</span>}
      </div>
    </div>
  )
}

// ── Print layout v1 (flat items) ─────────────────────────────────────────────
function PrintLayout({ offerte, form, instelling, klant, primairKleur }) {
  if (isV2(form.items_json)) {
    return <PrintLayoutV2 offerte={offerte} form={form} instelling={instelling} klant={klant} primairKleur={primairKleur} />
  }

  const t = berekenTotalen(form.items_json, form.btw_percentage, form.marge_percentage)

  // Bedrijfsadres samengesteld
  const bedrijfAdresRegels = [
    instelling?.adres,
    [instelling?.postcode, instelling?.gemeente].filter(Boolean).join(' '),
    instelling?.land !== 'België' ? instelling?.land : null,
  ].filter(Boolean)

  // Klantadres
  const klantAdresRegels = [
    klant?.adres,
  ].filter(Boolean)

  const accent = primairKleur || '#185FA5'

  return (
    <div className="offerte-print" style={{ '--hs-primair': accent }}>
      {/* Accentlijn bovenaan (huisstijlkleur) */}
      <div className="op-header-balk" />

      {/* ── Documenthoofd ── */}
      <div className="op-header">
        {/* Links: BYT Studio gegevens */}
        <div>
          <div className="op-bedrijf-naam">
            {instelling?.bedrijfsnaam || 'Build Your Tools'}
          </div>
          <div className="op-bedrijf-details">
            {bedrijfAdresRegels.map((r, i) => <div key={i}>{r}</div>)}
            {instelling?.btw_nummer && <div>BTW: {instelling.btw_nummer}</div>}
            {instelling?.email     && <div>{instelling.email}</div>}
            {instelling?.telefoon  && <div>{instelling.telefoon}</div>}
          </div>
        </div>

        {/* Rechts: Offerte meta */}
        <div className="op-offerte-blok">
          <div className="op-offerte-label">OFFERTE</div>
          <div className="op-offerte-meta">
            <div><strong>{form.offerte_nummer}</strong></div>
            <div>Datum: {formatDatumKort(offerte.aangemaakt_op)}</div>
            {form.geldig_tot && (
              <div>Geldig tot: {formatDatumKort(form.geldig_tot)}</div>
            )}
          </div>
        </div>
      </div>

      <hr className="op-divider" />

      {/* ── Van / Aan ── */}
      <div className="op-partijen">
        {/* Van: BYT Studio */}
        <div className="op-partij">
          <div className="op-partij-label">Van</div>
          <div className="op-partij-content">
            <div className="naam">{instelling?.bedrijfsnaam || 'Build Your Tools'}</div>
            {bedrijfAdresRegels.map((r, i) => <div key={i}>{r}</div>)}
            {instelling?.btw_nummer && (
              <div className="grijs">BTW: {instelling.btw_nummer}</div>
            )}
            {instelling?.iban && (
              <div className="grijs">IBAN: {instelling.iban}</div>
            )}
            {instelling?.email && <div className="grijs">{instelling.email}</div>}
          </div>
        </div>

        {/* Aan: Klant */}
        <div className="op-partij">
          <div className="op-partij-label">Aan</div>
          <div className="op-partij-content">
            {klant ? (
              <>
                <div className="naam">
                  {klant.bedrijfsnaam || klant.naam}
                </div>
                {klant.bedrijfsnaam && klant.naam !== klant.bedrijfsnaam && (
                  <div>t.a.v. {klant.naam}</div>
                )}
                {klantAdresRegels.map((r, i) => <div key={i}>{r}</div>)}
                {klant.btw_nummer && (
                  <div className="grijs">BTW: {klant.btw_nummer}</div>
                )}
                {klant.email && <div className="grijs">{klant.email}</div>}
              </>
            ) : (
              <div className="grijs">— Geen klant gekoppeld —</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Betreft ── */}
      {offerte.projecten?.naam && (
        <div className="op-betreft">
          <strong>Betreft:</strong> {offerte.projecten.naam}
        </div>
      )}

      {/* ── Itemtabel ── */}
      <table className="op-tabel">
        <thead>
          <tr>
            <th style={{ width: '50%' }}>Omschrijving</th>
            <th style={{ width: '10%' }}>Aantal</th>
            <th style={{ width: '18%' }}>Tarief</th>
            <th style={{ width: '22%' }}>Totaal</th>
          </tr>
        </thead>
        <tbody>
          {form.items_json.map((item, idx) => (
            <tr key={idx}>
              <td>{item.omschrijving || '—'}</td>
              <td style={{ textAlign: 'right' }}>
                {item.hoeveelheid} {item.eenheid}
              </td>
              <td style={{ textAlign: 'right' }}>
                € {fmt(item.eenheidsprijs)}
              </td>
              <td style={{ textAlign: 'right' }}>
                € {fmt(berekenItem(item))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {/* Subtotaal */}
          <tr className="rij-subtotaal">
            <td colSpan="3">Subtotaal</td>
            <td>€ {fmt(t.sub)}</td>
          </tr>

          {/* Marge (optioneel) */}
          {Number(form.marge_percentage) > 0 && (
            <tr>
              <td colSpan="3">Marge ({form.marge_percentage}%)</td>
              <td>€ {fmt(t.mrgB)}</td>
            </tr>
          )}

          {/* Excl. BTW */}
          <tr>
            <td colSpan="3">Totaal excl. BTW</td>
            <td>€ {fmt(t.excl)}</td>
          </tr>

          {/* BTW */}
          <tr className="rij-btw">
            <td colSpan="3">BTW ({form.btw_percentage}%)</td>
            <td>€ {fmt(t.btwB)}</td>
          </tr>

          {/* Totaal incl. BTW */}
          <tr className="rij-totaal">
            <td colSpan="3">Totaal incl. BTW</td>
            <td>€ {fmt(t.incl)}</td>
          </tr>
        </tfoot>
      </table>

      {/* ── Handtekeningblok ── */}
      <div className="op-handtekening">
        <div className="op-handtekening-blok">
          <div className="op-handtekening-lijn" />
          <div className="op-handtekening-label">
            Handtekening opdrachtgever — "Voor akkoord"
          </div>
        </div>
        <div className="op-handtekening-blok">
          <div className="op-handtekening-lijn" />
          <div className="op-handtekening-label">
            Datum
          </div>
        </div>
      </div>

      {/* ── Voettekst ── */}
      <div className="op-voettekst">
        <div className="op-voettekst-titel">Betalingsvoorwaarden</div>
        Betalingstermijn: 30 dagen na factuurdatum. Bij laattijdige betaling is van
        rechtswege een nalatigheidsintrest van 10% per jaar verschuldigd, alsook een
        forfaitaire schadevergoeding van €40. Toepasselijk recht: Belgisch recht.
        {instelling?.iban && (
          <span> — IBAN: {instelling.iban}{instelling.bic ? ` — BIC: ${instelling.bic}` : ''}</span>
        )}
      </div>
    </div>
  )
}

// ── Hoofd component ──────────────────────────────────────────────────────────
export default function OfferteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [offerte, setOfferte]               = useState(null)
  const [klanten, setKlanten]               = useState([])
  const [projecten, setProjecten]           = useState([])
  const [instelling, setInstelling]         = useState(null)
  const [klantDetail, setKlantDetail]       = useState(null)
  const [huisstijlKleur, setHuisstijlKleur] = useState(null)
  const [loading, setLoading]               = useState(true)
  const [fout, setFout]                     = useState('')
  const [ok, setOk]                         = useState('')
  const [opslaan, setOpslaan]               = useState(false)
  const [bevestigVerwijder, setBevestigVerwijder]   = useState(false)
  const [bevestigFactuur,   setBevestigFactuur]     = useState(false)
  const [bezigFactuur,      setBezigFactuur]         = useState(false)
  const [statusLaden,       setStatusLaden]           = useState(false)
  const [form,              setForm]                  = useState(null)

  // ── Data laden ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      supabase
        .from('offertes')
        .select('*, klanten(id, naam, bedrijfsnaam, email, adres, btw_nummer, telefoon), projecten(id, naam)')
        .eq('id', id)
        .single(),
      supabase.from('klanten').select('id, naam, bedrijfsnaam').order('naam'),
      supabase.from('projecten').select('id, naam').order('naam'),
      supabase.from('instellingen').select('*').limit(1).single(),
    ]).then(([
      { data: o, error },
      { data: k },
      { data: p },
      { data: inst },
    ]) => {
      if (error || !o) { setFout('Offerte niet gevonden.'); setLoading(false); return }
      setOfferte(o)
      document.title = `${o.offerte_nummer ?? 'Offerte'} — BYT Studio`
      setKlantDetail(o.klanten ?? null)
      setInstelling(inst ?? null)
      const rawItems = o.items_json
      setForm({
        offerte_nummer:   o.offerte_nummer   ?? '',
        klant_id:         o.klant_id         ?? '',
        project_id:       o.project_id       ?? '',
        status:           o.status           ?? 'concept',
        geldig_tot:       o.geldig_tot       ?? '',
        btw_percentage:   o.btw_percentage   ?? 21,
        marge_percentage: o.marge_percentage ?? 0,
        notities:         o.notities         ?? '',
        uurtarief:        isV2(rawItems) ? (rawItems.uurtarief ?? o.uurtarief ?? 75) : (o.uurtarief ?? 75),
        items_json: isV2(rawItems)
          ? rawItems
          : Array.isArray(rawItems)
            ? rawItems
            : [{ omschrijving: '', hoeveelheid: 1, eenheid: 'uur', eenheidsprijs: 0 }],
      })
      setKlanten(k ?? [])
      setProjecten(p ?? [])
      setLoading(false)
    })
  }, [id])

  // ── Huisstijl laden bij project_id ──────────────────────────────────────────
  useEffect(() => {
    if (!offerte?.project_id) { setHuisstijlKleur(null); return }
    supabase
      .from('huisstijlen')
      .select('primaire_kleur')
      .eq('project_id', offerte.project_id)
      .maybeSingle()
      .then(({ data }) => setHuisstijlKleur(data?.primaire_kleur ?? null))
  }, [offerte?.project_id])

  // ── Klantdetails herladen bij klantwijziging ─────────────────────────────────
  useEffect(() => {
    if (!form?.klant_id) { setKlantDetail(null); return }
    supabase
      .from('klanten')
      .select('id, naam, bedrijfsnaam, email, adres, btw_nummer, telefoon')
      .eq('id', form.klant_id)
      .single()
      .then(({ data }) => setKlantDetail(data ?? null))
  }, [form?.klant_id])

  function stelIn(v, w) { setForm(f => ({ ...f, [v]: w })) }

  // ── Status direct opslaan ────────────────────────────────────────────────────
  async function handleStatusWijzig(nieuweStatus) {
    stelIn('status', nieuweStatus)
    setStatusLaden(true)
    await supabase
      .from('offertes')
      .update({ status: nieuweStatus, bijgewerkt_op: new Date().toISOString() })
      .eq('id', id)
    setStatusLaden(false)
  }

  // ── Opslaan ─────────────────────────────────────────────────────────────────
  async function handleOpslaan(e) {
    e.preventDefault()
    setOpslaan(true); setFout(''); setOk('')

    const opslaanItems = isV2(form.items_json)
      ? { ...form.items_json, uurtarief: Number(form.uurtarief) }
      : form.items_json

    const { error } = await supabase.from('offertes').update({
      offerte_nummer:   form.offerte_nummer,
      klant_id:         form.klant_id   || null,
      project_id:       form.project_id || null,
      status:           form.status,
      geldig_tot:       form.geldig_tot || null,
      uurtarief:        Number(form.uurtarief),
      btw_percentage:   isV2(form.items_json) ? 21 : Number(form.btw_percentage),
      marge_percentage: isV2(form.items_json) ? 0  : Number(form.marge_percentage),
      notities:         form.notities || null,
      items_json:       opslaanItems,
      bijgewerkt_op:    new Date().toISOString(),
    }).eq('id', id)
    setOpslaan(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    setOfferte(prev => ({ ...prev, ...form }))
    setOk('Wijzigingen opgeslagen.')
    setTimeout(() => setOk(''), 3000)
  }

  // ── Omzetten naar factuur ────────────────────────────────────────────────────
  async function zetOmNaarFactuur() {
    setBezigFactuur(true); setFout('')
    const jaar = new Date().getFullYear()
    const vandaag = new Date().toISOString().split('T')[0]

    // Genereer factuurnummer via COUNT
    const { count } = await supabase.from('facturen')
      .select('id', { count: 'exact', head: true })
      .gte('factuur_datum', `${jaar}-01-01`)
    const volg = String((count ?? 0) + 1).padStart(3, '0')
    const factuurNummer = `FACT-${jaar}-${volg}`

    // Vervaldatum
    const vervalDate = new Date()
    vervalDate.setDate(vervalDate.getDate() + (instelling?.betalingstermijn ?? 30))
    const vervalDatum = vervalDate.toISOString().split('T')[0]

    // Totalen — v1 of v2
    let factuurItems, subtotaal, btwBedrag, totaalIncl, hoofdBtw
    if (isV2(form.items_json)) {
      const ur = form.items_json.uurtarief ?? form.uurtarief ?? 75
      factuurItems = vlakItemsVoorFactuur(form.items_json.blokken, ur)
      const calc   = berekenAlles(form.items_json.blokken, ur)
      subtotaal    = calc.excl
      btwBedrag    = calc.btw
      totaalIncl   = calc.incl
      hoofdBtw     = form.items_json.blokken.find(b => b.actief)?.btw ?? 21
    } else {
      const t  = berekenTotalen(form.items_json, form.btw_percentage, form.marge_percentage)
      factuurItems = form.items_json
      subtotaal    = t.excl
      btwBedrag    = t.btwB
      totaalIncl   = t.incl
      hoofdBtw     = Number(form.btw_percentage)
    }

    // Maak factuur aan
    const { data: factuurData, error: factuurFout } = await supabase.from('facturen').insert({
      project_id:     form.project_id || null,
      klant_id:       form.klant_id   || null,
      offerte_id:     id,
      factuur_nummer: factuurNummer,
      status:         'verstuurd',
      factuur_datum:  vandaag,
      verval_datum:   vervalDatum,
      items_json:     factuurItems,
      btw_percentage: hoofdBtw,
      subtotaal,
      btw_bedrag:     btwBedrag,
      totaal_incl:    totaalIncl,
      betaald_bedrag: 0,
      notities:       form.notities || null,
    }).select('id').single()

    if (factuurFout) {
      setFout('Factuur aanmaken mislukt: ' + factuurFout.message)
      setBezigFactuur(false); setBevestigFactuur(false)
      return
    }

    // Update offerte naar gefactureerd
    await supabase.from('offertes').update({
      status: 'gefactureerd',
      bijgewerkt_op: new Date().toISOString(),
    }).eq('id', id)

    navigate(`/facturen/${factuurData.id}`)
  }

  // ── Verwijderen ─────────────────────────────────────────────────────────────
  async function handleVerwijder() {
    await supabase.from('offertes').delete().eq('id', id)
    navigate('/offertes')
  }

  // ── Stuur naar klant ────────────────────────────────────────────────────────
  function handleStuurKlant() {
    const email     = klantDetail?.email ?? ''
    const nr        = form.offerte_nummer
    const project   = offerte?.projecten?.naam ?? 'uw project'
    const klantNm   = klantDetail?.bedrijfsnaam || klantDetail?.naam || 'geachte'
    const onderwerp = encodeURIComponent(`Offerte ${nr} – ${project}`)
    const body      = encodeURIComponent(
      `Goedendag ${klantNm},\n\n` +
      `In bijlage vindt u offerte ${nr} voor ${project}.\n\n` +
      `Gelieve de offerte te bekijken en ons te laten weten of u akkoord gaat, of indien u vragen heeft.\n\n` +
      `Met vriendelijke groeten,\n${instelling?.bedrijfsnaam ?? 'Build Your Tools'}`
    )
    window.location.href = `mailto:${email}?subject=${onderwerp}&body=${body}`
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
    </div>
  )

  if (fout || !offerte || !form) return (
    <div className="text-center py-24">
      <p className="text-gray-500">{fout || 'Offerte niet gevonden.'}</p>
      <Link to="/offertes" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
        ← Terug naar offertes
      </Link>
    </div>
  )

  const klantNaamHeader = offerte.klanten?.bedrijfsnaam || offerte.klanten?.naam || '—'
  const projectNaam     = offerte.projecten?.naam ?? null

  return (
    <>
      {/* ── Printblok (alleen zichtbaar bij window.print()) ───────── */}
      {form && (
        <PrintLayout
          offerte={offerte}
          form={form}
          instelling={instelling}
          klant={klantDetail}
          primairKleur={huisstijlKleur}
        />
      )}

      {/* ── Schermweergave ─────────────────────────────────────────── */}
      <div className="max-w-4xl no-print">

        {/* Kleurband huisstijl (4px, alleen scherm) */}
        {huisstijlKleur && (
          <div
            className="rounded-full mb-5"
            style={{ height: 4, background: huisstijlKleur }}
            title={`Projectkleur: ${huisstijlKleur}`}
          />
        )}

        {/* ── Zet om naar factuur — prominente banner bij goedgekeurd ── */}
        {form.status === 'goedgekeurd' && (
          <div className="mb-5 flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border-2"
            style={{ background: '#f0fae5', borderColor: '#78C833' }}>
            <div>
              <p className="text-sm font-bold text-gray-800">Deze offerte is goedgekeurd</p>
              <p className="text-xs text-gray-500 mt-0.5">Je kan nu een factuur aanmaken op basis van deze offerte.</p>
            </div>
            <button
              onClick={() => setBevestigFactuur(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold whitespace-nowrap hover:opacity-90 transition-opacity flex-shrink-0"
              style={{ background: '#78C833' }}>
              <Receipt size={15} />
              Zet om naar factuur
            </button>
          </div>
        )}

        {/* ── Bevestigingsdialog ── */}
        {bevestigFactuur && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#f0fae5' }}>
                  <Receipt size={18} style={{ color: '#78C833' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Omzetten naar factuur</p>
                  <p className="text-xs text-gray-400 mt-0.5">Offerte {form.offerte_nummer}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Wil je een factuur aanmaken op basis van deze offerte?
                De offerte krijgt status <strong>Gefactureerd</strong> en je wordt doorgestuurd naar de nieuwe factuur.
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setBevestigFactuur(false)} disabled={bezigFactuur}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
                  Annuleer
                </button>
                <button onClick={zetOmNaarFactuur} disabled={bezigFactuur}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ background: '#78C833' }}>
                  {bezigFactuur
                    ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Aanmaken...</>
                    : <><Receipt size={14} /> Factuur aanmaken</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link to="/offertes" className="hover:text-gray-600 transition flex items-center gap-1">
            <ChevronLeft size={14} /> Offertes
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{offerte.offerte_nummer}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{offerte.offerte_nummer}</h1>
            <p className="text-sm text-gray-500">
              {klantNaamHeader}
              {projectNaam && <span className="text-gray-400"> · {projectNaam}</span>}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Aangemaakt op {formatDatum(offerte.aangemaakt_op)}
            </p>
          </div>

          {/* Status-selector met directe save */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <StatusBadge status={form.status} />
            <div className="relative">
              <select
                value={form.status}
                disabled={statusLaden}
                onChange={e => handleStatusWijzig(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 disabled:opacity-50 cursor-pointer"
              >
                {STATUSSEN.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
            </div>
            {statusLaden && (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#185FA5', borderTopColor: 'transparent' }} />
            )}
          </div>
        </div>

        {/* Formulier */}
        <form onSubmit={handleOpslaan} className="space-y-6">

          {/* Basisgegevens */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basisgegevens</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Offertenummer</label>
                <input value={form.offerte_nummer}
                  onChange={e => stelIn('offerte_nummer', e.target.value)}
                  className={inp} />
              </div>
              <div>
                <label className={lbl}>Geldig tot</label>
                <input type="date" value={form.geldig_tot}
                  onChange={e => stelIn('geldig_tot', e.target.value)}
                  className={inp} />
              </div>
              <div>
                <label className={lbl}>Klant</label>
                <div className="relative">
                  <select value={form.klant_id}
                    onChange={e => stelIn('klant_id', e.target.value)}
                    className={inp + ' appearance-none pr-8'}>
                    <option value="">— Geen klant —</option>
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
                <label className={lbl}>Project</label>
                <div className="relative">
                  <select value={form.project_id}
                    onChange={e => stelIn('project_id', e.target.value)}
                    className={inp + ' appearance-none pr-8'}>
                    <option value="">— Geen project —</option>
                    {projecten.map(p => (
                      <option key={p.id} value={p.id}>{p.naam}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Offerteblokken (v2) of Regelitems (v1) */}
          {isV2(form.items_json) ? (
            <>
              {/* Uurtarief voor v2 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Uurtarief</p>
                <div className="flex items-end gap-4">
                  <div>
                    <label className={lbl}>Uurtarief (€)</label>
                    <div className="relative w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                      <input type="number" min="0" step="1" value={form.uurtarief}
                        onChange={e => stelIn('uurtarief', Number(e.target.value))}
                        className={inp + ' pl-7'} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 pb-3">Gebruikt voor uren-items en procentuele berekeningen.</p>
                </div>
              </div>

              {/* Builder blokken */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Offerteblokken</p>
                <OfferteBuilder
                  blokken={form.items_json.blokken}
                  uurtarief={form.uurtarief}
                  onChange={nieuweBlokken => stelIn('items_json', {
                    ...form.items_json,
                    blokken: nieuweBlokken,
                    uurtarief: Number(form.uurtarief),
                  })}
                />
              </div>

              {/* V2 totaaloverzicht */}
              {(() => {
                const { excl, btw, incl } = berekenAlles(form.items_json.blokken, form.uurtarief)
                const fmtBE = n => Number(n ?? 0).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                return (
                  <div className="bg-gray-50 rounded-xl px-5 py-4 space-y-2 text-sm max-w-xs ml-auto">
                    <div className="flex justify-between text-gray-500"><span>Excl. BTW</span><span>€ {fmtBE(excl)}</span></div>
                    <div className="flex justify-between text-gray-500"><span>BTW</span><span>€ {fmtBE(btw)}</span></div>
                    <div className="flex justify-between text-gray-900 font-bold text-base border-t border-gray-300 pt-2">
                      <span>Totaal incl. BTW</span><span>€ {fmtBE(incl)}</span>
                    </div>
                  </div>
                )
              })()}
            </>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Regelitems</p>
                <RegelItems
                  items={form.items_json}
                  onChange={items => stelIn('items_json', items)}
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Berekening</p>
                <div className="flex gap-4 max-w-xs">
                  <div className="flex-1">
                    <label className={lbl}>BTW %</label>
                    <input type="number" min="0" max="100" value={form.btw_percentage}
                      onChange={e => stelIn('btw_percentage', e.target.value)} className={inp} />
                  </div>
                  <div className="flex-1">
                    <label className={lbl}>Marge %</label>
                    <input type="number" min="0" max="100" value={form.marge_percentage}
                      onChange={e => stelIn('marge_percentage', e.target.value)} className={inp} />
                  </div>
                </div>
                <TotaalBlok
                  items={form.items_json}
                  btw={form.btw_percentage}
                  marge={form.marge_percentage}
                />
              </div>
            </>
          )}

          {/* Notities */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notities</p>
            <textarea
              value={form.notities}
              onChange={e => stelIn('notities', e.target.value)}
              rows={4}
              placeholder="Interne notities, context voor de offerte..."
              className={inp + ' resize-none'}
            />
          </div>

          {/* Feedback */}
          {fout && (
            <p className="text-xs text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{fout}</p>
          )}
          {ok && (
            <p className="text-xs text-green-700 bg-green-50 px-4 py-2.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle size={12} /> {ok}
            </p>
          )}

          {/* ── Knoppenbalk ── */}
          <div className="flex flex-wrap items-center gap-3">

            {/* 1. Opslaan */}
            <button type="submit" disabled={opslaan}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition"
              style={{ background: '#185FA5' }}>
              <Save size={14} />
              {opslaan ? 'Opslaan...' : 'Wijzigingen opslaan'}
            </button>

            {/* 2. Afdrukken / PDF */}
            <button type="button" onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition bg-white">
              <Printer size={14} />
              Afdrukken / PDF
            </button>

            {/* 3. Stuur naar klant */}
            <button type="button" onClick={handleStuurKlant}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition bg-white">
              <Mail size={14} />
              Stuur naar klant
            </button>

            {/* 4. Verwijderen */}
            {!bevestigVerwijder ? (
              <button type="button" onClick={() => setBevestigVerwijder(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition ml-auto">
                <Trash2 size={14} />
                Verwijderen
              </button>
            ) : (
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-xs text-gray-500">Zeker verwijderen?</span>
                <button type="button" onClick={handleVerwijder}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition">
                  Ja, verwijderen
                </button>
                <button type="button" onClick={() => setBevestigVerwijder(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 transition">
                  Annuleren
                </button>
              </div>
            )}
          </div>

        </form>
      </div>
    </>
  )
}
