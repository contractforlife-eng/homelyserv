// src/components/SocialLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const FACEBOOK_APP_ID = '1813816306257010';

export default function SocialLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fbLoaded, setFbLoaded] = useState(false);

  // Initialize Facebook SDK
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

    // Load Facebook SDK - check if already loaded
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else {
      // SDK already loaded, check if FB is initialized
      if (window.FB) {
        setFbLoaded(true);
      }
    }

    return () => {
      // Cleanup only if we added the script
      const scriptElement = document.getElementById('facebook-jssdk');
      if (scriptElement && scriptElement.parentNode) {
        // Don't remove it as it might be used elsewhere
        // scriptElement.remove();
      }
    };
  }, []);

  // Handle social login - calls backend
  const handleSocialLogin = async (provider, providerData) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/oauth/social-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          providerId: providerData.id,
          email: providerData.email,
          fullName: providerData.name,
          avatar: providerData.picture
        })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('homelyserv_token', data.token);

        // Update Zustand store — user lives in memory, not localStorage
        useAuthStore.setState({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        });

        toast.success(`Welcome ${data.user.fullName}!`);
        
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        
        // Redirect based on role
        const role = data.user.role?.toUpperCase();
        if (role === 'EMPLOYER') {
          navigate('/employer-dashboard');
        } else if (role === 'WORKER') {
          navigate('/worker-dashboard');
        } else if (role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/employer-dashboard');
        }
      } else {
        toast.error(data.message || 'Social login failed');
      }
    } catch (error) {
      console.error('Social login error:', error);
      toast.error('Social login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google Login Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google login success:', credentialResponse);
    try {
      const response = await fetch('http://localhost:5000/api/oauth/social-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential
        })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('homelyserv_token', data.token);

        // Update Zustand store — user lives in memory, not localStorage
        useAuthStore.setState({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        });

        toast.success(`Welcome ${data.user.fullName}!`);
        
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        
        const role = data.user.role?.toUpperCase();
        if (role === 'EMPLOYER') {
          navigate('/employer-dashboard');
        } else if (role === 'WORKER') {
          navigate('/worker-dashboard');
        } else if (role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/employer-dashboard');
        }
      } else {
        toast.error(data.message || 'Google login failed');
      }
    } catch (error) {
      console.error('Error decoding Google token:', error);
      toast.error('Google login failed');
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    toast.error('Google login failed. Please try again.');
  };

  // Facebook Login Handler
  const handleFacebookLogin = () => {
    if (!fbLoaded) {
      toast.info('Facebook SDK is loading. Please try again.');
      return;
    }

    if (!window.FB) {
      toast.error('Facebook SDK not loaded. Please refresh the page.');
      return;
    }

    window.FB.login(function(response) {
      if (response.authResponse) {
        window.FB.api('/me', { fields: 'id,name,email,picture' }, function(userInfo) {
          console.log('Facebook user info:', userInfo);
          const userData = {
            id: userInfo.id,
            email: userInfo.email || `fb_${userInfo.id}@facebook.com`,
            name: userInfo.name,
            picture: userInfo.picture?.data?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.name)}&background=1877F2&color=fff`
          };
          handleSocialLogin('facebook', userData);
        });
      } else {
        toast.error('Facebook login cancelled or failed');
      }
    }, { scope: 'email,public_profile' });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1 border-t border-gray-200"></div>
        <span className="text-sm text-gray-400 whitespace-nowrap font-medium">Or continue with</span>
        <div className="flex-1 border-t border-gray-200"></div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
        {/* Google Login */}
        <div className="w-full sm:w-auto min-w-[200px] google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            shape="pill"
            text="signin_with"
            width="200"
            logo_alignment="center"
          />
        </div>

        {/* Facebook Login */}
        <button
          onClick={handleFacebookLogin}
          disabled={loading || !fbLoaded}
          className={`facebook-btn flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 w-full sm:w-auto min-w-[200px] ${
            loading || !fbLoaded 
              ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-100' 
              : 'border-gray-200 hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white group'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="text-sm font-medium">Facebook</span>
        </button>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            Logging in...
          </div>
        </div>
      )}

      <style>{`
        .facebook-btn {
          background: white;
          color: #374151;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .facebook-btn:hover:not(:disabled) {
          color: white;
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3);
        }
        .facebook-btn svg {
          color: #1877F2;
          transition: color 0.2s ease;
        }
        .facebook-btn:hover:not(:disabled) svg {
          color: white;
        }
        .facebook-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .google-btn-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .google-btn-wrapper > div {
          width: 100% !important;
          max-width: 200px !important;
        }
        .google-btn-wrapper iframe {
          width: 100% !important;
          min-width: 200px !important;
          height: 44px !important;
        }
      `}</style>
    </div>
  );
} 