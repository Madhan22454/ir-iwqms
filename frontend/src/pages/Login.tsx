import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Train, Droplets, ShieldCheck, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(employeeId, password);
      navigate('/');
    } catch {
      setError('Invalid Employee ID or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative background circles */}
      <div style={{
        position: 'absolute', width: 600, height: 600,
        borderRadius: '50%', top: -200, right: -150,
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', bottom: -100, left: -100,
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Left panel — branding */}
      <div style={{
        flex: 1, flexDirection: 'column',
        justifyContent: 'center', alignItems: 'flex-start',
        padding: '60px 80px', color: 'white',
      }}
        className="login-left-panel"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)', borderRadius: 16,
            padding: '14px', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <Train size={36} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', opacity: 0.7, textTransform: 'uppercase' }}>
              Indian Railways
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>IR-IWQMS</div>
          </div>
        </div>

        <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
          Integrated Water<br />Quality Management<br />System
        </h1>
        <p style={{ fontSize: 16, opacity: 0.75, lineHeight: 1.7, maxWidth: 400, marginBottom: 48 }}>
          Comprehensive monitoring and management of water quality across all Indian Railway zones, divisions, and stations.
        </p>

        {/* Feature highlights */}
        {[
          { icon: Droplets, text: 'Real-time water quality tracking' },
          { icon: ShieldCheck, text: 'BIS IS 10500 compliance monitoring' },
          { icon: Train, text: 'Zone → Division → Station hierarchy' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 8,
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <Icon size={18} />
            </div>
            <span style={{ fontSize: 15, opacity: 0.85 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Right panel — login form */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', padding: '40px 24px',
      }}>
        <div style={{
          width: '100%', maxWidth: 440,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 24, padding: '48px 40px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
            }}>
              <Train size={36} color="white" />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              Sign in to IR-IWQMS Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Employee ID field */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Employee ID
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  id="employeeId"
                  type="text"
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  placeholder="e.g. ADMIN001"
                  required
                  style={{
                    width: '100%', padding: '12px 14px 12px 44px',
                    border: '1.5px solid #e2e8f0', borderRadius: 12,
                    fontSize: 15, color: '#0f172a', outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%', padding: '12px 14px 12px 44px',
                    border: '1.5px solid #e2e8f0', borderRadius: 12,
                    fontSize: 15, color: '#0f172a', outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '10px 14px',
              }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              id="loginBtn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading
                  ? '#93c5fd'
                  : 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
                transition: 'all 0.2s', fontFamily: 'inherit',
                transform: loading ? 'none' : undefined,
              }}
              onMouseEnter={e => !loading && ((e.target as HTMLButtonElement).style.transform = 'translateY(-1px)')}
              onMouseLeave={e => !loading && ((e.target as HTMLButtonElement).style.transform = 'none')}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider + hint */}
          <div style={{
            marginTop: 28, paddingTop: 24,
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              🔒 Authorized personnel only. All access is logged.
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
              Demo: <strong>ADMIN001</strong> / <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
