import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const switchRole = async () => {
    const newRole = user?.role === 'WORKER' ? 'EMPLOYER' : 'WORKER';
    const confirm = window.confirm(`Switch your account to ${newRole}?`);
    if (!confirm) return;

    try {
      await api.put('/auth/switch-role', { role: newRole });
      const updatedUser = { ...user, role: newRole };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
      toast.success(`Switched to ${newRole} successfully!`);
    } catch (err) {
      toast.error('Failed to switch role');
    }
  };

  const getDashboardCards = () => {
    if (user?.role === 'ADMIN') {
      return [
        { 
          icon: '⚙️', 
          title: 'Control Panel', 
          desc: 'Manage users, hires, payments and settings', 
          action: 'Open Control Panel →', 
          path: '/admin',
          primary: true 
        },
      ];
    }

    if (user?.role === 'WORKER') {
      return [
        { icon: '👤', title: 'My Profile', desc: 'Update your skills and availability', action: 'Update Profile →', path: '/worker-profile' },
        { icon: '📋', title: 'My Hires', desc: 'View offers from employers', action: 'View Hires →', path: '/my-hires' },
        { icon: '🔄', title: 'Switch Account Type', desc: 'Start hiring workers instead', action: 'Switch →', path: '#', onClick: switchRole },
      ];
    }

    if (user?.role === 'EMPLOYER') {
      return [
        { icon: '🔍', title: 'Find Workers', desc: 'Search for the perfect candidate', action: 'Search Now →', path: '/search' },
        { icon: '📋', title: 'My Hires', desc: 'View your hiring history', action: 'View Hires →', path: '/my-hires' },
        { icon: '🔄', title: 'Switch Account Type', desc: 'Start looking for jobs instead', action: 'Switch →', path: '#', onClick: switchRole },
      ];
    }

    return [];
  };

  const recentActivity = [
    { text: 'Profile approved by admin', time: '12 minutes ago' },
    { text: 'Payment received from Homely Serv Corp', time: '10 minutes ago' },
    { text: 'New message from hiring manager', time: '3 days ago' },
  ];

  const dashboardCards = getDashboardCards();

  return (
    <Layout activeTab={user?.role === 'ADMIN' ? 'admin' : 'dashboard'}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#1a3a1a', 
          marginBottom: '4px',
          letterSpacing: '-0.5px',
        }}>
          Welcome back, {user?.fullName} 👋
        </h1>
        <p style={{ 
          color: '#5a7a5a', 
          fontSize: '16px',
          fontWeight: '400',
        }}>
          {user?.role === 'ADMIN' ? 'Here\'s what\'s happening with your platform today' : 'What would you like to do today?'}
        </p>
      </div>

      {/* Stats Grid - Modern Cards */}
      {user?.role === 'ADMIN' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '32px',
        }}>
          {[
            { label: 'Total Users', value: '1,284', change: '+12%', icon: '👥', color: '#2e7d32', bg: '#e8f5e9' },
            { label: 'Active Workers', value: '847', change: '+8%', icon: '🛠️', color: '#0d47a1', bg: '#e3f2fd' },
            { label: 'Active Hires', value: '43', change: '+5%', icon: '📋', color: '#e65100', bg: '#fff3e0' },
            { label: 'Revenue', value: '$12,430', change: '+15%', icon: '💰', color: '#1b5e20', bg: '#e8f5e9' },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e8f5e9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#5a7a5a', fontWeight: '500' }}>{stat.label}</span>
                <span style={{ fontSize: '24px' }}>{stat.icon}</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a3a1a', letterSpacing: '-0.5px' }}>
                {stat.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#2e7d32', 
                  fontWeight: '600',
                  background: '#e8f5e9',
                  padding: '2px 10px',
                  borderRadius: '12px',
                }}>
                  {stat.change}
                </span>
                <span style={{ fontSize: '12px', color: '#8aaa8a' }}>this month</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${dashboardCards.length}, 1fr)`,
        gap: '20px',
        marginBottom: '32px',
      }}>
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            onClick={() => {
              if (card.onClick) {
                card.onClick();
              } else {
                navigate(card.path);
              }
            }}
            style={{
              background: card.primary 
                ? 'linear-gradient(135deg, #2e7d32, #1b5e20)' 
                : '#ffffff',
              borderRadius: '16px',
              padding: '28px 24px',
              border: card.primary ? 'none' : '1px solid #e8f5e9',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: card.primary 
                ? '0 4px 20px rgba(46, 125, 50, 0.25)' 
                : '0 1px 3px rgba(0,0,0,0.04)',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              if (card.primary) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 35px rgba(46, 125, 50, 0.35)';
              } else {
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#2e7d32';
              }
            }}
            onMouseLeave={(e) => {
              if (card.primary) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(46, 125, 50, 0.25)';
              } else {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e8f5e9';
              }
            }}
          >
            <div style={{ 
              fontSize: '40px', 
              marginBottom: '12px',
              ...(card.primary && { filter: 'brightness(0) invert(1)' }),
            }}>
              {card.icon}
            </div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: card.primary ? '#ffffff' : '#1a3a1a',
              marginBottom: '6px',
            }}>
              {card.title}
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: card.primary ? '#a5d6a7' : '#5a7a5a',
              marginBottom: '14px',
              lineHeight: '1.5',
            }}>
              {card.desc}
            </p>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: card.primary ? '#ffffff' : '#2e7d32',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              {card.action}
            </span>
          </div>
        ))}
      </div>

      {/* Recent Activity - Modern Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e8f5e9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '20px' }}>📋</span>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a3a1a' }}>Recent Activity</h3>
        </div>
        {recentActivity.map((activity, index) => (
          <div 
            key={index} 
            style={{ 
              padding: '14px 0',
              borderBottom: index < recentActivity.length - 1 ? '1px solid #f0f7f0' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.paddingLeft = '8px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.paddingLeft = '0';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: index === 0 ? '#2e7d32' : index === 1 ? '#1976d2' : '#f39c12',
              }} />
              <span style={{ fontSize: '14px', color: '#1a3a1a', fontWeight: '500' }}>
                {activity.text}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#8aaa8a' }}>{activity.time}</span>
          </div>
        ))}
      </div>
    </Layout>
  );
}