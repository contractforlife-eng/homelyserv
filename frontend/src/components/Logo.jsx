export default function Logo() {
  return (
    <div className="logo-container" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        fontSize: '28px',
        background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)',
      }}>
        🏠
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.1,
      }}>
        <span style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#fff',
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