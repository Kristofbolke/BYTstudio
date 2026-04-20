// src/pages/Instellingen.jsx — Persoonlijke configuratie voor de developer/eigenaar
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { Building2, CreditCard, Megaphone, Shield, Info, CheckCircle, AlertCircle } from 'lucide-react'

const LEGE_INST = {
  eigenaar_naam: '',
  bedrijfsnaam: 'Build Your Tools',
  btw_nummer: '',
  adres: '',
  email: '',
  telefoon: '',
  website: '',
  iban: '',
  bic: '',
  logo_url: '',
  uurtarief: 75,
  btw_percentage: 21,
  marge_percentage: 15,
  offerte_geldigheid: 30,
  offerte_voorwaarden: 'Onderhavige offerte is vrijblijvend en geldig gedurende 30 dagen. Bij aanvaarding wordt een voorschot van 30% gefactureerd.',
  factuur_voorwaarden: 'Bij laattijdige betaling is van rechtswege en zonder ingebrekestelling een nalatigheidsintrrest verschuldigd van 10% per jaar, alsook een forfaitaire schadevergoeding van €40. Toepasselijk recht: Belgisch recht. Bevoegde rechtbank: arrondissement Gent.',
  betalingstermijn: 30,
  nalatigheidsintrest: 10,
  forfait_schadevergoeding: 40,
  rechtbank: 'arrondissement Gent',
  banner_zichtbaar: true,
  banner_titel: 'Welkom bij Build Your Tools',
  banner_subtitel: 'Slimme apps voor slimme bedrijven',
}

function Bericht({ tekst }) {
  if (!tekst) return null
  const isError = tekst.startsWith('Fout')
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
      {isError
        ? <AlertCircle size={13} />
        : <CheckCircle size={13} />}
      {tekst}
    </div>
  )
}

function SectieKaart({ icon: Icon, titel, subtitel, children, onOpslaan, laden, bericht, opslaanLabel = 'Opslaan' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#e94560]/10 flex items-center justify-center">
            <Icon size={16} className="text-[#e94560]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{titel}</p>
            <p className="text-xs text-gray-400 mt-0.5">{subtitel}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        {children}
        <div className="pt-1 flex items-center gap-3">
          <button
            onClick={onOpslaan}
            disabled={laden}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: '#e94560' }}
          >
            {laden ? 'Opslaan...' : opslaanLabel}
          </button>
          <Bericht tekst={bericht} />
        </div>
      </div>
    </div>
  )
}

function Veld({ label, children }) {
  return (
    <div>
      <div className="block text-xs font-medium text-gray-500 mb-1.5">{label}</div>
      {children}
    </div>
  )
}

const inputKlasse = "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e94560]/20 focus:border-[#e94560] transition-colors"
const textareaKlasse = `${inputKlasse} resize-none`

