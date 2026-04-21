// OfferteBuilder.jsx — Gestructureerde offerte-builder v2
// Blokken: Ontwikkelingskosten | Recurrente abonnementskosten | Onderhoud & support

const BYT = '#78C833'

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n ?? 0).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
const inp = 'px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#78C833]/20 focus:border-[#78C833] bg-white w-full'
const inpSm = 'px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#78C833]/20 focus:border-[#78C833] bg-white'

// ── Standaard blokken ────────────────────────────────────────────────────────
export const DEFAULT_BLOKKEN = [
  {
    id: 'ontwikkeling', type: 'ontwikkeling', label: 'Ontwikkelingskosten', actief: true, btw: 21,
    items: [
      { id: 'analyse',     label: 'Analyse en intake',           actief: false, modus: 'uren',       waarde: 0,  eenheidsprijs: 0, detail: '' },
      { id: 'ontwerp',     label: 'Ontwerp en huisstijl',        actief: false, modus: 'uren',       waarde: 0,  eenheidsprijs: 0, detail: '' },
      { id: 'modules',     label: 'Ontwikkeling per module',     actief: true,  modus: 'uren',       waarde: 0,  eenheidsprijs: 0, detail: '' },
      { id: 'deployment',  label: 'Deployment en configuratie',  actief: false, modus: 'percentage', waarde: 10, eenheidsprijs: 0, detail: '' },
      { id: 'handleiding', label: 'Schrijven handleiding',       actief: false, modus: 'percentage', waarde: 10, eenheidsprijs: 0, detail: '' },
      { id: 'opleiding',   label: 'Opleiding klant',             actief: false, modus: 'uren',       waarde: 0,  eenheidsprijs: 0, detail: '' },
      { id: 'testen',      label: 'Testen en debuggen',          actief: false, modus: 'percentage', waarde: 15, eenheidsprijs: 0, detail: '' },
      { id: 'andere',      label: 'Andere',                      actief: false, modus: 'uren',       waarde: 0,  eenheidsprijs: 0, detail: '', isAndere: true },
    ],
  },
  {
    id: 'abonnement', type: 'abonnement', label: 'Recurrente abonnementskosten', actief: false, btw: 21,
    items: [
      { id: 'hosting',  label: 'Hosting',      actief: false, prijs: 0, detail: '' },
      { id: 'database', label: 'Database',      actief: false, prijs: 0, detail: '' },
      { id: 'email',    label: 'E-mailservice', actief: false, prijs: 0, detail: '' },
      { id: 'domein',   label: 'Domeinnaam',    actief: false, prijs: 0, detail: '' },
      { id: 'chatbot',  label: 'Chatbot',       actief: false, prijs: 0, detail: '' },
      { id: 'andere',   label: 'Andere',        actief: false, prijs: 0, detail: '', isAndere: true },
    ],
  },
  {
    id: 'support', type: 'support', label: 'Onderhoud en support', actief: false, btw: 21,
    pakketten: [
      { id: 'basis',     label: 'Basis',     omschrijving: 'Monitoring en updates',        prijs: 75,  actief: false },
      { id: 'standaard', label: 'Standaard', omschrijving: '+ aanpassingen van max 1 uur', prijs: 150, actief: false },
      { id: 'pro',       label: 'Pro',       omschrijving: '+ 3 uur aanpassingen',         prijs: 250, actief: false },
    ],
  },
]

// ── Berekening (geëxporteerd) ────────────────────────────────────────────────
export function berekenBlok(blok, uurtarief) {
  const ur = Number(uurtarief) || 0
  const btwPct = Number(blok.btw) / 100

  if (blok.type === 'ontwikkeling') {
    const actief = blok.items.filter(i => i.actief)
    // Uren-items eerst berekenen als basis voor percentage
    const urenSubtotaal = actief
      .filter(i => i.modus === 'uren')
      .reduce((s, i) => s + (Number(i.waarde) || 0) * ur, 0)
    const subtotaal = actief.reduce((s, i) => {
      if (i.modus === 'uren')       return s + (Number(i.waarde) || 0) * ur
      if (i.modus === 'percentage') return s + (Number(i.waarde) || 0) / 100 * urenSubtotaal
      if (i.modus === 'stuk')       return s + (Number(i.waarde) || 0) * (Number(i.eenheidsprijs) || 0)
      return s
    }, 0)
    const btwBedrag = subtotaal * btwPct
    return { subtotaal, btwBedrag, totaal: subtotaal + btwBedrag, urenSubtotaal }
  }

  if (blok.type === 'abonnement') {
    const subtotaal = blok.items.filter(i => i.actief).reduce((s, i) => s + (Number(i.prijs) || 0), 0)
    const btwBedrag = subtotaal * btwPct
    return { subtotaal, btwBedrag, totaal: subtotaal + btwBedrag, urenSubtotaal: 0 }
  }

  if (blok.type === 'support') {
    const subtotaal = blok.pakketten.filter(p => p.actief).reduce((s, p) => s + (Number(p.prijs) || 0), 0)
    const btwBedrag = subtotaal * btwPct
    return { subtotaal, btwBedrag, totaal: subtotaal + btwBedrag, urenSubtotaal: 0 }
  }

  return { subtotaal: 0, btwBedrag: 0, totaal: 0, urenSubtotaal: 0 }
}

