// AppHeader.jsx — Full-width merkbalk bovenaan de app
import { useLocation } from 'react-router-dom'
import { useInstellingen } from '../context/InstellingenContext'

const FALLBACK_LOGO = '/assets/logo/logo-reversed.svg'

const HEADER_STYLE = {
  flexShrink: 0,
  background: '#0B0F0E',
  padding: '0 32px',
  height: 96,
  display: 'flex',
  alignItems: 'center',
}

export default function AppHeader() {
  const { pathname } = useLocation()
  const { instellingen } = useInstellingen()
  const logoSrc = instellingen?.logo_url || FALLBACK_LOGO
  const isWelcome = pathname === '/dashboard' || pathname === '/'

  return (
    <header style={{
      ...HEADER_STYLE,
      borderBottom: isWelcome
        ? '1px solid rgba(34,195,93,0.12)'
        : '1px solid rgba(255,255,255,0.06)',
    }}>
      <img
        src={logoSrc}
        alt="Build Your Tools"
        style={{
          height: isWelcome ? 104 : 72,
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
    </header>
  )
}
