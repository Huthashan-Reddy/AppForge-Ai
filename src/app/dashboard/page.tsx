'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { SAMPLE_CONFIG } from '@/lib/config-engine';
import type { AppConfig } from '@/lib/config-engine';
import Link from 'next/link';

interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: string;
  config: AppConfig;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { auth, logout, locale, setLocale, notifications, addNotification } = useAppStore();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [configText, setConfigText] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const headers = useCallback(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` }), [auth.token]);

  const getApps = useCallback(async () => {
    try {
      const res = await fetch('/api/apps', { headers: headers() });
      const data = await res.json();
      return data.success ? data.apps : [];
    } catch { /* ignore */ }
    return [];
  }, [headers]);

  useEffect(() => {
    if (!auth.token) { router.push('/auth'); return; }
    let cancelled = false;
    (async () => {
      try {
        const nextApps = await getApps();
        if (!cancelled) setApps(nextApps);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [auth.token, router, getApps]);

  const createApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      let parsed;
      try { parsed = JSON.parse(configText); } catch { setCreateError('Invalid JSON'); setCreating(false); return; }
      const res = await fetch('/api/apps', { method: 'POST', headers: headers(), body: JSON.stringify({ config: parsed }) });
      const data = await res.json();
      if (data.success) {
        addNotification({ type: 'success', title: 'App Created', message: `${data.app.name} is ready!` });
        setShowCreate(false);
        setConfigText('');
        const nextApps = await getApps();
        setApps(nextApps);
      } else { setCreateError(data.error || 'Failed'); }
    } catch { setCreateError('Network error'); } finally { setCreating(false); }
  };

  const deleteApp = async (id: string) => {
    if (!confirm('Delete this app and all its data?')) return;
    await fetch(`/api/apps/${id}`, { method: 'DELETE', headers: headers() });
    const nextApps = await getApps();
    setApps(nextApps);
  };

  const useSample = () => setConfigText(JSON.stringify(SAMPLE_CONFIG, null, 2));

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="orb orb-1" style={{ animation: 'float 14s ease-in-out infinite' }} />
      <div className="orb orb-2" style={{ animation: 'float 18s ease-in-out infinite 1s' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(18,12,10,.22) 0%, rgba(24,17,13,.12) 36%, rgba(35,24,20,.3) 100%)', pointerEvents: 'none' }} />

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(24,17,13,.82)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem' }}><span className="gradient-text">⚡ AppForge</span></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <select value={locale} onChange={e => setLocale(e.target.value)}
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-secondary)', fontSize: '.82rem' }}>
              <option value="en">🇺🇸 EN</option><option value="es">🇪🇸 ES</option><option value="fr">🇫🇷 FR</option>
            </select>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowNotifications(!showNotifications)} style={{ position: 'relative' }}>
                🔔
                {unreadCount > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--error)', fontSize: '.65rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 320, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 100, maxHeight: 400, overflow: 'auto' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '.9rem' }}>Notifications</div>
                    {notifications.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '.85rem' }}>No notifications</div> :
                      notifications.slice(0, 10).map(n => (
                        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', background: n.read ? 'transparent' : 'rgba(216,179,106,.08)' }}>
                          <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{n.title}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '.8rem', marginTop: 2 }}>{n.message}</div>
                        </div>
                      ))
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 700 }}>
                {auth.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { logout(); router.push('/'); }}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 32, gap: 20, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 640 }}>
            <span className="badge badge-accent" style={{ marginBottom: 12, display: 'inline-flex' }}>Studio Dashboard</span>
            <h1 style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>Your Apps</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.98rem', marginTop: 8, lineHeight: 1.6 }}>Create and manage config-driven applications in a polished luxury workspace.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New App</button>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
          </div>
        ) : apps.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state" style={{ padding: '80px 24px', background: 'linear-gradient(180deg, rgba(42,30,24,.72) 0%, rgba(25,18,15,.76) 100%)', border: '1px solid var(--border-subtle)', borderRadius: 24, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✨</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>No apps yet</h3>
            <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Create your first app by providing a JSON configuration.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Your First App</button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {apps.map(app => (
              <motion.div key={app.id} whileHover={{ y: -4 }} className="card luxury-card" style={{ cursor: 'pointer', position: 'relative', background: 'linear-gradient(180deg, rgba(42,30,24,.8) 0%, rgba(25,18,15,.82) 100%)' }}>
                <div onClick={() => router.push(`/app/${app.id}`)} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: '2rem' }}>{app.icon}</span>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{app.name}</h3>
                      <span className={`badge badge-${app.status === 'active' ? 'success' : 'warning'}`} style={{ marginTop: 4 }}>{app.status}</span>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', lineHeight: 1.5 }}>{app.description || 'No description'}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {app.config.entities?.map(e => (
                      <span key={e.name} style={{ padding: '2px 8px', background: 'var(--bg-glass)', borderRadius: 6, fontSize: '.75rem', color: 'var(--text-muted)' }}>{e.icon} {e.name}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/app/${app.id}`)}>Open</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteApp(app.id)} style={{ color: 'var(--error)' }}>Delete</button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '90vh', background: 'linear-gradient(180deg, rgba(42,30,24,.96) 0%, rgba(25,18,15,.96) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.3rem' }}>Create New App</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>✕</button>
              </div>
              <form onSubmit={createApp}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="input-label" style={{ margin: 0 }}>App Configuration (JSON)</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={useSample} style={{ fontSize: '.78rem' }}>📋 Use Sample Config</button>
                </div>
                <textarea className="input-field" value={configText} onChange={e => setConfigText(e.target.value)}
                  placeholder='{"name": "My App", "entities": [...] }'
                  style={{ minHeight: 320, fontFamily: 'var(--font-mono)', fontSize: '.82rem', lineHeight: 1.6, resize: 'vertical' }} required />
                {createError && <p className="form-error" style={{ marginTop: 8 }}>{createError}</p>}
                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create App'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