export default function Instellingen() {
  const [inst, setInst] = useState(LEGE_INST)
  const [instId, setInstId] = useState(null)
  const [laden, setLaden] = useState(true)
  const [authEmail, setAuthEmail] = useState('')
  const [nieuwWachtwoord, setNieuwWachtwoord] = useState('')

  // Per-sectie laden en bericht
  const [ladenBedrijf, setLadenBedrijf] = useState(false)
  const [berichtBedrijf, setBerichtBedrijf] = useState('')
  const [ladenFinancieel, setLadenFinancieel] = useState(false)
  const [berichtFinancieel, setBerichtFinancieel] = useState('')
  const [ladenBanner, setLadenBanner] = useState(false)
  const [berichtBanner, setBerichtBanner] = useState('')
  const [ladenWw, setLadenWw] = useState(false)
  const [berichtWw, setBerichtWw] = useState('')

  useEffect(() => {
    laadInstellingen()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAuthEmail(user.email ?? '')
    })
  }, [])

  async function laadInstellingen() {
    setLaden(true)
    const { data, error } = await supabase
      .from('instellingen')
      .select('*')
      .limit(1)
      .single()
    if (data) {
      setInstId(data.id)
      setInst({ ...LEGE_INST, ...data })
    } else if (error) {
      console.error('Instellingen laden mislukt:', error.message)
    }
    setLaden(false)
  }

  function stel(veld) {
    return e => setInst(prev => ({ ...prev, [veld]: e.target.value }))
  }

  function stellNum(veld) {
    return e => setInst(prev => ({ ...prev, [veld]: parseFloat(e.target.value) || 0 }))
  }

  async function slaOp(velden, setLadenFn, setBerichtFn, succesMsg = 'Opgeslagen.') {
    if (!instId) return
    setLadenFn(true)
    setBerichtFn('')
    const payload = {}
    velden.forEach(v => { payload[v] = inst[v] })
    payload.bijgewerkt_op = new Date().toISOString()
    const { error } = await supabase.from('instellingen').update(payload).eq('id', instId)
    if (error) setBerichtFn('Fout: ' + error.message)
    else setBerichtFn(succesMsg)
    setLadenFn(false)
  }

  async function slaWachtwoordOp() {
    if (!nieuwWachtwoord) return
    setLadenWw(true)
    setBerichtWw('')
    const { error } = await supabase.auth.updateUser({ password: nieuwWachtwoord })
    if (error) setBerichtWw('Fout: ' + error.message)
    else {
      setBerichtWw('Wachtwoord bijgewerkt.')
      setNieuwWachtwoord('')
    }
    setLadenWw(false)
  }

  if (laden) {
    return (
      <PageWrapper title="Instellingen" description="Persoonlijke configuratie van BYT Studio.">
        <div className="text-sm text-gray-400">Instellingen laden...</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Instellingen"
      description="Persoonlijke configuratie van BYT Studio — enkel zichtbaar voor jou als developer."
    >
      <div className="max-w-2xl space-y-5">

        {/* 1. Jouw gegevens */}
        <SectieKaart
          icon={Building2}
          titel="Jouw gegevens"
          subtitel="Deze gegevens verschijnen op offertes, facturen en handleidingen."
          onOpslaan={() => slaOp(['eigenaar_naam','bedrijfsnaam','btw_nummer','adres','email','telefoon','website','iban','bic','logo_url'], setLadenBedrijf, setBerichtBedrijf, 'Gegevens opgeslagen.')}
          laden={ladenBedrijf}
          bericht={berichtBedrijf}
          opslaanLabel="Gegevens opslaan"
        >
          {/* Twee kolommen */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Links */}
            <div className="space-y-4">
              <Veld label="Naam eigenaar">
                <input className={inputKlasse} value={inst.eigenaar_naam} onChange={stel('eigenaar_naam')} placeholder="Voornaam Achternaam" />
              </Veld>
              <Veld label="Bedrijfsnaam">
                <input className={inputKlasse} value={inst.bedrijfsnaam} onChange={stel('bedrijfsnaam')} placeholder="Build Your Tools" />
              </Veld>
              <Veld label="BTW-nummer">
                <input className={inputKlasse} value={inst.btw_nummer} onChange={stel('btw_nummer')} placeholder="BE 0XXX.XXX.XXX" />
              </Veld>
              <Veld label="Adres">
                <input className={inputKlasse} value={inst.adres} onChange={stel('adres')} placeholder="Straat 1, 9000 Gent" />
              </Veld>
            </div>
            {/* Rechts */}
            <div className="space-y-4">
              <Veld label="E-mail">
                <input className={inputKlasse} value={inst.email} onChange={stel('email')} placeholder="info@buildyourtools.be" />
              </Veld>
              <Veld label="Telefoon">
                <input className={inputKlasse} value={inst.telefoon} onChange={stel('telefoon')} placeholder="+32 4XX XX XX XX" />
              </Veld>
              <Veld label="Website">
                <input className={inputKlasse} value={inst.website} onChange={stel('website')} placeholder="https://buildyourtools.be" />
              </Veld>
            </div>
          </div>

          {/* Volledige breedte */}
          <div className="grid grid-cols-2 gap-4">
            <Veld label="IBAN">
              <input className={inputKlasse} value={inst.iban} onChange={stel('iban')} placeholder="BE68 XXXX XXXX XXXX" />
            </Veld>
            <Veld label="BIC">
              <input className={inputKlasse} value={inst.bic} onChange={stel('bic')} placeholder="GEBABEBB" />
            </Veld>
          </div>

          {/* Logo */}
          <Veld label="Logo URL">
            <input className={inputKlasse} value={inst.logo_url} onChange={stel('logo_url')} placeholder="https://... link naar je logo" />
          </Veld>
          {inst.logo_url && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <img
                src={inst.logo_url}
                alt="Logo voorvertoning"
                style={{ maxHeight: 80, maxWidth: 200, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <span className="text-xs text-gray-400">Voorvertoning</span>
            </div>
          )}
        </SectieKaart>

        {/* 2. Financiële standaarden */}
        <SectieKaart
          icon={CreditCard}
          titel="Financiële standaarden"
          subtitel="Standaardwaarden die automatisch worden ingeladen bij nieuwe offertes en facturen. Aanpasbaar per offerte."
          onOpslaan={() => slaOp(
            ['uurtarief','btw_percentage','marge_percentage','offerte_geldigheid','betalingstermijn',
             'offerte_voorwaarden','factuur_voorwaarden','nalatigheidsintrest','forfait_schadevergoeding','rechtbank'],
            setLadenFinancieel, setBerichtFinancieel, 'Financiële instellingen opgeslagen.'
          )}
          laden={ladenFinancieel}
          bericht={berichtFinancieel}
          opslaanLabel="Financiële instellingen opslaan"
        >
          {/* Rij 1: uurtarief / BTW / marge */}
          <div className="grid grid-cols-3 gap-4">
            <Veld label="Standaard uurtarief (€)">
              <input
                type="number"
                className={inputKlasse}
                value={inst.uurtarief}
                onChange={stellNum('uurtarief')}
                min={0} step={5}
              />
              <p className="text-xs text-gray-400 mt-1">Wordt ingeladen in nieuwe offertes</p>
            </Veld>
            <Veld label="Standaard BTW (%)">
              <input
                type="number"
                className={inputKlasse}
                value={inst.btw_percentage}
                onChange={stellNum('btw_percentage')}
                min={0} max={100} step={1}
              />
              <div className="flex gap-1 mt-1.5">
                {[0, 6, 12, 21].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setInst(prev => ({ ...prev, btw_percentage: v }))}
                    className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                      inst.btw_percentage === v
                        ? 'bg-[#e94560] text-white border-[#e94560]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#e94560] hover:text-[#e94560]'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </Veld>
            <Veld label={
              <span className="flex items-center gap-1">
                Standaard marge/buffer (%)
                <span
                  title="Wordt opgeteld bij de berekende prijs als buffer voor onvoorziene zaken"
                  className="w-3.5 h-3.5 rounded-full bg-gray-300 text-white text-[9px] flex items-center justify-center cursor-help font-bold"
                  style={{ lineHeight: 1 }}
                >i</span>
              </span>
            }>
              <input
                type="number"
                className={inputKlasse}
                value={inst.marge_percentage}
                onChange={stellNum('marge_percentage')}
                min={0} max={100} step={1}
              />
            </Veld>
          </div>

          {/* Rij 2: offerte geldigheid / betalingstermijn */}
          <div className="grid grid-cols-2 gap-4">
            <Veld label="Offerte geldigheid (dagen)">
              <input type="number" className={inputKlasse} value={inst.offerte_geldigheid} onChange={stellNum('offerte_geldigheid')} min={1} />
            </Veld>
            <Veld label="Betalingstermijn facturen (dagen)">
              <input type="number" className={inputKlasse} value={inst.betalingstermijn} onChange={stellNum('betalingstermijn')} min={1} />
            </Veld>
          </div>

          {/* Scheidingslijn betalingsvoorwaarden */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Betalingsvoorwaarden</p>

            <div className="space-y-4">
              <Veld label="Algemene voorwaarden offerte">
                <textarea
                  className={textareaKlasse}
                  rows={3}
                  value={inst.offerte_voorwaarden}
                  onChange={stel('offerte_voorwaarden')}
                />
              </Veld>
              <Veld label="Algemene voorwaarden factuur">
                <textarea
                  className={textareaKlasse}
                  rows={4}
                  value={inst.factuur_voorwaarden}
                  onChange={stel('factuur_voorwaarden')}
                />
              </Veld>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <Veld label="Nalatigheidsintrest (%)">
                <input type="number" className={inputKlasse} value={inst.nalatigheidsintrest} onChange={stellNum('nalatigheidsintrest')} min={0} step={0.5} />
              </Veld>
              <Veld label="Forfait schadevergoeding (€)">
                <input type="number" className={inputKlasse} value={inst.forfait_schadevergoeding} onChange={stellNum('forfait_schadevergoeding')} min={0} />
              </Veld>
              <Veld label="Bevoegde rechtbank">
                <input className={inputKlasse} value={inst.rechtbank} onChange={stel('rechtbank')} placeholder="arrondissement Gent" />
              </Veld>
            </div>

            <div className="mt-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
              Deze voorwaarden worden automatisch onderaan elke offerte en factuur gezet.
              De parameters worden ingevuld in de tekst.
            </div>
          </div>
        </SectieKaart>

        {/* 3. Banner instellingen */}
        <SectieKaart
          icon={Megaphone}
          titel="Banner instellingen"
          subtitel="De reclamebanner bovenaan de app."
          onOpslaan={async () => {
            await slaOp(
              ['banner_zichtbaar','banner_titel','banner_subtitel'],
              setLadenBanner, setBerichtBanner, 'Banner-instellingen opgeslagen.'
            )
            window.dispatchEvent(new CustomEvent('byt-banner-update', {
              detail: {
                zichtbaar: inst.banner_zichtbaar,
                titel: inst.banner_titel,
                subtitel: inst.banner_subtitel,
              }
            }))
          }}
          laden={ladenBanner}
          bericht={berichtBanner}
          opslaanLabel="Banner-instellingen opslaan"
        >
          {/* Toggle — auto-opslaan bij wijziging */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                const nieuw = !inst.banner_zichtbaar
                setInst(prev => ({ ...prev, banner_zichtbaar: nieuw }))
                if (instId) {
                  await supabase.from('instellingen')
                    .update({ banner_zichtbaar: nieuw, bijgewerkt_op: new Date().toISOString() })
                    .eq('id', instId)
                  window.dispatchEvent(new CustomEvent('byt-banner-update', {
                    detail: { zichtbaar: nieuw, titel: inst.banner_titel, subtitel: inst.banner_subtitel }
                  }))
                }
              }}
              style={{ width: 40, height: 22, flexShrink: 0 }}
              className={`relative rounded-full transition-colors ${inst.banner_zichtbaar ? 'bg-[#e94560]' : 'bg-gray-200'}`}
            >
              <span
                className="absolute top-0.5 left-0.5 bg-white rounded-full shadow"
                style={{
                  width: 18, height: 18,
                  transform: inst.banner_zichtbaar ? 'translateX(18px)' : 'translateX(0)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
            <span className="text-sm text-gray-600">Banner tonen</span>
          </div>

          <Veld label="Bannertitel">
            <input
              className={inputKlasse}
              value={inst.banner_titel}
              onChange={stel('banner_titel')}
              placeholder="Welkom bij Build Your Tools"
            />
          </Veld>
          <Veld label="Bannerondertitel">
            <input
              className={inputKlasse}
              value={inst.banner_subtitel}
              onChange={stel('banner_subtitel')}
              placeholder="Slimme apps voor slimme bedrijven"
            />
          </Veld>

          {/* Live preview — altijd zichtbaar */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Live preview</p>
            <div
              className="rounded-xl flex flex-col items-center justify-center gap-0.5 transition-opacity"
              style={{ background: '#185FA5', height: 70, opacity: inst.banner_zichtbaar ? 1 : 0.35 }}
            >
              <p className="text-white font-bold text-sm leading-tight">
                {inst.banner_titel || 'Welkom bij Build Your Tools'}
              </p>
              <p className="text-white/80 text-xs">
                {inst.banner_subtitel || 'Slimme apps voor slimme bedrijven'}
              </p>
            </div>
            {!inst.banner_zichtbaar && (
              <p className="text-xs text-gray-400 mt-1.5 text-center">Banner is uitgeschakeld</p>
            )}
          </div>
        </SectieKaart>

        {/* 4. Beveiliging */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e94560]/10 flex items-center justify-center">
                <Shield size={16} className="text-[#e94560]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Beveiliging</p>
                <p className="text-xs text-gray-400 mt-0.5">Supabase Auth account.</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <Veld label="E-mailadres (login)">
              <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-100">
                {authEmail || '—'}
              </p>
            </Veld>
            <Veld label="Nieuw wachtwoord">
              <input
                type="password"
                className={inputKlasse}
                value={nieuwWachtwoord}
                onChange={e => setNieuwWachtwoord(e.target.value)}
                placeholder="Minimaal 6 tekens"
                style={{ maxWidth: 320 }}
              />
            </Veld>
            <div className="flex items-center gap-3">
              <button
                onClick={slaWachtwoordOp}
                disabled={ladenWw || !nieuwWachtwoord}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
                style={{ background: '#e94560' }}
              >
                {ladenWw ? 'Opslaan...' : 'Wachtwoord wijzigen'}
              </button>
              <Bericht tekst={berichtWw} />
            </div>
          </div>
        </div>

        {/* 5. Over BYT Studio */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Info size={16} className="text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Over BYT Studio</p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-2 text-sm">
              {[
                ['Versie', '0.2.0'],
                ['Gebouwd door', 'Build Your Tools'],
                ['Stack', 'React 18 + Supabase + Netlify'],
              ].map(([label, waarde]) => (
                <div key={label} className="flex justify-between text-gray-500">
                  <span>{label}</span>
                  <span className="font-medium text-gray-700">{waarde}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
