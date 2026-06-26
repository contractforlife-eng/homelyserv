export default function Logo() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      textDecoration: 'none',
    }}>
      {/* Sophisticated SVG Logo */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
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
            <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.25)', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: 'rgba(255,255,255,0.05)', stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0)', stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a5d6a7', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#66bb6a', stopOpacity: 0.7 }} />
          </linearGradient>
          <filter id="logoShadow">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="rgba(0,0,0,0.2)"/>
          </filter>
        </defs>

        {/* Background with subtle border */}
        <rect width="48" height="48" rx="14" fill="url(#logoBg)" filter="url(#logoShadow)" />
        <rect x="1.5" y="1.5" width="45" height="45" rx="12.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        
        {/* Shine effect */}
        <rect width="48" height="24" rx="14" fill="url(#logoShine)" />

        {/* House - Minimalist design */}
        <path
          d="M24 12L15 21H17.5L24 15.5L30.5 21H33L24 12Z"
          fill="#ffffff"
          opacity="0.95"
        />
        <path
          d="M16 23H32V32H16V23Z"
          fill="#ffffff"
          opacity="0.95"
        />

        {/* Door - Modern rounded */}
        <rect x="21" y="27" width="6" height="5" fill="#1b5e20" rx="2" />
        <circle cx="25.5" cy="29.5" r="1.2" fill="#a5d6a7" />

        {/* Windows - Modern squares */}
        <rect x="18.5" y="24.5" width="4" height="4" fill="#1b5e20" rx="1.5" opacity="0.3" />
        <rect x="25.5" y="24.5" width="4" height="4" fill="#1b5e20" rx="1.5" opacity="0.3" />

        {/* Window cross lines */}
        <line x1="20.5" y1="24.5" x2="20.5" y2="28.5" stroke="#1b5e20" strokeWidth="0.8" opacity="0.2" />
        <line x1="18.5" y1="26.5" x2="22.5" y2="26.5" stroke="#1b5e20" strokeWidth="0.8" opacity="0.2" />
        <line x1="27.5" y1="24.5" x2="27.5" y2="28.5" stroke="#1b5e20" strokeWidth="0.8" opacity="0.2" />
        <line x1="25.5" y1="26.5" x2="29.5" y2="26.5" stroke="#1b5e20" strokeWidth="0.8" opacity="0.2" />

        {/* Roof detail */}
        <path
          d="M24 13.5L18.5 19H29.5L24 13.5Z"
          fill="url(#roofGrad)"
        />

        {/* Accent dot */}
        <circle cx="24" cy="11.5" r="1.8" fill="#a5d6a7" opacity="0.5" />
      </svg>

      {/* Text with elegant styling */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.05,
      }}>
        <span style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#1a3a1a',
          letterSpacing: '-0.8px',
          fontFamily: '"Inter", -apple-system, sans-serif',
        }}>
          Homely
        </span>
        <span style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#2e7d32',
          letterSpacing: '-0.8px',
          fontFamily: '"Inter", -apple-system, sans-serif',
        }}>
          Serv
        </span>
      </div>
    </div>
  );
}