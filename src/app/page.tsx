'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

/* ── Animation helpers ── */
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const scaleIn = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

/* ── Navbar ── */
function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(24,17,13,.76)', borderBottom: '1px solid rgba(255,244,230,.08)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: '1.3rem' }}>
          <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ AppForge</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-links-desktop">
          {['Features', 'How It Works', 'Architecture'].map(t => (
            <a key={t} href={`#${t.toLowerCase().replace(/\s+/g,'-')}`} style={{ fontSize: '.9rem', color: 'var(--text-secondary)', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>{t}</a>
          ))}
          <Link href="/auth" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
        <button onClick={() => setOpen(!open)} className="mobile-menu-btn" style={{ display: 'none', color: '#fff', fontSize: '1.5rem', background: 'none', border: 'none' }}>☰</button>
      </div>
      {open && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} style={{ overflow: 'hidden', borderTop: '1px solid var(--border-subtle)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['Features', 'How It Works', 'Architecture'].map(t => <a key={t} href={`#${t.toLowerCase().replace(/\s+/g,'-')}`} onClick={() => setOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '.95rem' }}>{t}</a>)}
          <Link href="/auth" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>Get Started</Link>
        </motion.div>
      )}
      <style>{`
        @media(max-width:768px){ .nav-links-desktop{display:none!important} .mobile-menu-btn{display:block!important} }
      `}</style>
    </motion.nav>
  );
}

