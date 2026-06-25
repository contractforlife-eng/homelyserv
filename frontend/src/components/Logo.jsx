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
        <rect width="52" height="52" rx="14" fill="url(#logoBg)" filter="url(#logoShadow)" />
        <rect x="1.5" y="1.5" width="49" height="49" rx="12.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        
        {/* Shine effect */}
        <rect width="52" height="26" rx="14" fill="url(#logoShine)" />

        {/* House - Minimalist design */}
        <path
          d="M26 13L16 22H18.5L26 16.5L33.5 22H36L26 13Z"
          fill="#ffffff"
          opacity="0.95"
        />
        <path
          d="M17.5 24H34.5V34H17.5V24Z"
          fill="#ffffff"
          opacity="0.95"
        />

        {/* Door - Modern rounded */}
        <rect x="22.5" y="28.5" width="7" height="5.5" fill="#1b5e20" rx="2" />
        <circle cx="27.5" cy="31.5" r="1.2" fill="#a5d6a7" />

        {/* Windows - Modern squares */}
        <rect x="19.5" y="25.5" width="4.5" height="4.5" fill="#1b5e20" rx="1.5" opacity="0.3" />
        <rect x="28" y="25.5" width="4.5" height="4.5" fill="#1b5e20" rx="1.5" opacity="0.3" />

        {/* Window cross lines */}
        <line x1="21.75" y1="25.5" x2="21.75" y2="30" stroke="#1b5e20" strokeWidth="0.8" opacity="0.2" />
        <line x1="19.5" y1="27.75" x2="24" y2="27.75" stroke="#1b5e20" strokeWidth="0.8" opacity="0.2" />
        <line x1="30.25" y1="25.5" x2="30.25" y2="30" stroke="#1b5e20" strokeWidth="0.8" opacity="0.2" />
        <line x1="28" y1="27.75" x2="32.5" y2="27.75" stroke="#1b5e20" strokeWidth="0.8" opacity="0.2" />

        {/* Roof detail */}
        <path
          d="M26 14.5L19.5 20H32.5L26 14.5Z"
          fill="url(#roofGrad)"
        />

        {/* Accent dot */}
        <circle cx="26" cy="12.5" r="1.8" fill="#a5d6a7" opacity="0.5" />
      </svg>

      {/* Text with elegant styling */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.05,
      }}>
        <span style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#1a3a1a',
          letterSpacing: '-0.8px',
          fontFamily: '"Inter", -apple-system, sans-serif',
        }}>
          Homely
        </span>
        <span style={{
          fontSize: '24px',
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