export function berekenAlles(blokken, uurtarief) {
  const totalen = blokken.filter(b => b.actief).map(b => berekenBlok(b, uurtarief))
  return {
    excl: totalen.reduce((s, t) => s + t.subtotaal, 0),
    btw:  totalen.reduce((s, t) => s + t.btwBedrag, 0),
    incl: totalen.reduce((s, t) => s + t.totaal, 0),
  }
}

// Converteert v2 blokken naar platte factuuritems (voor factuur aanmaken)
export function vlakItemsVoorFactuur(blokken, uurtarief) {
  const ur = Number(uurtarief) || 0
  const result = []
  for (const blok of blokken.filter(b => b.actief)) {
    if (blok.type === 'ontwikkeling') {
      const actief = blok.items.filter(i => i.actief)
      const urenSub = actief.filter(i => i.modus === 'uren').reduce((s, i) => s + (Number(i.waarde) || 0) * ur, 0)
      for (const item of actief) {
        const naam = item.isAndere && item.detail ? item.detail : item.label
        if (item.modus === 'uren') {
          result.push({ omschrijving: item.detail && !item.isAndere ? `${naam} — ${item.detail}` : naam, hoeveelheid: Number(item.waarde) || 0, eenheid: 'uur', eenheidsprijs: ur, btw_percentage: blok.btw })
        } else if (item.modus === 'percentage') {
          const bedrag = (Number(item.waarde) || 0) / 100 * urenSub
          result.push({ omschrijving: `${naam} (${item.waarde}%)`, hoeveelheid: 1, eenheid: 'forfait', eenheidsprijs: bedrag, btw_percentage: blok.btw })
        } else if (item.modus === 'stuk') {
          result.push({ omschrijving: naam, hoeveelheid: Number(item.waarde) || 0, eenheid: 'stuk', eenheidsprijs: Number(item.eenheidsprijs) || 0, btw_percentage: blok.btw })
        }
      }
    }
    if (blok.type === 'abonnement') {
      for (const item of blok.items.filter(i => i.actief)) {
        const naam = item.isAndere && item.detail ? item.detail : item.label
        const beschr = item.detail && !item.isAndere ? `${naam} (${item.detail})` : naam
        result.push({ omschrijving: beschr, hoeveelheid: 1, eenheid: 'maand', eenheidsprijs: Number(item.prijs) || 0, btw_percentage: blok.btw })
      }
    }
    if (blok.type === 'support') {
      for (const p of blok.pakketten.filter(p => p.actief)) {
        result.push({ omschrijving: `Support ${p.label} — ${p.omschrijving}`, hoeveelheid: 1, eenheid: 'maand', eenheidsprijs: Number(p.prijs) || 0, btw_percentage: blok.btw })
      }
    }
  }
  return result
}

// ── UI hulpcomponenten ───────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full transition-all flex-shrink-0 relative ${checked ? 'bg-[#78C833]' : 'bg-gray-200 hover:bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

