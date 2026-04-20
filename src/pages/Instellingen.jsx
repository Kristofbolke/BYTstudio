// src/pages/Instellingen.jsx — Persoonlijke configuratie voor de developer/eigenaar
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageWrapper from '../components/PageWrapper'
import { useInstellingen } from '../context/InstellingenContext'
import { Building2, CreditCard, Megaphone, Settings, CheckCircle, AlertCircle, Download, LogOut, Trash2 } from 'lucide-react'

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
  standaard_projectstatus: 'intake',
  standaard_handleiding_versie: 'v1.0',
  standaard_auteur_handleiding: 'Build Your Tools',
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
  useEffect(() => { document.title = 'Instellingen — BYT Studio' }, [])
  const navigate = useNavigate()
  const { herlaad } = useInstellingen()
  const [inst, setInst] = useState(LEGE_INST)
  const [instId, setInstId] = useState(null)
  const [laden, setLaden] = useState(true)
  const [authEmail, setAuthEmail] = useState('')

  // Per-sectie laden en bericht
  const [ladenBedrijf, setLadenBedrijf] = useState(false)
  const [berichtBedrijf, setBerichtBedrijf] = useState('')
  const [ladenFinancieel, setLadenFinancieel] = useState(false)
  const [berichtFinancieel, setBerichtFinancieel] = useState('')
  const [ladenBanner, setLadenBanner] = useState(false)
  const [berichtBanner, setBerichtBanner] = useState('')
  const [ladenApp, setLadenApp] = useState(false)
  const [berichtApp, setBerichtApp] = useState('')

  // App-beheer UI-staat
  const [resetVerzonden, setResetVerzonden] = useState(false)
  const [exporterenKlanten, setExporterenKlanten] = useState(false)
  const [exporterenProjecten, setExporterenProjecten] = useState(false)
  const [verwijderTekst, setVerwijderTekst] = useState('')
  const [verwijderDialog, setVerwijderDialog] = useState(false)
  const [verwijderLaden, setVerwijderLaden] = useState(false)
  const [verwijderBericht, setVerwijderBericht] = useState('')

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
    else { setBerichtFn(succesMsg); herlaad() }
    setLadenFn(false)
  }

  async function stuurResetLink() {
    if (!authEmail) return
    setResetVerzonden(false)
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail)
    if (!error) setResetVerzonden(true)
  }

  function downloadCsv(bestandsnaam, rijen, kolommen) {
    const header = kolommen.join(';')
    const body = rijen.map(r => kolommen.map(k => `"${(r[k] ?? '').toString().replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = bestandsnaam; a.click()
    URL.revokeObjectURL(url)
  }

  async function exporteerKlanten() {
    setExporterenKlanten(true)
    const { data } = await supabase.from('klanten').select('naam,bedrijfsnaam,btw_nummer,adres,email,telefoon,sector,aangemaakt_op').order('aangemaakt_op')
    if (data) downloadCsv('klanten.csv', data, ['naam','bedrijfsnaam','btw_nummer','adres','email','telefoon','sector','aangemaakt_op'])
    setExporterenKlanten(false)
  }

  async function exporteerProjecten() {
    setExporterenProjecten(true)
    const { data } = await supabase.from('projecten').select('naam,status,github_url,netlify_url,aangemaakt_op,klanten(naam)').order('aangemaakt_op')
    if (data) {
      const rijen = data.map(p => ({ ...p, klantnaam: p.klanten?.naam ?? '' }))
      downloadCsv('projecten.csv', rijen, ['naam','klantnaam','status','github_url','netlify_url','aangemaakt_op'])
    }
    setExporterenProjecten(false)
  }

  async function verwijderTestdata() {
    if (verwijderTekst !== 'VERWIJDER') return
    setVerwijderLaden(true)
    setVerwijderBericht('')
    const patroon = ['%(test)%', '%(demo)%']
    for (const p of patroon) {
      await supabase.from('handleidingen').delete().ilike('project_id', '%') // via projecten
      await supabase.from('offertes').delete().ilike('naam', p)
      await supabase.from('projecten').delete().ilike('naam', p)
      await supabase.from('klanten').delete().ilike('naam', p)
    }
    setVerwijderBericht('Testdata verwijderd.')
    setVerwijderTekst('')
    setVerwijderDialog(false)
    setVerwijderLaden(false)
  }

  async function uitloggen() {
    await supabase.auth.signOut()
    navigate('/login')
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
          onOpslaan={() => slaOp(
            ['banner_zichtbaar','banner_titel','banner_subtitel'],
            setLadenBanner, setBerichtBanner, 'Banner-instellingen opgeslagen.'
          )}
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
                  herlaad()
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

        {/* 4. App-beheer */}
        <SectieKaart
          icon={Settings}
          titel="App-beheer"
          subtitel="Technische instellingen en beheer van de BYT Studio applicatie."
          onOpslaan={() => slaOp(
            ['standaard_projectstatus','standaard_handleiding_versie','standaard_auteur_handleiding'],
            setLadenApp, setBerichtApp, 'App-instellingen opgeslagen.'
          )}
          laden={ladenApp}
          bericht={berichtApp}
          opslaanLabel="App-instellingen opslaan"
        >
          {/* — Subsectie 1: Account — */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Account</p>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Ingelogd als</p>
                <p className="text-sm font-medium text-gray-800">{authEmail || '—'}</p>
              </div>
              <button
                onClick={stuurResetLink}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:border-[#e94560] hover:text-[#e94560] transition-colors"
              >
                Wachtwoord wijzigen
              </button>
            </div>
            {resetVerzonden && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg mt-2">
                <CheckCircle size={13} />
                Reset-link verzonden naar {authEmail}
              </div>
            )}
          </div>

          {/* — Subsectie 2: Standaard projectinstellingen — */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Standaard projectinstellingen</p>
            <div className="grid grid-cols-3 gap-4">
              <Veld label="Standaard projectstatus bij aanmaken">
                <select
                  className={inputKlasse}
                  value={inst.standaard_projectstatus}
                  onChange={stel('standaard_projectstatus')}
                >
                  <option value="intake">intake</option>
                  <option value="offerte">offerte</option>
                  <option value="in_ontwikkeling">in_ontwikkeling</option>
                </select>
              </Veld>
              <Veld label="Standaard handleidingsversie">
                <select
                  className={inputKlasse}
                  value={inst.standaard_handleiding_versie}
                  onChange={stel('standaard_handleiding_versie')}
                >
                  <option value="v1.0">v1.0</option>
                  <option value="v1">v1</option>
                  <option value="">Geen versienummer</option>
                </select>
              </Veld>
              <Veld label="Standaard auteursnaam handleidingen">
                <input
                  className={inputKlasse}
                  value={inst.standaard_auteur_handleiding}
                  onChange={stel('standaard_auteur_handleiding')}
                  placeholder="Build Your Tools"
                />
              </Veld>
            </div>
          </div>

          {/* — Subsectie 3: Data en backup — */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Data en backup</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={exporteerKlanten}
                disabled={exporterenKlanten}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-[#e94560] hover:text-[#e94560] disabled:opacity-50 transition-colors"
              >
                <Download size={14} />
                {exporterenKlanten ? 'Exporteren...' : 'Exporteer alle klanten als CSV'}
              </button>
              <button
                onClick={exporteerProjecten}
                disabled={exporterenProjecten}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-[#e94560] hover:text-[#e94560] disabled:opacity-50 transition-colors"
              >
                <Download size={14} />
                {exporterenProjecten ? 'Exporteren...' : 'Exporteer alle projecten als CSV'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Supabase maakt automatisch dagelijkse backups van alle data (Pro plan).<br />
              Op het Free plan: exporteer regelmatig via de knoppen hierboven.
            </p>
          </div>

          {/* — Subsectie 4: Gevaarzone — */}
          <div className="border-t border-gray-100 pt-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Gevaarzone — niet omkeerbaar</p>

              {!verwijderDialog ? (
                <button
                  onClick={() => { setVerwijderDialog(true); setVerwijderBericht('') }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={14} />
                  Alle testdata verwijderen
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-700">
                    Dit verwijdert alle klanten, projecten, offertes en handleidingen die zijn aangemaakt voor testdoeleinden.
                    Typ <strong>VERWIJDER</strong> om te bevestigen.
                  </p>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-red-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    placeholder="Typ VERWIJDER"
                    value={verwijderTekst}
                    onChange={e => setVerwijderTekst(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={verwijderTestdata}
                      disabled={verwijderTekst !== 'VERWIJDER' || verwijderLaden}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-red-700 transition-colors"
                    >
                      {verwijderLaden ? 'Verwijderen...' : 'Bevestig verwijdering'}
                    </button>
                    <button
                      onClick={() => { setVerwijderDialog(false); setVerwijderTekst('') }}
                      className="px-4 py-2 rounded-lg border border-red-200 bg-white text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                  {verwijderBericht && (
                    <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">{verwijderBericht}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Uitloggen — losgekoppeld van opslaan-knop */}
          <div className="border-t border-gray-100 pt-4 flex justify-end">
            <button
              onClick={uitloggen}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <LogOut size={14} />
              Uitloggen
            </button>
          </div>
        </SectieKaart>

      </div>
    </PageWrapper>
  )
}
