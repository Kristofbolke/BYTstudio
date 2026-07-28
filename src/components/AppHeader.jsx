// AppHeader.jsx — Full-width merkbalk bovenaan de app
// variant="welcome"  → groot logo + welkomsttekst + tagline (enkel op Dashboard)
// variant="compact"  → alleen groot logo (alle andere pagina's)
// Variant wordt automatisch bepaald via route.
import { useLocation } from 'react-router-dom'

export default function AppHeader() {
  const { pathname } = useLocation()
  const isWelcome = pathname === '/dashboard' || pathname === '/'

  return isWelcome ? <WelcomeHeader /> : <CompactHeader />
}

const HEADER_STYLE = {
  flexShrink: 0,
  background: '#0B0F0E',
  padding: '0 32px',
  height: 80,
  display: 'flex',
  alignItems: 'center',
  gap: 28,
}

// ── Welcome-variant (Dashboard) ───────────────────────────────────────────────
function WelcomeHeader() {
  return (
    <header style={{ ...HEADER_STYLE, borderBottom: '1px solid rgba(34,195,93,0.12)' }}>
      <img
        src="/assets/logo/logo-reversed.svg"
        alt="Build Your Tools"
        style={{ height: 104, width: 208, objectFit: 'contain', flexShrink: 0 }}
      />
    </header>
  )
}

// ── Compact-variant (alle andere pagina's) ────────────────────────────────────
function CompactHeader() {
  return (
    <header style={{ ...HEADER_STYLE, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <img
        src="/assets/logo/logo-reversed.svg"
        alt="Build Your Tools"
        style={{ height: 60, objectFit: 'contain' }}
      />
    </header>
  )
}
