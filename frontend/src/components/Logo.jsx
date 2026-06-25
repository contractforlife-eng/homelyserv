export default function Logo() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      textDecoration: 'none',
    }}>
      {/* SVG Logo - Improved visibility */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Background - Light green for contrast */}
        <rect width="48" height="48" rx="14" fill="#2e7d32" />
        
        {/* White border for definition */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="#2e7d32" stroke="#4caf50" strokeWidth="1.5" />
        
        {/* House body */}
        <path
          d="M24 10L10 22H13V36H20V26H28V36H35V22H38L24 10Z"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="0.5"
        />
        
        {/* Roof */}
        <path
          d="M24 13L14 21H16L24 16L32 21H34L24 13Z"
          fill="#a5d6a7"
          opacity="0.8"
        />
        
        {/* Door */}
        <rect x="21" y="28" width="6" height="8" fill="#1b5e20" rx="1" />
        
        {/* Door handle */}
        <circle cx="25" cy="32" r="1.5" fill="#a5d6a7" />
        
        {/* Window */}
        <rect x="15" y="18" width="5" height="5" fill="#a5d6a7" rx="1" opacity="0.6" />
        <rect x="28" y="18" width="5" height="5" fill="#a5d6a7" rx="1" opacity="0.6" />
        
        {/* Chimney */}
        <rect x="31" y="12" width="4" height="6" fill="#4caf50" rx="1" opacity="0.5" />
      </svg>

      {/* Text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.1,
      }}>
        <span style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.5px',
          textShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}>
          Homely
        </span>
        <span style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#a5d6a7',
          letterSpacing: '-0.5px',
          textShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}>
          Serv
        </span>
      </div>
    </div>
  );
}