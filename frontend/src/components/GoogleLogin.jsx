import { GoogleOAuthProvider, GoogleLogin as GoogleLoginButton } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const GOOGLE_CLIENT_ID = '559915954281-60dus88msec2ic1ebst0tfuk7oebpj9e.apps.googleusercontent.com';

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
    <div className="google-btn-container">
      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
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