/* ── Hero ── */
function Hero() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: 72 }}>
      <div className="orb orb-1" style={{ animation: 'float 8s ease-in-out infinite' }} />
      <div className="orb orb-2" style={{ animation: 'float 10s ease-in-out infinite 1s' }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.6 }}>
          <span className="badge badge-accent" style={{ marginBottom: 24, display: 'inline-flex' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} /> AI-Powered App Generator
          </span>
        </motion.div>
        <motion.h1 variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.03em' }}>
          JSON Config → <br />
          <span className="gradient-text">Working App</span> in Seconds
        </motion.h1>
        <motion.p variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Transform structured JSON configurations into fully functional web applications — complete with dynamic UI, APIs, database, and authentication.
        </motion.p>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth" className="btn btn-primary btn-lg">
            Start Building <span style={{ fontSize: '1.2rem' }}>→</span>
          </Link>
          <a href="#how-it-works" className="btn btn-secondary btn-lg">See How It Works</a>
        </motion.div>
        {/* Code Preview */}
        <motion.div variants={scaleIn} initial="hidden" animate="visible" transition={{ duration: 0.8, delay: 0.5 }}
          style={{ marginTop: 64, maxWidth: 720, margin: '64px auto 0', perspective: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(12,8,6,.5), 0 0 40px rgba(216,179,106,.12)', transform: 'rotateX(2deg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(24,17,13,.58)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ flex: 1, textAlign: 'center', fontSize: '.75rem', color: 'var(--text-muted)' }}>config.json</span>
            </div>
            <pre style={{ padding: '20px 24px', fontSize: '.8rem', lineHeight: 1.8, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', textAlign: 'left', overflow: 'auto', margin: 0 }}>
{`{
  "name": "Task Manager Pro",
  "entities": [{
    "name": "tasks",
    "fields": [
      { "name": "title", "type": "text", "required": true },
      { "name": "status", "type": "select", "options": ["todo","done"] },
      { "name": "priority", "type": "select", "options": ["low","high"] }
    ]
  }],
  "auth": { "enabled": true, "methods": ["email"] }
}`}
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Features ── */
const features = [
  { icon: '🧩', title: 'Config-Driven UI', desc: 'Define forms, tables, and dashboards purely from JSON. The runtime dynamically generates every component.' },
  { icon: '🔌', title: 'Auto-Generated APIs', desc: 'CRUD endpoints are created automatically for each entity. Validation, pagination, and search included.' },
  { icon: '🗄️', title: 'Dynamic Database', desc: 'Schema is derived from config. Handles optional fields, type mismatches, and schema evolution gracefully.' },
  { icon: '🔐', title: 'Built-in Auth', desc: 'Email/password authentication with JWT tokens. User-scoped data access ensures isolation.' },
  { icon: '🌍', title: 'Multi-Language', desc: 'Config-driven localization with dynamic locale switching. Add translations directly in your config.' },
  { icon: '📊', title: 'CSV Import', desc: 'Upload CSV files, map columns to entity fields, and bulk import data with validation and error reporting.' },
  { icon: '🔔', title: 'Notifications', desc: 'Event-based notification system. Get alerts on CRUD operations and system events.' },
  { icon: '🧱', title: 'Extensible Architecture', desc: 'Add new component types, field types, and features without touching core logic.' },
];

function Features() {
  return (
    <section id="features" className="section" style={{ position: 'relative' }}>
      <div className="container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="badge badge-accent" style={{ marginBottom: 16, display: 'inline-flex' }}>Features</span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 16 }}>
            Everything You Need to <span className="gradient-text">Generate Apps</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto', fontSize: '1.05rem' }}>
            A complete platform that handles UI, backend, database, and auth — all from configuration.
          </p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp} transition={{ duration: 0.4 }} className="card luxury-card"
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: '2rem' }}>{f.icon}</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── How It Works ── */
const steps = [
  { num: '01', title: 'Define Your Config', desc: 'Write a JSON configuration defining your entities, fields, pages, auth, and settings.' },
  { num: '02', title: 'System Processes', desc: 'The engine parses, validates, and normalizes your config — handling errors and missing data gracefully.' },
  { num: '03', title: 'App is Generated', desc: 'UI, APIs, and database schema are dynamically created. Your app is instantly usable.' },
  { num: '04', title: 'Manage & Extend', desc: 'Use the dashboard to manage data, import CSV, update configs, and add new features.' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="badge badge-accent" style={{ marginBottom: 16, display: 'inline-flex' }}>Process</span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 16 }}>
            How It <span className="gradient-text">Works</span>
          </h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
          {steps.map((s, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="glass-card" style={{ textAlign: 'center', padding: '32px 24px', position: 'relative' }}>
              <span style={{ fontSize: '3rem', fontWeight: 900, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', opacity: 0.3 }}>{s.num}</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '12px 0 8px' }}>{s.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '.88rem', lineHeight: 1.6 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Architecture ── */
function Architecture() {
  const layers = [
    { name: 'Config Layer', items: ['JSON Parser', 'Validator', 'Normalizer', 'Schema Generator'], color: '#8b5cf6' },
    { name: 'Runtime Engine', items: ['UI Renderer', 'API Generator', 'Auth Manager', 'Notification Hub'], color: '#6366f1' },
    { name: 'Data Layer', items: ['SQLite Database', 'Dynamic Schemas', 'CRUD Operations', 'CSV Import'], color: '#3b82f6' },
  ];
  return (
    <section id="architecture" className="section">
      <div className="container">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="badge badge-accent" style={{ marginBottom: 16, display: 'inline-flex' }}>System Design</span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 16 }}>
            <span className="gradient-text">Architecture</span> Overview
          </h2>
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800, margin: '0 auto' }}>
          {layers.map((l, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.2 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 28, borderLeft: `4px solid ${l.color}` }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, color: l.color }}>{l.name}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {l.items.map((item, j) => (
                  <span key={j} style={{ padding: '6px 14px', background: `${l.color}15`, border: `1px solid ${l.color}30`, borderRadius: 8, fontSize: '.82rem', color: 'var(--text-secondary)' }}>{item}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ── */
function CTA() {
  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center' }}>
        <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 24, padding: 'clamp(40px,6vw,80px)', position: 'relative', overflow: 'hidden' }}>
          <div className="orb orb-3" />
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 16, position: 'relative', zIndex: 1 }}>
            Ready to Build Your <span className="gradient-text">Next App</span>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1.05rem', position: 'relative', zIndex: 1 }}>
            Define your config. Let AppForge handle the rest.
          </p>
          <Link href="/auth" className="btn btn-primary btn-lg" style={{ position: 'relative', zIndex: 1 }}>
            Start Building Now <span>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '40px 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}><span className="gradient-text">⚡ AppForge AI</span></span>
        <span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>© 2024 AppForge. Config-driven app generation platform.</span>
      </div>
    </footer>
  );
}

/* ── Page ── */
export default function LandingPage() {
  return (
    <main style={{ position: 'relative', zIndex: 1 }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Architecture />
      <CTA />
      <Footer />
    </main>
  );
}
