import { GoogleOAuthProvider, GoogleLogin as GoogleLoginButton } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

// Replace with your actual Google Client ID
// Get it from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

function GoogleLoginComponent() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await api.post('/auth/google-login', {
        credential: credentialResponse.credential
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
      toast.error(error.response?.data?.message || 'Google login failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.');
  };

  return (
    <div className="google-login-wrapper">
      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap
        theme="outline"
        size="large"
        width="100%"
        text="signin_with"
        shape="rectangular"
        logo_alignment="center"
      />
    </div>
  );
}

export default function GoogleLogin() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLoginComponent />
    </GoogleOAuthProvider>
  );
}