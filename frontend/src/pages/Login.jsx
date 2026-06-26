import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        display: 'flex',
        maxWidth: '1000px',
        width: '100%',
        background: '#fff',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.10)',
        overflow: 'hidden',
        minHeight: '600px'
      }}>
        
        {/* Left Panel - Form */}
        <div style={{
          flex: 1,
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#C0392B',
              letterSpacing: '-0.5px',
              margin: 0
            }}>
              HomelyServ
            </h1>
            <p style={{
              color: '#888',
              fontSize: '14px',
              marginTop: '4px',
              fontWeight: '400'
            }}>
              Your Home, Our Priority
            </p>
          </div>

          <h2 style={{
            fontSize: '22px',
            fontWeight: '600',
            color: '#1A1A1A',
            marginBottom: '4px',
            letterSpacing: '-0.3px'
          }}>
            Welcome Back
          </h2>
          <p style={{
            color: '#888',
            fontSize: '14px',
            marginBottom: '28px'
          }}>
            Sign in to access your HomelyServ account
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#444',
                display: 'block',
                marginBottom: '6px',
                letterSpacing: '0.4px',
                textTransform: 'uppercase'
              }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="emad@homelyserv.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1.5px solid #E0E0E0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease',
                  background: '#FAFAFA'
                }}
                onFocus={(e) => e.target.style.borderColor = '#C0392B'}
                onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <label style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#444',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase'
                }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{
                  fontSize: '12px',
                  color: '#C0392B',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  Forget password?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1.5px solid #E0E0E0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease',
                  background: '#FAFAFA'
                }}
                onFocus={(e) => e.target.style.borderColor = '#C0392B'}
                onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
              />
            </div>

            {/* Remember Me */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px'
            }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#C0392B',
                  cursor: 'pointer'
                }}
              />
              <label htmlFor="remember" style={{
                fontSize: '13px',
                color: '#666',
                cursor: 'pointer'
              }}>
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: '#C0392B',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#A93226'}
              onMouseLeave={(e) => e.target.style.background = '#C0392B'}
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          {/* OR divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#E0E0E0' }} />
            <span style={{ fontSize: '12px', color: '#888', fontWeight: '500' }}>
              OR CONTINUE WITH
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E0E0E0' }} />
          </div>

          {/* Social Login */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              border: '1.5px solid #E0E0E0',
              borderRadius: '10px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#444',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = '#C0392B'; e.target.style.background = '#f8f8f8'; }}
            onMouseLeave={(e) => { e.target.style.borderColor = '#E0E0E0'; e.target.style.background = '#fff'; }}
            >
              <span style={{ fontSize: '18px' }}>🔵</span> Google
            </button>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              border: '1.5px solid #E0E0E0',
              borderRadius: '10px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#444',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = '#1877F2'; e.target.style.background = '#f0f4ff'; }}
            onMouseLeave={(e) => { e.target.style.borderColor = '#E0E0E0'; e.target.style.background = '#fff'; }}
            >
              <span style={{ fontSize: '18px' }}>🔷</span> Facebook
            </button>
          </div>

          {/* Sign up link */}
          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#888',
            marginTop: '24px'
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#C0392B',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Create one
            </Link>
          </p>
        </div>

        {/* Right Panel - Branding */}
        <div style={{
          flex: '0 0 40%',
          background: 'linear-gradient(145deg, #C0392B 0%, #8B1A1A 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              display: 'block'
            }}>
              🏠
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              Your Home, Our Priority
            </h3>
            <p style={{
              fontSize: '14px',
              opacity: 0.85,
              lineHeight: '1.6',
              maxWidth: '280px',
              margin: '0 auto'
            }}>
              Find trusted domestic workers and caregivers for your home, all in one secure platform.
            </p>

            <div style={{
              marginTop: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                opacity: 0.9
              }}>
                <span>✅</span> Verified professionals
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                opacity: 0.9
              }}>
                <span>✅</span> Secure & confidential
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                opacity: 0.9
              }}>
                <span>✅</span> 24/7 support
              </div>
            </div>

            <div style={{
              marginTop: '32px',
              fontSize: '12px',
              opacity: 0.6,
              letterSpacing: '0.3px'
            }}>
              Secure. Reliable. Always here for your home.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}