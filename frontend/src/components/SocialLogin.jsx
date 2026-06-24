import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import GoogleLogin from './GoogleLogin';

export default function SocialLogin() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSocialLogin = async (provider, providerData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/social-login', {
        provider: provider,
        providerId: providerData.id || providerData.sub,
        email: providerData.email,
        fullName: providerData.name || providerData.fullName,
        avatar: providerData.picture || providerData.avatar
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        setToken(response.data.token);
        toast.success(`Welcome ${response.data.user.fullName}!`);
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Social login failed');
    }
    setLoading(false);
  };

  const handleFacebookLogin = () => {
    toast.info('Facebook login is in demo mode. Using mock account.');
    const mockFacebookData = {
      id: 'fb_' + Date.now(),
      email: 'facebook_user_' + Date.now() + '@facebook.com',
      name: 'Facebook User',
      picture: 'https://ui-avatars.com/api/?name=FB&background=1877F2&color=fff'
    };
    handleSocialLogin('facebook', mockFacebookData);
  };

  const handleTwitterLogin = () => {
    toast.info('Twitter login is in demo mode. Using mock account.');
    const mockTwitterData = {
      id: 'tw_' + Date.now(),
      email: 'twitter_user_' + Date.now() + '@twitter.com',
      name: 'Twitter User',
      picture: 'https://ui-avatars.com/api/?name=TW&background=1DA1F2&color=fff'
    };
    handleSocialLogin('twitter', mockTwitterData);
  };

  const handleTelegramLogin = () => {
    toast.info('Telegram login is in demo mode. Using mock account.');
    const mockTelegramData = {
      id: 'tg_' + Date.now(),
      email: 'telegram_user_' + Date.now() + '@telegram.com',
      name: 'Telegram User',
      picture: 'https://ui-avatars.com/api/?name=TL&background=0088CC&color=fff'
    };
    handleSocialLogin('telegram', mockTelegramData);
  };

  const handleSignalLogin = () => {
    toast.info('Signal login is in demo mode. Using mock account.');
    const mockSignalData = {
      id: 'sg_' + Date.now(),
      email: 'signal_user_' + Date.now() + '@signal.com',
      name: 'Signal User',
      picture: 'https://ui-avatars.com/api/?name=SG&background=3A76F0&color=fff'
    };
    handleSocialLogin('signal', mockSignalData);
  };

  const socialButtons = [
    { provider: 'Facebook', icon: '🔷', color: '#1877F2', onClick: handleFacebookLogin },
    { provider: 'Twitter', icon: '🐦', color: '#1DA1F2', onClick: handleTwitterLogin },
    { provider: 'Telegram', icon: '✈️', color: '#0088CC', onClick: handleTelegramLogin },
    { provider: 'Signal', icon: '📱', color: '#3A76F0', onClick: handleSignalLogin },
  ];

  return (
    <div className="social-login">
      {/* Google Login - Centered */}
      <div className="google-login-section">
        <GoogleLogin />
      </div>

      <div className="social-divider">
        <span>Or continue with</span>
      </div>

      <div className="social-buttons">
        {socialButtons.map((btn) => (
          <button
            key={btn.provider}
            onClick={btn.onClick}
            disabled={loading}
            className="social-btn"
            style={{ borderColor: btn.color }}
          >
            <span className="social-icon">{btn.icon}</span>
            {btn.provider}
          </button>
        ))}
      </div>

      {loading && (
        <div className="social-loading">
          <span className="spinner"></span> Logging in...
        </div>
      )}
    </div>
  );
}