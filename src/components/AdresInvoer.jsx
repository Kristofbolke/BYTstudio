// AdresInvoer.jsx — Herbruikbaar adresblok met postcode→gemeente en straat-autocomplete
// Bronnen: Geopunt Vlaanderen (straatnamen, geen API-key) + Basisregisters Vlaanderen
// postinfo-resource (deelgemeenten per postcode, geen API-key). Dekt Vlaanderen + Brussel.
import { useEffect, useState, useRef } from 'react'

const GEOPUNT_URL = 'https://geo.api.vlaanderen.be/Geolocation/geolocation/location'

function normaliseerPlaatsnaam(naam) {
  if (naam !== naam.toUpperCase()) return naam
  return naam.toLowerCase().replace(/(^|[\s-])([a-zà-ÿ])/g, (_, sep, c) => sep + c.toUpperCase())
}

async function zoekGemeentenVoorPostcode(postcode) {
  try {
    const res = await fetch(`https://api.basisregisters.vlaanderen.be/v2/postinfo/${encodeURIComponent(postcode)}`)
    if (!res.ok) return []
    const data = await res.json()
    const namen = (data.postnamen ?? [])
      .map(p => p.geografischeNaam?.spelling)
      .filter(Boolean)
      .map(normaliseerPlaatsnaam)
    if (namen.length > 0) return [...new Set(namen)]
    const gemeente = data.gemeente?.gemeentenaam?.geografischeNaam?.spelling
    return gemeente ? [gemeente] : []
  } catch {
    return []
  }
}

async function zoekStraten(tekst, gemeente) {
  try {
    const q = gemeente ? `${tekst}, ${gemeente}` : tekst
    const res = await fetch(`${GEOPUNT_URL}?q=${encodeURIComponent(q)}&c=8&type=Thoroughfarename`)
    if (!res.ok) return []
    const data = await res.json()
    const namen = (data.LocationResult ?? []).map(r => r.Thoroughfarename).filter(Boolean)
    return [...new Set(namen)]
  } catch {
    return []
  }
}

const inp = 'w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400'
const lbl = 'block text-xs font-semibold text-gray-500 mb-1'

// ── AdresInvoer ────────────────────────────────────────────────────────────────
// Props:
//   waarden  — { straat, huisnummer, postcode, gemeente, provincie, land }
//   onChange — (nieuwAdres) => void, ontvangt de volledige bijgewerkte waarden
//   disabled — optioneel, blokkeert alle velden (bv. tijdens opslaan)
export default function AdresInvoer({ waarden, onChange, disabled = false }) {
  const straat = waarden.straat ?? ''
  const huisnummer = waarden.huisnummer ?? ''
  const postcode = waarden.postcode ?? ''
  const gemeente = waarden.gemeente ?? ''
  const provincie = waarden.provincie ?? ''
  const land = waarden.land ?? 'België'

  const [straatSuggesties, setStraatSuggesties] = useState([])
  const [straatDropdownOpen, setStraatDropdownOpen] = useState(false)
  const straatGekozenRef = useRef(false)
  const [gemeenteOpties, setGemeenteOpties] = useState([])

  function stelIn(veld, waarde) {
    onChange({ ...waarden, [veld]: waarde })
  }

  // ── Gemeente automatisch aanvullen zodra het postnummer volledig is ────────
  // Bij meerdere deelgemeenten voor hetzelfde postnummer (bv. 9860 Oosterzele)
  // toont dit een keuzelijst i.p.v. blind de eerste te kiezen.
  useEffect(() => {
    const pc = postcode.trim()
    if (pc.length < 4) { setGemeenteOpties([]); return }
    let actief = true
    const timer = setTimeout(async () => {
      const opties = await zoekGemeentenVoorPostcode(pc)
      if (!actief) return
      if (opties.length === 1) {
        onChange({ ...waarden, gemeente: opties[0] })
        setGemeenteOpties([])
      } else if (opties.length > 1) {
        setGemeenteOpties(opties)
      } else {
        setGemeenteOpties([])
      }
    }, 400)
    return () => { actief = false; clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postcode])

  function kiesGemeente(naam) {
    stelIn('gemeente', naam)
    setGemeenteOpties([])
  }

  // ── Straatnaam-suggesties ophalen terwijl de gebruiker typt ─────────────────
  useEffect(() => {
    if (straatGekozenRef.current) { straatGekozenRef.current = false; return }
    const tekst = straat.trim()
    if (tekst.length < 2) { setStraatSuggesties([]); return }
    let actief = true
    const timer = setTimeout(async () => {
      const straten = await zoekStraten(tekst, gemeente.trim())
      if (actief) { setStraatSuggesties(straten); setStraatDropdownOpen(true) }
    }, 300)
    return () => { actief = false; clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [straat, gemeente])

  function kiesStraat(naam) {
    straatGekozenRef.current = true
    stelIn('straat', naam)
    setStraatDropdownOpen(false)
    setStraatSuggesties([])
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="relative">
        <label className={lbl}>Straat</label>
        <input
          value={straat}
          onChange={e => stelIn('straat', e.target.value)}
          onFocus={() => { if (straatSuggesties.length > 0) setStraatDropdownOpen(true) }}
          onBlur={() => setTimeout(() => setStraatDropdownOpen(false), 150)}
          autoComplete="off"
          disabled={disabled}
          className={inp}
        />
        {straatDropdownOpen && straatSuggesties.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {straatSuggesties.map(naam => (
              <li key={naam}>
                <button
                  type="button"
                  onMouseDown={() => kiesStraat(naam)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {naam}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label className={lbl}>Huisnummer</label>
        <input value={huisnummer} onChange={e => stelIn('huisnummer', e.target.value)} disabled={disabled} className={inp} />
      </div>
      <div>
        <label className={lbl}>Postcode</label>
        <input value={postcode} onChange={e => stelIn('postcode', e.target.value)} disabled={disabled} className={inp} />
      </div>
      <div>
        <label className={lbl}>Gemeente</label>
        <input
          value={gemeente}
          onChange={e => { stelIn('gemeente', e.target.value); setGemeenteOpties([]) }}
          disabled={disabled}
          className={inp}
        />
        {gemeenteOpties.length > 1 ? (
          <div className="mt-1.5 bg-amber-50 border border-amber-100 rounded-lg p-2">
            <p className="text-[11px] text-amber-700 font-medium mb-1.5">Dit postnummer dekt meerdere deelgemeenten — kies er één:</p>
            <div className="flex flex-wrap gap-1.5">
              {gemeenteOpties.map(naam => (
                <button
                  key={naam}
                  type="button"
                  onClick={() => kiesGemeente(naam)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    gemeente === naam ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                >
                  {naam}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 mt-1">Vult automatisch aan op basis van het postnummer (Vlaanderen &amp; Brussel).</p>
        )}
      </div>
      <div>
        <label className={lbl}>Provincie</label>
        <input value={provincie} onChange={e => stelIn('provincie', e.target.value)} disabled={disabled} className={inp} />
      </div>
      <div>
        <label className={lbl}>Land</label>
        <input value={land} onChange={e => stelIn('land', e.target.value)} disabled={disabled} className={inp} />
      </div>
    </div>
  )
}