function BlokSubtotaal({ subtotaal, btw, btwBedrag, totaal, onBtwChange }) {
  return (
    <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
      <div className="w-64 space-y-1.5">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotaal excl. BTW</span>
          <span className="font-medium text-gray-700">€ {fmt(subtotaal)}</span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <span>BTW</span>
            <input type="number" min="0" max="100" value={btw}
              onChange={e => onBtwChange(Number(e.target.value))}
              className="w-11 px-1.5 py-0.5 rounded border border-gray-200 text-xs text-center focus:outline-none focus:border-[#78C833]" />
            <span>%</span>
          </div>
          <span>€ {fmt(btwBedrag)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-200">
          <span>Totaal incl. BTW</span>
          <span style={{ color: BYT }}>€ {fmt(totaal)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Blok 1: Ontwikkelingskosten ──────────────────────────────────────────────
function BlokOntwikkeling({ blok, uurtarief, onChange }) {
  const ur = Number(uurtarief) || 0
  const { subtotaal, btwBedrag, totaal, urenSubtotaal } = berekenBlok(blok, uurtarief)

  function updateItem(id, veld, waarde) {
    onChange({ ...blok, items: blok.items.map(i => i.id === id ? { ...i, [veld]: waarde } : i) })
  }

  function itemBedrag(item) {
    if (!item.actief) return null
    if (item.modus === 'uren')       return (Number(item.waarde) || 0) * ur
    if (item.modus === 'percentage') return (Number(item.waarde) || 0) / 100 * urenSubtotaal
    if (item.modus === 'stuk')       return (Number(item.waarde) || 0) * (Number(item.eenheidsprijs) || 0)
    return 0
  }

  return (
    <div className="space-y-2">
      {/* Kolomhoofden */}
      <div className="hidden sm:grid pb-1.5 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide"
        style={{ gridTemplateColumns: '36px 1fr 124px 76px 88px 80px' }}>
        {['', 'Categorie', 'Modus', 'Waarde', 'Prijs/stuk', 'Bedrag'].map(h => (
          <span key={h}>{h}</span>
        ))}
      </div>

      {blok.items.map(item => {
        const bedrag = itemBedrag(item)
        return (
          <div key={item.id} className={`space-y-1 transition-opacity ${item.actief ? '' : 'opacity-40'}`}>
            <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '36px 1fr 124px 76px 88px 80px' }}>

              {/* Toggle */}
              <Toggle checked={item.actief} onChange={v => updateItem(item.id, 'actief', v)} />

              {/* Label / omschrijving voor Andere */}
              {item.isAndere && item.actief ? (
                <input value={item.detail}
                  onChange={e => updateItem(item.id, 'detail', e.target.value)}
                  placeholder="Omschrijving..."
                  className={inp} />
              ) : (
                <span className="text-sm text-gray-700 font-medium truncate">{item.label}</span>
              )}

              {/* Modus pills */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                {[['uren', 'Uren'], ['percentage', '%'], ['stuk', 'Stuk']].map(([key, lbl]) => (
                  <button key={key} type="button" disabled={!item.actief}
                    onClick={() => updateItem(item.id, 'modus', key)}
                    className={`flex-1 py-1.5 font-semibold transition-colors ${
                      item.modus === key && item.actief ? 'bg-[#78C833] text-white' : 'text-gray-400 hover:bg-gray-50 disabled:hover:bg-white'
                    }`}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Waarde */}
              <input type="number" min="0" step={item.modus === 'uren' ? '0.5' : '1'}
                value={item.waarde} disabled={!item.actief}
                onChange={e => updateItem(item.id, 'waarde', e.target.value)}
                className={`${inpSm} text-right disabled:bg-gray-50 w-full`} />

              {/* Prijs/stuk of toelichting */}
              {item.modus === 'stuk' && item.actief ? (
                <div className="relative">
                  <span className="absolute left-2 top-2 text-gray-400 text-xs">€</span>
                  <input type="number" min="0" step="0.01" value={item.eenheidsprijs}
                    onChange={e => updateItem(item.id, 'eenheidsprijs', e.target.value)}
                    className={`${inpSm} pl-5 text-right w-full`} />
                </div>
              ) : (
                <span className="text-xs text-gray-400 truncate">
                  {item.actief && item.modus === 'uren' && ur > 0 ? `€ ${fmt(ur)}/u` : ''}
                  {item.actief && item.modus === 'percentage' ? `v/€ ${fmt(urenSubtotaal)}` : ''}
                </span>
              )}

              {/* Bedrag */}
              <span className={`text-sm font-semibold text-right ${item.actief && bedrag > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                {bedrag !== null ? `€ ${fmt(bedrag)}` : '—'}
              </span>
            </div>

            {/* Toelichting (voor niet-Andere items) */}
            {item.actief && !item.isAndere && (
              <div className="pl-[44px]">
                <input value={item.detail}
                  onChange={e => updateItem(item.id, 'detail', e.target.value)}
                  placeholder="Toelichting, modules, details..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-100 text-xs text-gray-500 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#78C833]/20 focus:border-[#78C833] focus:bg-white transition-colors" />
              </div>
            )}
          </div>
        )
      })}

      <BlokSubtotaal subtotaal={subtotaal} btw={blok.btw} btwBedrag={btwBedrag} totaal={totaal}
        onBtwChange={btw => onChange({ ...blok, btw })} />
    </div>
  )
}

// ── Blok 2: Recurrente abonnementskosten ─────────────────────────────────────
const ABO_PLACEHOLDER = {
  hosting:  'Netlify, Railway, Vercel, andere...',
  database: 'Supabase, PlanetScale, andere...',
  email:    'Postmark, SendGrid, Resend, andere...',
  domein:   'Cloudflare, Namecheap, andere...',
  chatbot:  'Tidio, Intercom, Crisp, andere...',
  andere:   'Naam dienst...',
}

function BlokAbonnement({ blok, onChange }) {
  const { subtotaal, btwBedrag, totaal } = berekenBlok(blok, 0)

  function updateItem(id, veld, waarde) {
    onChange({ ...blok, items: blok.items.map(i => i.id === id ? { ...i, [veld]: waarde } : i) })
  }

  return (
    <div className="space-y-2">
      {/* Kolomhoofden */}
      <div className="hidden sm:grid pb-1.5 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide"
        style={{ gridTemplateColumns: '36px 140px 1fr 120px 80px' }}>
        {['', 'Dienst', 'Detail / leverancier', '€ / maand', 'Totaal'].map(h => (
          <span key={h}>{h}</span>
        ))}
      </div>

      {blok.items.map(item => (
        <div key={item.id}
          className={`grid gap-2 items-center transition-opacity ${item.actief ? '' : 'opacity-40'}`}
          style={{ gridTemplateColumns: '36px 140px 1fr 120px 80px' }}>

          <Toggle checked={item.actief} onChange={v => updateItem(item.id, 'actief', v)} />

          {/* Dienst label — editable voor Andere */}
          {item.isAndere && item.actief ? (
            <input value={item.detail}
              onChange={e => updateItem(item.id, 'detail', e.target.value)}
              placeholder="Naam dienst..."
              className={inp} />
          ) : (
            <span className="text-sm text-gray-700 font-medium">{item.label}</span>
          )}

          {/* Detail / leverancier (voor vaste items) */}
          {!item.isAndere ? (
            <input value={item.detail} disabled={!item.actief}
              onChange={e => updateItem(item.id, 'detail', e.target.value)}
              placeholder={ABO_PLACEHOLDER[item.id] || 'Leverancier...'}
              className={`${inp} disabled:bg-gray-50`} />
          ) : (
            <div /> // Andere gebruikt 'detail' al als label
          )}

          {/* Prijs */}
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-gray-400 text-xs">€</span>
            <input type="number" min="0" step="0.01" value={item.prijs} disabled={!item.actief}
              onChange={e => updateItem(item.id, 'prijs', e.target.value)}
              className={`${inpSm} pl-5 text-right disabled:bg-gray-50 w-full`} />
          </div>

          <span className={`text-sm font-semibold text-right ${item.actief && item.prijs > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
            {item.actief ? `€ ${fmt(item.prijs)}` : '—'}
          </span>
        </div>
      ))}

      <BlokSubtotaal subtotaal={subtotaal} btw={blok.btw} btwBedrag={btwBedrag} totaal={totaal}
        onBtwChange={btw => onChange({ ...blok, btw })} />
    </div>
  )
}

// ── Blok 3: Onderhoud en support ─────────────────────────────────────────────
function BlokSupport({ blok, onChange }) {
  const { subtotaal, btwBedrag, totaal } = berekenBlok(blok, 0)

  // Radio-stijl: één pakket actief tegelijk
  function selectPakket(id) {
    onChange({
      ...blok,
      pakketten: blok.pakketten.map(p => ({ ...p, actief: p.id === id ? !p.actief : false })),
    })
  }

  function updatePakket(id, veld, waarde, e) {
    if (e) { e.stopPropagation() }
    onChange({ ...blok, pakketten: blok.pakketten.map(p => p.id === id ? { ...p, [veld]: waarde } : p) })
  }

  const PAKKET_KLEUREN = {
    basis:     { kleur: '#64748b', bg: '#f1f5f9', border: '#94a3b8' },
    standaard: { kleur: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
    pro:       { kleur: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd' },
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Selecteer één supportpakket per offerte.</p>
      <div className="grid grid-cols-3 gap-3">
        {blok.pakketten.map(p => {
          const stijl = PAKKET_KLEUREN[p.id] ?? PAKKET_KLEUREN.basis
          return (
            <div key={p.id}
              onClick={() => selectPakket(p.id)}
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all select-none ${
                p.actief
                  ? 'shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              style={p.actief ? { borderColor: stijl.border, background: stijl.bg } : {}}>

              {/* Header: label + radio indicator */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: p.actief ? stijl.kleur : '#9ca3af' }}>
                  {p.label}
                </span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors`}
                  style={p.actief ? { borderColor: stijl.kleur, background: stijl.kleur } : { borderColor: '#d1d5db' }}>
                  {p.actief && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Omschrijving (editable) */}
              <textarea value={p.omschrijving} rows={2}
                onClick={e => e.stopPropagation()}
                onChange={e => updatePakket(p.id, 'omschrijving', e.target.value, e)}
                className="text-xs text-gray-600 bg-transparent resize-none w-full focus:outline-none mb-3 leading-relaxed" />

              {/* Prijs input */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <span className="absolute left-2.5 top-2 text-gray-500 text-xs">€</span>
                <input type="number" min="0" step="5" value={p.prijs}
                  onChange={e => updatePakket(p.id, 'prijs', e.target.value, e)}
                  className="w-full pl-5 pr-[44px] py-2 rounded-lg border border-gray-200 text-sm text-right font-bold focus:outline-none focus:ring-2 focus:ring-[#78C833]/20 focus:border-[#78C833] bg-white" />
                <span className="absolute right-2.5 top-2 text-gray-400 text-xs">/maand</span>
              </div>
            </div>
          )
        })}
      </div>

      <BlokSubtotaal subtotaal={subtotaal} btw={blok.btw} btwBedrag={btwBedrag} totaal={totaal}
        onBtwChange={btw => onChange({ ...blok, btw })} />
    </div>
  )
}

// ── Hoofd export ─────────────────────────────────────────────────────────────
const BLOK_STIJL = {
  ontwikkeling: { kleur: '#2563eb', licht: '#dbeafe' },
  abonnement:   { kleur: '#7c3aed', licht: '#ede9fe' },
  support:      { kleur: '#16a34a', licht: '#dcfce7' },
}

export default function OfferteBuilder({ blokken, uurtarief, onChange }) {
  function updateBlok(idx, nieuweBlok) {
    onChange(blokken.map((b, i) => i === idx ? nieuweBlok : b))
  }

  return (
    <div className="space-y-4">
      {blokken.map((blok, idx) => {
        const stijl = BLOK_STIJL[blok.type] ?? { kleur: '#374151', licht: '#f9fafb' }
        return (
          <div key={blok.id}
            className={`rounded-2xl border overflow-hidden transition-all ${blok.actief ? 'border-gray-200 shadow-sm' : 'border-gray-100'}`}>

            {/* Blok header */}
            <div
              className={`flex items-center gap-3 px-5 py-3 ${blok.actief ? '' : 'bg-gray-50/50'}`}
              style={{ borderLeft: `4px solid ${blok.actief ? stijl.kleur : '#e5e7eb'}` }}>
              <Toggle checked={blok.actief} onChange={v => updateBlok(idx, { ...blok, actief: v })} />
              <span className={`font-bold text-sm flex-1 ${blok.actief ? 'text-gray-800' : 'text-gray-400'}`}>
                {blok.label}
              </span>
              {blok.actief && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: stijl.licht, color: stijl.kleur }}>
                  Actief
                </span>
              )}
              {!blok.actief && (
                <span className="text-xs text-gray-400">Schakel in om toe te voegen</span>
              )}
            </div>

            {/* Blok inhoud */}
            {blok.actief && (
              <div className="px-5 py-4 border-t border-gray-100">
                {blok.type === 'ontwikkeling' && (
                  <BlokOntwikkeling blok={blok} uurtarief={uurtarief} onChange={b => updateBlok(idx, b)} />
                )}
                {blok.type === 'abonnement' && (
                  <BlokAbonnement blok={blok} onChange={b => updateBlok(idx, b)} />
                )}
                {blok.type === 'support' && (
                  <BlokSupport blok={blok} onChange={b => updateBlok(idx, b)} />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
