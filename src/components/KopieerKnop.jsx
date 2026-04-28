// KopieerKnop.jsx
import { useState } from 'react'
import { Copy, CheckCircle } from 'lucide-react'

export default function KopieerKnop({ tekst, label = 'Kopieer' }) {
  const [gekopieerd, setGekopieerd] = useState(false)

  async function kopieer() {
    await navigator.clipboard.writeText(tekst)
    setGekopieerd(true)
    setTimeout(() => setGekopieerd(false), 2000)
  }

  return (
    <button
      onClick={kopieer}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: 600,
        transition: 'all 0.15s',
        background: gekopieerd ? '#dcfce7' : '#e5e7eb',
        color: gekopieerd ? '#15803d' : '#6b7280',
      }}
    >
      {gekopieerd ? <CheckCircle size={11} /> : <Copy size={11} />}
      {gekopieerd ? 'Gekopieerd' : label}
    </button>
  )
}
