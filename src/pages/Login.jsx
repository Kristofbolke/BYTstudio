// Login.jsx — Inlogpagina via Supabase Auth (e-mail + wachtwoord)
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setFout('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: wachtwoord,
    })
    if (error) setFout('Ongeldig e-mailadres of wachtwoord.')
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0f172a' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo & titel */}
        <div className="text-center mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: '#e94560' }}
          >
            <span className="text-white font-black text-2xl tracking-tight">B</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">BYT Studio</h1>
          <p className="text-sm mt-1.5" style={{ color: '#64748b' }}>
            Build Your Tools — intern platform
          </p>
        </div>

        {/* Formulier */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: '#64748b' }}
            >
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="jij@buildyourtools.be"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition"
              style={{ background: '#1e293b', border: '1px solid #1e293b' }}
              onFocus={e => (e.target.style.borderColor = '#e94560')}
              onBlur={e => (e.target.style.borderColor = '#1e293b')}
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: '#64748b' }}
            >
              Wachtwoord
            </label>
            <input
              type="password"
              value={wachtwoord}
              onChange={e => setWachtwoord(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition"
              style={{ background: '#1e293b', border: '1px solid #1e293b' }}
              onFocus={e => (e.target.style.borderColor = '#e94560')}
              onBlur={e => (e.target.style.borderColor = '#1e293b')}
            />
          </div>

          {fout && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-300 bg-red-500/10 border border-red-500/20">
              {fout}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 mt-2"
            style={{ background: '#e94560' }}
          >
            {loading ? 'Inloggen...' : 'Inloggen →'}
          </button>
        </form>
      </div>
    </div>
  )
}
