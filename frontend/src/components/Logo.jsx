export default function Logo() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      textDecoration: 'none',
    }}>
      {/* SVG Logo */}
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Background */}
        <rect width="44" height="44" rx="12" fill="#2e7d32" />
        
        {/* House shape */}
        <path
          d="M22 8L8 20H11V34H18V24H26V34H33V20H36L22 8Z"
          fill="white"
          opacity="0.9"
        />
        
        {/* Door */}
        <rect x="19" y="26" width="6" height="8" fill="#1b5e20" rx="1" />
        
        {/* Door handle */}
        <circle cx="23" cy="30" r="1" fill="#a5d6a7" />
        
        {/* Roof highlight */}
        <path
          d="M22 11L10 21H14L22 14L30 21H34L22 11Z"
          fill="#4caf50"
          opacity="0.3"
        />
      </svg>

      {/* Text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.1,
      }}>
        <span style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.5px',
        }}>
          Homely
        </span>
        <span style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#a5d6a7',
          letterSpacing: '-0.5px',
        }}>
          Serv
        </span>
      </div>
    </div>
  );
}