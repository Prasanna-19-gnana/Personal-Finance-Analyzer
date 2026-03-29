import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (v) => EMAIL_RE.test(v.trim());

function Alert({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
      background: isError ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.1)',
      border: `1px solid ${isError ? 'rgba(248,81,73,0.3)' : 'rgba(63,185,80,0.3)'}`,
      color: isError ? '#f85149' : '#3fb950', fontSize: '14px',
    }}>
      {isError ? <AlertCircle size={16} style={{ flexShrink: 0 }} /> : <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
      <span>{message}</span>
    </div>
  );
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password) { 
      setError('Email and password are required.'); 
      return; 
    }
    if (!isValidEmail(email)) { 
      setError('Please enter a valid email address.'); 
      return; 
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err.response?.data?.msg || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      background: 'radial-gradient(circle at top left, #1f2937, #0d1117)',
      position: 'relative', overflow: 'hidden', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '40rem', height: '40rem',
        background: 'radial-gradient(circle, rgba(88,166,255,0.12) 0%, transparent 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '40rem', height: '40rem',
        background: 'radial-gradient(circle, rgba(188,140,255,0.12) 0%, transparent 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div className="auth-card" style={{
        background: 'rgba(22,27,34,0.7)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)', zIndex: 10,
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        padding: '3rem 2.5rem', maxWidth: '420px', width: '100%',
        borderRadius: '16px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            marginBottom: '1.25rem', boxShadow: '0 12px 24px -6px rgba(88,166,255,0.4)',
            color: '#fff',
          }}>
            <Mail size={30} />
          </div>

          <h1 style={{
            fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.4rem',
            background: 'linear-gradient(to right, #ffffff, #c9d1d9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
            Sign in to continue to your dashboard.
          </p>
        </div>

        <Alert type="error" message={error} />

        <form onSubmit={handleLogin} noValidate>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="login-email" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '12px', background: 'rgba(1,4,9,0.3)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label htmlFor="login-password" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px', background: 'rgba(1,4,9,0.3)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '8px',
              background: 'var(--primary)', color: '#fff',
              border: 'none', fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Register here</Link>
            </span>
        </div>

      </div>
    </div>
  );
};

export default Login;
