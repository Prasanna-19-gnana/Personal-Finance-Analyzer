import { useState, useRef, useEffect } from 'react';
import { Mail, ShieldCheck, User as UserIcon, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
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

const Register = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Step 1
  const [email, setEmail] = useState('');
  
  // Step 2
  const [otp, setOtp] = useState('');

  // Step 3
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male', // Default option
    work: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Handlers ---
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
      await api.post('/auth/verify-otp', { 
        email: email.trim().toLowerCase(), 
        otp 
      });
      setSuccess('Email verified! Please fill out your details.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDetails = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.name || !formData.password || !formData.confirmPassword || !formData.work || !formData.gender) {
      setError('Please fill in all fields.');
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
      await api.post('/auth/register-details', {
        email: email.trim().toLowerCase(),
        name: formData.name,
        gender: formData.gender,
        work: formData.work,
        password: formData.password
      });
      setSuccess('Registration complete! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getInputStyle = () => ({
    width: '100%', padding: '12px', background: 'rgba(1,4,9,0.3)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
  });

  return (
    <div className="auth-container" style={{
      background: 'radial-gradient(circle at top left, #1f2937, #0d1117)',
      position: 'relative', overflow: 'hidden', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="auth-card" style={{
        background: 'rgba(22,27,34,0.7)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)', zIndex: 10,
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)',
        padding: '2.5rem', maxWidth: '450px', width: '100%',
        borderRadius: '16px'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            marginBottom: '1rem', color: '#fff',
          }}>
            {step === 1 && <Mail size={30} />}
            {step === 2 && <ShieldCheck size={30} />}
            {step === 3 && <UserIcon size={30} />}
          </div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: '800', marginBottom: '0.4rem',
            background: 'linear-gradient(to right, #ffffff, #c9d1d9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {step === 1 ? 'Create Account' : step === 2 ? 'Verify Email' : 'Your Details'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', justifyContent: 'center' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              height: '4px', borderRadius: '2px', flex: 1, maxWidth: '60px',
              background: s <= step ? 'linear-gradient(to right, var(--primary), var(--accent))' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.4s',
            }} />
          ))}
        </div>

        <Alert type="error" message={error} />
        <Alert type="success" message={success} />

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>Email Address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                disabled={loading} placeholder="you@example.com" style={getInputStyle()}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--primary)', color: '#fff',
              border: 'none', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                We sent a code to <strong style={{ color: '#fff' }}>{email}</strong>
              </p>
              <OTPDigitInputs value={otp} onChange={setOtp} disabled={loading} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--primary)', color: '#fff',
              border: 'none', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        {/* Step 3: Registration Form */}
        {step === 3 && (
          <form onSubmit={handleRegisterDetails}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={loading} placeholder="John Doe" style={getInputStyle()} />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} disabled={loading} style={{...getInputStyle(), appearance: 'auto'}}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>Work / Profession</label>
              <input type="text" name="work" value={formData.work} onChange={handleChange} disabled={loading} placeholder="Software Engineer" style={getInputStyle()} />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} disabled={loading} placeholder="••••••••" style={getInputStyle()} />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-muted)' }}>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} disabled={loading} placeholder="••••••••" style={getInputStyle()} />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--primary)', color: '#fff',
              border: 'none', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Log in</Link>
            </span>
        </div>

      </div>
    </div>
  );
};

export default Register;
