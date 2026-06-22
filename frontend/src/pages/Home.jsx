import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Home() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <div style={{ background: '#C0392B', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>{t('app_name')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LanguageSwitcher />
          <span style={{ color: '#ffcdd2', fontSize: '14px' }}>{user?.fullName}</span>
          <button onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' }}>
            {t('logout')}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '6px' }}>
          {t('welcome')}, {user?.fullName}!
        </h2>
        <p style={{ color: '#888', marginBottom: '24px' }}>What would you like to do today?</p>

        {user?.role === 'WORKER' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/worker-profile')}
              style={{ background: '#fff', borderRadius: '12px', padding: '20px', cursor: 'pointer', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#FDECEA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👤</div>
              <div>
                <div style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '2px' }}>{t('my_profile')}</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Update your skills, salary and availability</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#C0392B', fontSize: '20px' }}>›</span>
            </div>
          </div>
        )}

        {user?.role === 'EMPLOYER' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/search')}
              style={{ background: '#C0392B', borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔍</div>
              <div>
                <div style={{ fontWeight: '600', color: '#fff', marginBottom: '2px' }}>{t('find_workers')}</div>
                <div style={{ fontSize: '13px', color: '#ffcdd2' }}>Search nannies, drivers, cooks and more</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#fff', fontSize: '20px' }}>›</span>
            </div>
          </div>
        )}

        {user?.role === 'ADMIN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div onClick={() => navigate('/admin')}
              style={{ background: '#2C3E50', borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📊</div>
              <div>
                <div style={{ fontWeight: '600', color: '#fff', marginBottom: '2px' }}>{t('dashboard')}</div>
                <div style={{ fontSize: '13px', color: '#bdc3c7' }}>Manage hires, payments and users</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#fff', fontSize: '20px' }}>›</span>
            </div>
          </div>
        )}

        {(user?.role === 'WORKER' || user?.role === 'EMPLOYER') && (
          <div style={{ marginTop: '24px', borderTop: '1px solid #E0E0E0', paddingTop: '20px' }}>
            <div onClick={switchRole}
              style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', border: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#F0F0F0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🔄</div>
              <div>
                <div style={{ fontWeight: '600', color: '#1A1A1A', marginBottom: '2px' }}>
                  {t('switch_role')}
                </div>
                <div style={{ fontSize: '13px', color: '#888' }}>
                  {user?.role === 'WORKER' ? 'Start hiring workers instead' : 'Start looking for jobs instead'}
                </div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#888', fontSize: '20px' }}>›</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}