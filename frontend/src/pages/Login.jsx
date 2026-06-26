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
      background: 'linear-gradient(135deg, #E8F0FE 0%, #D4E4FD 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        display: 'flex',
        maxWidth: '1000px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '32px',
        boxShadow: '0 25px 80px rgba(37, 99, 235, 0.15)',
        overflow: 'hidden',
        minHeight: '620px'
      }}>
        
        {/* Left Panel - Form */}
        <div style={{
          flex: 1,
          padding: '52px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '22px',
                fontWeight: '700'
              }}>
                H
              </div>
              <h1 style={{
                fontSize: '26px',
                fontWeight: '700',
                color: '#1E293B',
                margin: 0,
                letterSpacing: '-0.5px'
              }}>
                HomelyServ
              </h1>
            </div>
            <p style={{
              color: '#94A3B8',
              fontSize: '14px',
              marginTop: '6px',
              marginLeft: '56px'
            }}>
              Your Home, Our Priority
            </p>
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#0F172A',
            marginBottom: '6px',
            letterSpacing: '-0.3px'
          }}>
            Welcome Back 👋
          </h2>
          <p style={{
            color: '#94A3B8',
            fontSize: '14px',
            marginBottom: '32px'
          }}>
            Sign in to access your HomelyServ account
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#475569',
                display: 'block',
                marginBottom: '6px',
                letterSpacing: '0.3px'
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
                  padding: '13px 16px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  background: '#F8FAFC'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563EB';
                  e.target.style.background = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.background = '#F8FAFC';
                  e.target.style.boxShadow = 'none';
                }}
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
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  letterSpacing: '0.3px'
                }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{
                  fontSize: '12px',
                  color: '#2563EB',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>
                  Forgot password?
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
                  padding: '13px 16px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  background: '#F8FAFC'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563EB';
                  e.target.style.background = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.background = '#F8FAFC';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Remember Me */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '26px'
            }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#2563EB',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              />
              <label htmlFor="remember" style={{
                fontSize: '13px',
                color: '#64748B',
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
                padding: '15px',
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '22px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)';
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* OR divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span style={{
              fontSize: '12px',
              color: '#94A3B8',
              fontWeight: '500',
              letterSpacing: '0.5px'
            }}>
              OR CONTINUE WITH
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
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
              padding: '11px 24px',
              border: '2px solid #E2E8F0',
              borderRadius: '12px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#475569',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#2563EB';
              e.target.style.background = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.background = '#fff';
            }}
            >
              <span style={{ fontSize: '18px' }}>🔵</span> Google
            </button>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              border: '2px solid #E2E8F0',
              borderRadius: '12px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#475569',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#1877F2';
              e.target.style.background = '#F0F4FF';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#E2E8F0';
              e.target.style.background = '#fff';
            }}
            >
              <span style={{ fontSize: '18px' }}>🔷</span> Facebook
            </button>
          </div>

          {/* Sign up link */}
          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#94A3B8',
            marginTop: '26px'
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#2563EB',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Create one
            </Link>
          </p>
        </div>

        {/* Right Panel - Branding (Blue Theme) */}
        <div style={{
          flex: '0 0 42%',
          background: 'linear-gradient(145deg, #1E3A5F 0%, #0F172A 100%)',
          padding: '52px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.12)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.08)'
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.04)'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '72px',
              marginBottom: '24px',
              display: 'block'
            }}>
              🏡
            </div>
            <h3 style={{
              fontSize: '26px',
              fontWeight: '700',
              marginBottom: '14px',
              letterSpacing: '-0.5px'
            }}>
              Your Home, Our Priority
            </h3>
            <p style={{
              fontSize: '14px',
              opacity: 0.8,
              lineHeight: '1.7',
              maxWidth: '280px',
              margin: '0 auto'
            }}>
              Find trusted domestic workers and caregivers for your home, all in one secure platform.
            </p>

            <div style={{
              marginTop: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                opacity: 0.9,
                background: 'rgba(255,255,255,0.08)',
                padding: '8px 18px',
                borderRadius: '50px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span>✅</span> Verified professionals
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                opacity: 0.9,
                background: 'rgba(255,255,255,0.08)',
                padding: '8px 18px',
                borderRadius: '50px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span>✅</span> Secure & confidential
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                opacity: 0.9,
                background: 'rgba(255,255,255,0.08)',
                padding: '8px 18px',
                borderRadius: '50px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span>✅</span> 24/7 support
              </div>
            </div>

            <div style={{
              marginTop: '36px',
              fontSize: '12px',
              opacity: 0.5,
              letterSpacing: '0.5px'
            }}>
              Secure. Reliable. Always here for your home.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}