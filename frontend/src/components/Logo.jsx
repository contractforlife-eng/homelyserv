export default function Logo() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      textDecoration: 'none',
    }}>
      {/* Elegant SVG Logo */}
      <svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Gradient Background */}
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2e7d32', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1b5e20', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a5d6a7', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#81c784', stopOpacity: 0.6 }} />
          </linearGradient>
        </defs>

        {/* Rounded Square Background */}
        <rect width="50" height="50" rx="14" fill="url(#logoGrad)" />
        <rect x="1.5" y="1.5" width="47" height="47" rx="12.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

        {/* House Body */}
        <path
          d="M25 11L14 21H16.5L25 15L33.5 21H36L25 11Z"
          fill="#ffffff"
          opacity="0.95"
        />

        {/* House Base */}
        <path
          d="M16 23H34V34H16V23Z"
          fill="#ffffff"
          opacity="0.95"
        />

        {/* Door */}
        <rect x="22" y="28" width="6" height="6" fill="#1b5e20" rx="2" />
        <circle cx="26.5" cy="31" r="1" fill="#a5d6a7" />

        {/* Windows */}
        <rect x="18" y="24" width="4" height="4" fill="#1b5e20" rx="1" opacity="0.4" />
        <rect x="28" y="24" width="4" height="4" fill="#1b5e20" rx="1" opacity="0.4" />

        {/* Roof Line */}
        <path
          d="M25 13L18 19H32L25 13Z"
          fill="url(#roofGrad)"
        />

        {/* Small decorative dot */}
        <circle cx="25" cy="11" r="1.5" fill="#a5d6a7" opacity="0.5" />
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
        }}>
          Homely
        </span>
        <span style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#2e7d32',
          letterSpacing: '-0.5px',
        }}>
          Serv
        </span>
      </div>
    </div>
  );
}