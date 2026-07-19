// frontend/src/components/FacebookLoginButton.jsx
import React, { useEffect, useRef } from 'react';

const FacebookLoginButton = ({ 
  appId, 
  onSuccess, 
  onError, 
  children, 
  className,
  fields = 'name,email,picture' 
}) => {
  const buttonRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Load Facebook SDK only once
    if (initialized.current) return;
    
    const loadFBSDK = () => {
      return new Promise((resolve) => {
        if (window.FB) {
          resolve(window.FB);
          return;
        }

        // Set up the Facebook SDK
        window.fbAsyncInit = function() {
          window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          resolve(window.FB);
        };

        // Load the SDK script
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        document.body.appendChild(script);
      });
    };

    loadFBSDK();
    initialized.current = true;
    
    return () => {
      // Cleanup
    };
  }, [appId]);

  const handleLogin = () => {
    if (window.FB) {
      window.FB.login(
        (response) => {
          if (response.authResponse) {
            // Get user info
            window.FB.api('/me', { fields: fields }, (userInfo) => {
              onSuccess({
                ...response,
                ...userInfo,
                accessToken: response.authResponse.accessToken,
                userID: response.authResponse.userID
              });
            });
          } else {
            onError('User cancelled login or did not fully authorize.');
          }
        },
        { scope: 'email,public_profile' }
      );
    } else {
      onError('Facebook SDK not loaded');
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleLogin}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
};

export default FacebookLoginButton; 