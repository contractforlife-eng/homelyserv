import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import GoogleLogin from './GoogleLogin';

const FACEBOOK_APP_ID = '1813816306257010';

export default function SocialLogin() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fbLoaded, setFbLoaded] = useState(false);

  useEffect(() => {
    if (window.FB) {
      setFbLoaded(true);
      return;
    }

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      setFbLoaded(true);
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      const script = document.querySelector('script[src="https://connect.facebook.net/en_US/sdk.js"]');
      if (script) script.remove();
    };
  }, []);

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
    if (!fbLoaded) {
      toast.info('Facebook SDK is loading. Please try again.');
      return;
    }

    window.FB.login(function(response) {
      if (response.authResponse) {
        window.FB.api('/me', { fields: 'id,name,email,picture' }, function(userInfo) {
          handleSocialLogin('facebook', {
            id: userInfo.id,
            email: userInfo.email || `fb_${userInfo.id}@facebook.com`,
            name: userInfo.name,
            picture: userInfo.picture?.data?.url || `https://ui-avatars.com/api/?name=FB&background=1877F2&color=fff`
          });
        });
      } else {
        toast.error('Facebook login cancelled or failed');
      }
    }, { scope: 'email,public_profile' });
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
      <div className="social-divider">
        <span>OR CONTINUE WITH</span>
      </div>

      {/* Google Login - Centered */}
      <div className="google-login-section">
        <GoogleLogin />
      </div>

      <div className="social-divider" style={{ margin: '12px 0' }}>
        <span>Other providers</span>
      </div>

      <div className="social-buttons">
        {socialButtons.map((btn) => (
          <button
            key={btn.provider}
            onClick={btn.onClick}
            disabled={loading || (btn.provider === 'Facebook' && !fbLoaded)}
            className="social-btn"
            style={{ borderColor: btn.color }}
          >
            <span className="social-icon">{btn.icon}</span>
            {btn.provider}
            {btn.provider === 'Facebook' && !fbLoaded && ' (Loading...)'}
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