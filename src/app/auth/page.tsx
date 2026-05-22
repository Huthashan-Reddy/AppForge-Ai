'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setAuth = useAppStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode === 'register' ? 'register' : 'login', email, password, name }),
      });
      const data = await res.json();
      if (data.success) {
        setAuth({ token: data.token, user: { id: data.user.id, email: data.user.email, name: data.user.name, locale: data.user.locale || 'en' } });
        router.push('/dashboard');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = () => {
    setError('');
    if (!email) { setError('Enter your email first'); return; }
    // Mock magic link
    setError('');
    alert(`Magic link sent to ${email}! (Demo — use email/password to sign in)`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 24, overflow: 'hidden' }}>
      <div className="orb orb-1" style={{ animation: 'float 9s ease-in-out infinite' }} />
      <div className="orb orb-2" style={{ animation: 'float 12s ease-in-out infinite 1s' }} />
      <div className="orb orb-3" style={{ opacity: 0.25 }} />

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(19,12,10,.42) 0%, rgba(19,12,10,.18) 42%, rgba(35,24,20,.34) 100%)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span className="badge badge-accent" style={{ display: 'inline-flex', marginBottom: 16 }}>Private Workspace</span>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem' }}>
            <span className="gradient-text">⚡ AppForge</span>
          </Link>
          <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: '.95rem', lineHeight: 1.6 }}>
            Sign in to continue building with the warm, configuration-driven studio.
          </p>
        </div>

        <div style={{ background: 'linear-gradient(180deg, rgba(42,30,24,.92) 0%, rgba(25,18,15,.9) 100%)', border: '1px solid var(--border-accent)', borderRadius: 24, padding: 32, backdropFilter: 'blur(24px)', boxShadow: 'var(--shadow-lg)' }}>
          {/* Tab switcher */}
          <div className="tabs" style={{ marginBottom: 28, background: 'rgba(255,248,240,.05)' }}>
            <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }} style={{ flex: 1 }}>Sign In</button>
            <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }} style={{ flex: 1 }}>Create Account</button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form key={mode} initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="input-label">Full Name</label>
                  <input className="input-field" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label className="input-label">Email</label>
                <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="input-label">Password</label>
                <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ padding: '10px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, color: 'var(--error)', fontSize: '.85rem', marginBottom: 16 }}>
                  {error}
                </motion.div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', marginBottom: 16, opacity: loading ? 0.7 : 1 }}>
                {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <div style={{ position: 'relative', textAlign: 'center', margin: '20px 0' }}>
                <div className="divider" style={{ margin: 0 }} />
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--bg-card)', padding: '0 12px', fontSize: '.8rem', color: 'var(--text-muted)' }}>or</span>
              </div>

              <button type="button" className="btn btn-secondary" onClick={handleMagicLink} style={{ width: '100%' }}>
                ✉️ Send Magic Link
              </button>
            </motion.form>
          </AnimatePresence>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.85rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ color: 'var(--accent-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
