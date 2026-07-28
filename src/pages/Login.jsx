// Login.jsx — Premium BYT-branded inlogpagina
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const BYT_GREEN = '#22C35D'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')
  const [resetModus, setResetModus] = useState(false)
  const [resetVerstuurd, setResetVerstuurd] = useState(false)
  const [resetLaden, setResetLaden] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setFout('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord })
    if (error) {
      setFout('Ongeldig e-mailadres of wachtwoord.')
      setLoading(false)
    } else {
      onLogin?.(data.user)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    if (!email) { setFout('Vul eerst je e-mailadres in.'); return }
    setResetLaden(true)
    setFout('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/instellingen`,
    })
    setResetLaden(false)
    if (error) setFout('Kon de e-mail niet versturen. Controleer het e-mailadres.')
    else setResetVerstuurd(true)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0B0F0E' }}>

      {/* Links: decoratief brand-paneel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{ background: '#111111', borderRight: '1px solid #1a1a1a' }}>

        {/* Logo groot */}
        <div>
          <div className="mb-8">
            <img src="/assets/logo/logo-reversed.svg" alt="Build Your Tools" style={{ height: 104, width: 208, objectFit: 'contain' }} />
          </div>
          <h2 className="text-white text-3xl font-bold leading-tight mt-2">
            Intern platform<br />
            <span style={{ color: BYT_GREEN }}>voor builders.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: '#4b5563' }}>
            Beheer klanten, projecten en offertes.<br />
            Configureer apps met AI-ondersteuning.
          </p>
        </div>

        {/* Code decoratie */}
        <div className="space-y-1.5 font-mono text-xs" style={{ color: '#1f2937' }}>
          <p><span style={{ color: BYT_GREEN }}>{'<'}</span> build_your_tools <span style={{ color: BYT_GREEN }}>{'>'}</span></p>
          <p style={{ paddingLeft: 16 }}>version: <span style={{ color: '#4b5563' }}>2.0.0</span></p>
          <p style={{ paddingLeft: 16 }}>status: <span style={{ color: BYT_GREEN }}>online</span></p>
          <p><span style={{ color: BYT_GREEN }}>{'</'}</span> build_your_tools <span style={{ color: BYT_GREEN }}>{'>'}</span></p>
        </div>
      </div>

      {/* Rechts: loginformulier */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex justify-start">
            <img src="/assets/logo/logo-reversed.svg" alt="Build Your Tools" style={{ height: 80, objectFit: 'contain' }} />
          </div>

          <div className="mb-8">
            <h1 className="text-white text-2xl font-bold">Welkom terug</h1>
            <p className="text-sm mt-1" style={{ color: '#4b5563' }}>Log in op BYT Studio</p>
          </div>

          {resetVerstuurd ? (
            <div className="px-4 py-4 rounded-xl text-sm text-green-300 border text-center"
              style={{ background: 'rgba(34,195,93,0.08)', borderColor: 'rgba(34,195,93,0.2)' }}>
              ✓ E-mail verstuurd naar <strong>{email}</strong>.<br />
              Controleer je inbox en volg de link om je wachtwoord in te stellen.
              <button onClick={() => { setResetModus(false); setResetVerstuurd(false) }}
                className="block mx-auto mt-3 text-xs underline" style={{ color: '#4b5563' }}>
                Terug naar inloggen
              </button>
            </div>
          ) : resetModus ? (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm" style={{ color: '#4b5563' }}>
                Vul je e-mailadres in. Je ontvangt een link om een nieuw wachtwoord in te stellen.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4b5563' }}>
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="jij@buildyourtools.be"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-700 outline-none transition-all"
                  style={{ background: '#161616', border: '1px solid #222' }}
                  onFocus={e => { e.target.style.borderColor = BYT_GREEN; e.target.style.boxShadow = `0 0 0 3px ${BYT_GREEN}18` }}
                  onBlur={e => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              {fout && (
                <div className="px-4 py-3 rounded-xl text-sm text-red-300 border"
                  style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                  {fout}
                </div>
              )}
              <button type="submit" disabled={resetLaden}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${BYT_GREEN}, #5aab1a)`, boxShadow: `0 4px 20px ${BYT_GREEN}30` }}>
                {resetLaden ? 'Versturen...' : 'Reset-link versturen →'}
              </button>
              <button type="button" onClick={() => { setResetModus(false); setFout('') }}
                className="w-full text-center text-xs mt-1" style={{ color: '#4b5563' }}>
                ← Terug naar inloggen
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: '#4b5563' }}>
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="jij@buildyourtools.be"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-700 outline-none transition-all"
                  style={{ background: '#161616', border: '1px solid #222' }}
                  onFocus={e => { e.target.style.borderColor = BYT_GREEN; e.target.style.boxShadow = `0 0 0 3px ${BYT_GREEN}18` }}
                  onBlur={e => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: '#4b5563' }}>
                  Wachtwoord
                </label>
                <input
                  type="password"
                  value={wachtwoord}
                  onChange={e => setWachtwoord(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-700 outline-none transition-all"
                  style={{ background: '#161616', border: '1px solid #222' }}
                  onFocus={e => { e.target.style.borderColor = BYT_GREEN; e.target.style.boxShadow = `0 0 0 3px ${BYT_GREEN}18` }}
                  onBlur={e => { e.target.style.borderColor = '#222'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {fout && (
                <div className="px-4 py-3 rounded-xl text-sm text-red-300 border"
                  style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                  {fout}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 mt-2"
                style={{
                  background: `linear-gradient(135deg, ${BYT_GREEN}, #5aab1a)`,
                  boxShadow: `0 4px 20px ${BYT_GREEN}30`,
                }}
                onMouseEnter={e => { if (!loading) e.target.style.opacity = '0.9' }}
                onMouseLeave={e => { e.target.style.opacity = '1' }}
              >
                {loading ? 'Bezig met inloggen...' : 'Inloggen →'}
              </button>

              <button type="button" onClick={() => { setResetModus(true); setFout('') }}
                className="w-full text-center text-xs mt-1" style={{ color: '#4b5563' }}>
                Wachtwoord vergeten?
              </button>
            </form>
          )}

          <p className="text-center text-xs mt-8" style={{ color: '#1f2937' }}>
            Build Your Tools © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
