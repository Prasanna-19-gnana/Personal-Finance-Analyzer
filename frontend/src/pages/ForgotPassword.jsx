import { useState, useRef } from 'react';
import { Mail, ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

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

function OTPDigitInputs({ value, onChange, disabled }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleKey = (idx, e) => {
    const digits = value.split('');
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[idx]) {
        digits[idx] = '';
        onChange(digits.join(''));
      } else if (idx > 0) {
        digits[idx - 1] = '';
        onChange(digits.join(''));
        refs[idx - 1].current?.focus();
      }
    }
  };

  const handleInput = (idx, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const digits = value.padEnd(6, '').split('');
    digits[idx] = char;
    const next = digits.join('');
    onChange(next);
    if (char && idx < 5) refs[idx + 1].current?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    refs[Math.min(pasted.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: '45px', height: '55px', textAlign: 'center', fontSize: '1.5rem',
            fontWeight: '700', fontFamily: "'Courier New', monospace",
            background: 'rgba(1,4,9,0.6)',
            border: `2px solid ${value[i] ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '12px', color: '#fff', outline: 'none', caretColor: 'transparent',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.target.style.borderColor = value[i] ? 'var(--primary)' : 'rgba(255,255,255,0.12)')}
        />
      ))}
    </div>
  );
}

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError(''); setSuccess('');
    
    if (!email.trim() || !isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: email.trim().toLowerCase() });
      setSuccess('OTP sent! Check your inbox.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError(''); setSuccess('');

    if (otp.replace(/\D/g, '').length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email: email.trim().toLowerCase(), otp });
      setSuccess('Email verified! Please enter your new password.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        password: formData.password
      });
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const getInputStyle = () => ({
    width: '100%', padding: '12px', background: 'rgba(1,4,9,0.3)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  });

  return (
    <div className="auth-container" style={{
      background: 'radial-gradient(circle at top left, #1f2937, #0d1117)',
      position: 'relative', overflow: 'hidden', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40rem', height: '40rem', background: 'radial-gradient(circle, rgba(88,166,255,0.12) 0%, transparent 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      
      <div className="auth-card" style={{
        background: 'rgba(22,27,34,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)',
        zIndex: 10, padding: '3rem 2.5rem', maxWidth: '420px', width: '100%', borderRadius: '16px',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px',
            borderRadius: '18px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            marginBottom: '1.25rem', color: '#fff', boxShadow: '0 12px 24px -6px rgba(88,166,255,0.4)'
          }}>
            {step === 1 && <Mail size={30} />}
            {step === 2 && <ShieldCheck size={30} />}
            {step === 3 && <Lock size={30} />}
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.4rem', background: 'linear-gradient(to right, #ffffff, #c9d1d9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {step === 1 ? 'Reset Password' : step === 2 ? 'Verify Email' : 'New Password'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {step === 1 && "Need a reset? Enter your email below."}
            {step === 2 && "We sent a 6-digit code to your email."}
            {step === 3 && "Please enter your new password."}
          </p>
        </div>

        <Alert type={error ? 'error' : 'success'} message={error || success} />

        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} placeholder="you@example.com" style={getInputStyle()} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <OTPDigitInputs value={otp} onChange={setOtp} disabled={loading} />
            <button type="submit" disabled={loading || otp.length < 6} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: '15px', fontWeight: '600', cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer', opacity: (loading || otp.length < 6) ? 0.7 : 1, marginBottom: '16px' }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={handleSendOtp} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                Resend Code
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>New Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} disabled={loading} placeholder="••••••••" style={getInputStyle()} />
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} disabled={loading} placeholder="••••••••" style={getInputStyle()} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {(step === 1 || step === 2) && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Remember your password? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Log in</Link>
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;