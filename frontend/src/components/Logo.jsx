export default function Logo() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      textDecoration: 'none',
    }}>
      {/* Advanced SVG Logo */}
      <svg
        width="52"
        height="52"
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2e7d32', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#388e3c', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1b5e20', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="logoShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.3)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0)', stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a5d6a7', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#66bb6a', stopOpacity: 0.7 }} />
          </linearGradient>
          <filter id="logoShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.2)"/>
          </filter>
        </defs>

        {/* Rounded Square Background */}
        <rect width="52" height="52" rx="14" fill="url(#logoBg)" filter="url(#logoShadow)" />
        
        {/* Shine Effect */}
        <rect width="52" height="26" rx="14" fill="url(#logoShine)" />
        
        {/* Border */}
        <rect x="1.5" y="1.5" width="49" height="49" rx="12.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

        {/* House Body */}
        <path
          d="M26 12L15 22H18L26 16L34 22H37L26 12Z"
          fill="#ffffff"
        />

        {/* House Base */}
        <path
          d="M17 24H35V35H17V24Z"
          fill="#ffffff"
        />

        {/* Door */}
        <rect x="23" y="29" width="6" height="6" fill="#1b5e20" rx="2" />
        <circle cx="27.5" cy="32" r="1.2" fill="#a5d6a7" />

        {/* Windows */}
        <rect x="19" y="25" width="4.5" height="4.5" fill="#1b5e20" rx="1.5" opacity="0.35" />
        <rect x="28.5" y="25" width="4.5" height="4.5" fill="#1b5e20" rx="1.5" opacity="0.35" />

        {/* Roof Detail */}
        <path
          d="M26 14L19 20H33L26 14Z"
          fill="url(#roofGrad)"
        />

        {/* Small decorative elements */}
        <circle cx="26" cy="11.5" r="1.5" fill="#a5d6a7" opacity="0.6" />
        
        {/* Window crosses */}
        <line x1="21.25" y1="25" x2="21.25" y2="29.5" stroke="#1b5e20" strokeWidth="0.8" opacity="0.3" />
        <line x1="19" y1="27.25" x2="23.5" y2="27.25" stroke="#1b5e20" strokeWidth="0.8" opacity="0.3" />
        <line x1="30.75" y1="25" x2="30.75" y2="29.5" stroke="#1b5e20" strokeWidth="0.8" opacity="0.3" />
        <line x1="28.5" y1="27.25" x2="33" y2="27.25" stroke="#1b5e20" strokeWidth="0.8" opacity="0.3" />
      </svg>

      {/* Text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.1,
      }}>
        <span style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#1a3a1a',
          letterSpacing: '-0.5px',
          textShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
          Homely
        </span>
        <span style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#2e7d32',
          letterSpacing: '-0.5px',
          textShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
          Serv
        </span>
      </div>
    </div>
  );
}