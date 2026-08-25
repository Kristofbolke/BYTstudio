// WachtwoordInstellen.jsx — Landingspagina voor uitnodigings- en herstel-links.
// Een nieuwe gebruiker komt hier vanuit de e-maillink (invite of password recovery),
// kiest een wachtwoord en activeert zo zijn account. Daarna is hij ingelogd.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const BYT_GREEN = '#22C35D'

// Leest zowel de query (?token_hash=…&type=…) als de hash (#access_token=…&type=…)
function leesUrlParams() {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const get = k => query.get(k) ?? hash.get(k)
  return {
    token_hash: get('token_hash'),
    type: get('type'),
    error: get('error'),
    error_code: get('error_code'),
    error_description: get('error_description'),
  }
}

export default function WachtwoordInstellen() {
  const navigate = useNavigate()

  // status: 'controleren' | 'klaar' (toon formulier) | 'ongeldig' | 'succes'
  const [status, setStatus] = useState('controleren')
  const [foutMelding, setFoutMelding] = useState('')
  const [isHerstel, setIsHerstel] = useState(false)   // recovery vs. invite (enkel voor teksten)

  const [wachtwoord, setWachtwoord] = useState('')
  const [bevestig, setBevestig] = useState('')
  const [bezig, setBezig] = useState(false)
  const [formFout, setFormFout] = useState('')

  useEffect(() => {
    let afgehandeld = false

    async function init() {
      const p = leesUrlParams()

      // 1. Expliciete fout in de link (bv. verlopen token)
      if (p.error || p.error_code) {
        setFoutMelding(mensvriendelijkeFout(p.error_code, p.error_description))
        setStatus('ongeldig')
        return
      }

      if (p.type === 'recovery') setIsHerstel(true)

      // 2. token_hash + type in de query → expliciet verifiëren (aanbevolen invite-flow)
      if (p.token_hash && p.type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: p.token_hash,
          type: p.type,
        })
        if (afgehandeld) return
        if (error) {
          setFoutMelding(mensvriendelijkeFout(error.code, error.message))
          setStatus('ongeldig')
        } else {
          setStatus('klaar')
        }
        return
      }

      // 3. Impliciete flow: supabase-js heeft de tokens uit de hash al opgepikt
      //    (detectSessionInUrl). Controleer of er een sessie is.
      const { data } = await supabase.auth.getSession()
      if (afgehandeld) return
      if (data.session) {
        setStatus('klaar')
        return
      }

      // 4. Nog geen sessie — wacht kort op een auth-event (hash wordt async verwerkt)
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          if (event === 'PASSWORD_RECOVERY') setIsHerstel(true)
          afgehandeld = true
          setStatus('klaar')
        }
      })

      // Vangnet: als er na 4s nog niets is, is de link ongeldig of verlopen
      setTimeout(() => {
        if (afgehandeld) return
        supabase.auth.getSession().then(({ data: d }) => {
          if (afgehandeld) return
          if (d.session) setStatus('klaar')
          else {
            setFoutMelding('Deze link is ongeldig of verlopen. Vraag een nieuwe uitnodiging of herstel-link aan.')
            setStatus('ongeldig')
          }
        })
      }, 4000)

      return () => sub.subscription.unsubscribe()
    }

    init()
    return () => { afgehandeld = true }
  }, [])

  function mensvriendelijkeFout(code, beschrijving) {
    const c = (code || '').toLowerCase()
    const b = (beschrijving || '').toLowerCase()
    if (c.includes('expired') || b.includes('expired') || c === 'otp_expired') {
      return 'Deze link is verlopen. Vraag een nieuwe uitnodiging of herstel-link aan.'
    }
    if (c.includes('invalid') || b.includes('invalid')) {
      return 'Deze link is ongeldig. Mogelijk is ze al gebruikt. Vraag zo nodig een nieuwe aan.'
    }
    return 'Deze link kon niet gebruikt worden. Vraag een nieuwe uitnodiging of herstel-link aan.'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormFout('')
    if (wachtwoord.length < 8) { setFormFout('Kies een wachtwoord van minstens 8 tekens.'); return }
    if (wachtwoord !== bevestig) { setFormFout('De wachtwoorden komen niet overeen.'); return }

    setBezig(true)
    const { error } = await supabase.auth.updateUser({ password: wachtwoord })
    setBezig(false)
    if (error) {
      if ((error.message || '').toLowerCase().includes('should be different')) {
        setFormFout('Kies een ander wachtwoord dan je vorige.')
      } else {
        setFormFout('Kon het wachtwoord niet instellen: ' + error.message)
      }
      return
    }
    setStatus('succes')
    setTimeout(() => navigate('/dashboard', { replace: true }), 1400)
  }

  const inputStijl = {
    background: '#161616', border: '1px solid #222',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0B0F0E' }}>
      <div className="w-full max-w-sm">

        <div className="mb-8 flex justify-center">
          <img src="/assets/logo/studio-byt-logo-negative.svg" alt="Build Your Tools"
            style={{ height: 80, objectFit: 'contain', maxWidth: '100%' }} />
        </div>

        {status === 'controleren' && (
          <div className="text-center" style={{ color: '#4b5563' }}>
            <div className="mx-auto mb-4" style={{
              width: 22, height: 22, borderRadius: '50%',
              border: `2px solid ${BYT_GREEN}`, borderTopColor: 'transparent',
              animation: 'byt-spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes byt-spin { to { transform: rotate(360deg); } }`}</style>
            <p className="text-sm">Uitnodiging controleren…</p>
          </div>
        )}

        {status === 'ongeldig' && (
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold mb-2">Link niet geldig</h1>
            <div className="px-4 py-4 rounded-xl text-sm text-red-300 border mb-6"
              style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
              {foutMelding}
            </div>
            <button onClick={() => navigate('/login', { replace: true })}
              className="w-full py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${BYT_GREEN}, #5aab1a)` }}>
              Naar inloggen
            </button>
          </div>
        )}

        {status === 'succes' && (
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold mb-2">Account geactiveerd</h1>
            <p className="text-sm" style={{ color: '#4b5563' }}>Je wordt doorgestuurd…</p>
          </div>
        )}

        {status === 'klaar' && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-white text-2xl font-bold">
                {isHerstel ? 'Nieuw wachtwoord' : 'Welkom bij BYT Studio'}
              </h1>
              <p className="text-sm mt-1" style={{ color: '#4b5563' }}>
                {isHerstel
                  ? 'Kies een nieuw wachtwoord voor je account.'
                  : 'Kies een wachtwoord om je account te activeren.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4b5563' }}>
                  Wachtwoord
                </label>
                <input
                  type="password" value={wachtwoord} onChange={e => setWachtwoord(e.target.value)}
                  required placeholder="Minstens 8 tekens" autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-700 outline-none transition-all"
                  style={inputStijl}
                  onFocus={e => { e.target.style.borderColor = BYT_GREEN; e.target.style.boxShadow = `0 0 0 3px ${BYT_GREEN}18` }}
                  onBlur={e => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4b5563' }}>
                  Bevestig wachtwoord
                </label>
                <input
                  type="password" value={bevestig} onChange={e => setBevestig(e.target.value)}
                  required placeholder="Herhaal je wachtwoord" autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-700 outline-none transition-all"
                  style={inputStijl}
                  onFocus={e => { e.target.style.borderColor = BYT_GREEN; e.target.style.boxShadow = `0 0 0 3px ${BYT_GREEN}18` }}
                  onBlur={e => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {formFout && (
                <div className="px-4 py-3 rounded-xl text-sm text-red-300 border"
                  style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                  {formFout}
                </div>
              )}

              <button type="submit" disabled={bezig}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 mt-2"
                style={{ background: `linear-gradient(135deg, ${BYT_GREEN}, #5aab1a)`, boxShadow: `0 4px 20px ${BYT_GREEN}30` }}>
                {bezig ? 'Bezig…' : isHerstel ? 'Wachtwoord opslaan →' : 'Account activeren →'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs mt-8" style={{ color: '#1f2937' }}>
          Build Your Tools © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
