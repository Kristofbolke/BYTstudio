// Login.jsx — Premium BYT-branded inlogpagina
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const BYT_GREEN = '#78C833'

export default function Login() {
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setFout('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord })
    if (error) setFout('Ongeldig e-mailadres of wachtwoord.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0a' }}>

      {/* Links: decoratief brand-paneel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{ background: '#111111', borderRight: '1px solid #1a1a1a' }}>

        {/* Logo groot */}
        <div>
          <div className="bg-white rounded-2xl px-6 py-4 inline-block shadow-xl mb-8">
            <img src="/logo-byt.png" alt="Build Your Tools" style={{ height: 60, objectFit: 'contain' }} />
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
          <div className="lg:hidden mb-10 flex justify-center">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl">
              <img src="/logo-byt.png" alt="Build Your Tools" style={{ height: 48, objectFit: 'contain' }} />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-white text-2xl font-bold">Welkom terug</h1>
            <p className="text-sm mt-1" style={{ color: '#4b5563' }}>Log in op BYT Studio</p>
          </div>

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
          </form>

          <p className="text-center text-xs mt-8" style={{ color: '#1f2937' }}>
            Build Your Tools © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
