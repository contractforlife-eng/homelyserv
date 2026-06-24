import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo />
        </div>

        <div className="header-right">
          <LanguageSwitcher />
          {user && (
            <>
              <div className="user-badge">
                <span className="user-avatar">{user.fullName?.charAt(0) || 'U'}</span>
                <span className="user-name hide-mobile">{user.fullName}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout">
                {t('logout')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}