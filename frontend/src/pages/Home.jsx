import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#F8F9FA',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          color: '#C0392B',
          marginBottom: '8px'
        }}>
          Welcome, {user?.fullName || 'User'}!
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          color: '#6C757D',
          marginBottom: '20px'
        }}>
          Your role: <strong>{user?.role || 'Not set'}</strong>
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '20px'
        }}>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '14px',
                background: '#2C3E50',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📊 Admin Dashboard
            </button>
          )}

          {user?.role === 'WORKER' && (
            <>
              <button
                onClick={() => navigate('/worker-profile')}
                style={{
                  padding: '14px',
                  background: '#C0392B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                👤 My Profile
              </button>
              <button
                onClick={() => navigate('/my-hires')}
                style={{
                  padding: '14px',
                  background: '#27AE60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📋 My Hires
              </button>
            </>
          )}

          {user?.role === 'EMPLOYER' && (
            <>
              <button
                onClick={() => navigate('/search')}
                style={{
                  padding: '14px',
                  background: '#C0392B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔍 Find Workers
              </button>
              <button
                onClick={() => navigate('/my-hires')}
                style={{
                  padding: '14px',
                  background: '#27AE60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📋 My Hires
              </button>
            </>
          )}
        </div>

        {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
          <button
            onClick={async () => {
              const newRole = user?.role === 'WORKER' ? 'EMPLOYER' : 'WORKER';
              if (window.confirm(`Switch your account to ${newRole}?`)) {
                try {
                  const api = (await import('../utils/api')).default;
                  await api.put('/auth/switch-role', { role: newRole });
                  const updatedUser = { ...user, role: newRole };
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  window.location.reload();
                } catch (err) {
                  alert('Failed to switch role');
                }
              }
            }}
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#F0F0F0',
              color: '#1A1A2E',
              border: '1px dashed #C0392B',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            🔄 Switch to {user?.role === 'WORKER' ? 'Employer' : 'Worker'}
          </button>
        )}

        <button
          onClick={handleLogout}
          style={{
            marginTop: '20px',
            padding: '12px',
            background: 'transparent',
            color: '#C0392B',
            border: '1px solid #C0392B',
            borderRadius: '10px',
            fontSize: '14px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}