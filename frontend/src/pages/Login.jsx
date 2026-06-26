import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'emad@homelyserv.com',
    password: '**********'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.token) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="language-toggle">
          <button className="active">GB EN</button>
          <button>العربية</button>
        </div>

        <div className="logo">
          <h1>Homely Serv</h1>
        </div>

        <h2>SIGN IN</h2>
        <p className="subtitle">Access your HomelyServ account</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="emad@homelyserv.com"
              required
            />
          </div>

          <div className="form-group">
            <label>PASSWORD</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="**********"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="divider">OR CONTINUE WITH</div>

        <div className="social-buttons">
          <button className="google-btn">
            <span>Google</span>
            <span className="arabic">تسجيل الدخول باستخدام</span>
          </button>
        </div>

        <div className="other-providers">
          <span>OTHER PROVIDERS</span>
          <div className="provider-icons">
            <button>Facebook</button>
            <button>Twitter</button>
            <button>Telegram</button>
            <button>Signal</button>
          </div>
        </div>

        <p className="signup-link">
          Don't have an account? <a href="/register">Create one</a>
        </p>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f5f5f5;
          font-family: Arial, sans-serif;
          padding: 20px;
        }

        .login-box {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 420px;
        }

        .language-toggle {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-bottom: 20px;
        }

        .language-toggle button {
          background: none;
          border: none;
          padding: 5px 10px;
          cursor: pointer;
          color: #999;
          font-size: 12px;
        }

        .language-toggle button.active {
          color: #333;
          font-weight: bold;
        }

        .logo {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo h1 {
          color: #333;
          font-size: 28px;
          margin: 0;
        }

        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 5px;
          font-size: 22px;
        }

        .subtitle {
          text-align: center;
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }

        .error-message {
          background: #fee;
          color: #c00;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: #666;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #e74c3c;
        }

        button[type="submit"] {
          width: 100%;
          padding: 14px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
          margin-top: 10px;
        }

        button[type="submit"]:hover:not(:disabled) {
          background: #c0392b;
        }

        button[type="submit"]:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .divider {
          text-align: center;
          margin: 25px 0;
          color: #999;
          font-size: 13px;
          position: relative;
        }

        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 30%;
          height: 1px;
          background: #ddd;
        }

        .divider::before {
          left: 0;
        }

        .divider::after {
          right: 0;
        }

        .social-buttons {
          margin-bottom: 20px;
        }

        .google-btn {
          width: 100%;
          padding: 12px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          transition: background 0.3s;
        }

        .google-btn:hover {
          background: #f8f8f8;
        }

        .google-btn .arabic {
          color: #666;
          font-size: 12px;
        }

        .other-providers {
          text-align: center;
          margin: 20px 0;
        }

        .other-providers span {
          color: #999;
          font-size: 11px;
          letter-spacing: 1px;
          display: block;
          margin-bottom: 10px;
        }

        .provider-icons {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .provider-icons button {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 13px;
          padding: 5px 10px;
        }

        .provider-icons button:hover {
          color: #e74c3c;
        }

        .signup-link {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #666;
        }

        .signup-link a {
          color: #e74c3c;
          text-decoration: none;
          font-weight: 600;
        }

        .signup-link a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;