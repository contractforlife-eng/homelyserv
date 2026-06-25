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
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: '#C0392B' }}>Welcome, {user?.fullName}!</h1>
      <p>Your role: {user?.role}</p>
      <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '5px' }}>
        Logout
      </button>
    </div>
  );
}