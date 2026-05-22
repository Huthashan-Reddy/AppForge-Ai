'use client';
import { useState, useEffect, useCallback, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import type { AppConfig, EntityConfig } from '@/lib/config-engine';
import Link from 'next/link';
import { t } from '@/lib/i18n';

/* ── Dynamic Components ── */

function DynamicForm({ entity, initialData, onSubmit, onCancel, locale, locales }: { entity: EntityConfig; initialData?: Record<string, any>; onSubmit: (data: any) => void; onCancel: () => void; locale: string; locales: any }) {
  const [data, setData] = useState<Record<string, any>>(initialData || {});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {entity.fields.map(f => (
        <div key={f.name} className="form-group" style={{ marginBottom: 0 }}>
          <label className="input-label">{f.label || f.name} {f.required && <span style={{ color: 'var(--error)' }}>*</span>}</label>
          
          {f.type === 'textarea' ? (
            <textarea className="input-field" value={data[f.name] || ''} onChange={e => setData({...data, [f.name]: e.target.value})} required={f.required} placeholder={f.placeholder} style={{ minHeight: 100, resize: 'vertical' }} />
          ) : f.type === 'select' ? (
            <select className="input-field" value={data[f.name] || ''} onChange={e => setData({...data, [f.name]: e.target.value})} required={f.required}>
              <option value="">Select...</option>
              {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === 'checkbox' ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.9rem' }}>
              <input type="checkbox" checked={!!data[f.name]} onChange={e => setData({...data, [f.name]: e.target.checked})} style={{ width: 16, height: 16 }} />
              {f.label || f.name}
            </label>
          ) : (
            <input className="input-field" type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} value={data[f.name] || ''} onChange={e => setData({...data, [f.name]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value})} required={f.required} placeholder={f.placeholder} />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save {entity.name}</button>
      </div>
    </form>
  );
}

/* ── CSV Import Modal ── */
function CSVImportModal({ appId, entityName, onClose, onComplete, headers }: { appId: string, entityName: string, onClose: () => void, onComplete: () => void, headers: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    
    try {
      const text = await file.text();
      const res = await fetch(`/api/apps/${appId}/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ csvData: text, entityName })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Imported ${data.imported} records. Skipped ${data.skipped}.`);
        onComplete();
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (e: any) {
      setError(e.message || 'Error parsing file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Import CSV to {entityName}</h2>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="input-field" style={{ marginBottom: 16 }} />
        {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!file || uploading}>{uploading ? 'Importing...' : 'Import Data'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main App Viewer ── */
export default function AppViewer({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = use(params);
  const router = useRouter();
  const { auth, locale } = useAppStore();
  const [app, setApp] = useState<{ id: string, name: string, config: AppConfig } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activePage, setActivePage] = useState<string>('');
  const [records, setRecords] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);

  const authHeaders = useCallback(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` }), [auth.token]);

  const fetchApp = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${appId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setApp(data.app);
        if (data.app.config.pages?.length > 0) {
          setActivePage(data.app.config.pages[0].name);
        }
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [appId, authHeaders, router]);

  useEffect(() => {
    if (!auth.token) { router.push('/auth'); return; }
    fetchApp();
  }, [auth.token, fetchApp, router]);

  const currentPageConfig = app?.config.pages.find(p => p.name === activePage);
  const currentEntityConfig = currentPageConfig?.entity ? app?.config.entities.find(e => e.name === currentPageConfig.entity) : null;

  const fetchData = useCallback(async () => {
    if (!currentEntityConfig) return;
    setLoadingData(true);
    try {
      const res = await fetch(`/api/apps/${appId}/data/${currentEntityConfig.name}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setRecords(data.records);
    } catch { /* ignore */ } finally { setLoadingData(false); }
  }, [appId, authHeaders, currentEntityConfig]);

  useEffect(() => {
    if (currentEntityConfig && currentPageConfig?.type === 'table') {
      fetchData();
    }
  }, [activePage, currentEntityConfig, currentPageConfig, fetchData]);

  const handleSaveData = async (formData: any) => {
    if (!currentEntityConfig) return;
    try {
      const url = editingRecord 
        ? `/api/apps/${appId}/data/${currentEntityConfig.name}?id=${editingRecord.id}`
        : `/api/apps/${appId}/data/${currentEntityConfig.name}`;
      
      const res = await fetch(url, {
        method: editingRecord ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setEditingRecord(null);
        fetchData();
      } else {
        alert(data.error || JSON.stringify(data.errors));
      }
    } catch (e) {
      alert('Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentEntityConfig || !confirm('Delete record?')) return;
    await fetch(`/api/apps/${appId}/data/${currentEntityConfig.name}?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    fetchData();
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: 200, height: 40 }} /></div>;
  if (!app) return <div>App not found</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: app.config.theme?.mode === 'light' ? '#f8f9fa' : 'var(--bg-primary)' }}>
      {/* Dynamic Sidebar */}
      <aside style={{ width: 'var(--sidebar-width, 280px)', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Link href="/dashboard" style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: 12, display: 'inline-block' }}>← Back to Dashboard</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.8rem' }}>{app.config.icon}</span>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: app.config.theme?.primary || 'inherit' }}>{t(app.config.name, app.config.locales || {}, locale)}</h1>
          </div>
        </div>
        
        <nav style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {app.config.pages.map(page => (
            <button key={page.name} onClick={() => setActivePage(page.name)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, background: activePage === page.name ? 'var(--bg-glass-hover)' : 'transparent', color: activePage === page.name ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'left', fontWeight: activePage === page.name ? 600 : 400, transition: 'all .2s' }}>
              <span style={{ fontSize: '1.2rem' }}>{page.icon}</span>
              {t(page.title || page.name, app.config.locales || {}, locale)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Dynamic Main Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{ height: 64, borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 32px', background: 'var(--bg-glass)', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{currentPageConfig ? t(currentPageConfig.title || currentPageConfig.name, app.config.locales || {}, locale) : 'Select a page'}</h2>
        </header>
        
        <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
          {currentPageConfig?.type === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              {app.config.entities.map(e => (
                <div key={e.name} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '2.5rem' }}>{e.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{e.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Entity Database</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentPageConfig?.type === 'table' && currentEntityConfig && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 600 }}>{currentEntityConfig.name} Records</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowImport(true)}>📥 Import CSV</button>
                  <button className="btn btn-primary btn-sm" onClick={() => { setEditingRecord(null); setShowForm(true); }}>+ Add Record</button>
                </div>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {currentEntityConfig.fields.map(f => <th key={f.name}>{f.label || f.name}</th>)}
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingData ? (
                      <tr><td colSpan={currentEntityConfig.fields.length + 1} style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>
                    ) : records.length === 0 ? (
                      <tr><td colSpan={currentEntityConfig.fields.length + 1} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No records found.</td></tr>
                    ) : (
                      records.map(record => (
                        <tr key={record.id}>
                          {currentEntityConfig.fields.map(f => (
                            <td key={f.name}>
                              {f.type === 'checkbox' ? (record[f.name] ? '✅' : '❌') : 
                               f.type === 'color' ? <div style={{ width: 24, height: 24, borderRadius: 4, background: record[f.name] }} /> :
                               String(record[f.name] ?? '')}
                            </td>
                          ))}
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingRecord(record); setShowForm(true); }}>Edit</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(record.id)}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Form Modal */}
      {showForm && currentEntityConfig && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>{editingRecord ? 'Edit' : 'New'} {currentEntityConfig.name}</h2>
            <DynamicForm 
              entity={currentEntityConfig} 
              initialData={editingRecord} 
              onSubmit={handleSaveData} 
              onCancel={() => setShowForm(false)} 
              locale={locale} 
              locales={app.config.locales || {}} 
            />
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImport && currentEntityConfig && (
        <CSVImportModal 
          appId={appId} 
          entityName={currentEntityConfig.name} 
          onClose={() => setShowImport(false)} 
          onComplete={() => { setShowImport(false); fetchData(); }} 
          headers={authHeaders()} 
        />
      )}
    </div>
  );
}
