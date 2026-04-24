import React, { useState } from 'react';
import { genId, parseDateIT } from '../data';

export default function Calendly({ contacts, stages, setContacts, gsCfg, brand, syncFromGoogleSheet, showToast }) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [lastSync, setLastSync] = useState(localStorage.getItem('crm_sync_last') || '');
  const [form, setForm] = useState({ nome: '', azienda: '', email: '', telefono: '', data: '', note: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const doSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const result = await syncFromGoogleSheet();
    const now = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('crm_sync_last', now);
    setLastSync(now);
    setSyncResult(result);
    setSyncing(false);
  };

  const importManual = () => {
    if (!form.nome.trim()) return alert('Il nome è obbligatorio');
    const history = [];
    if (form.data) history.push({ id: genId(), type: 'appt', date: form.data, stato: 'Programmato', esito: form.note || '' });
    setContacts(prev => [...prev, {
      id: genId(), nome: form.nome, azienda: form.azienda, email: form.email,
      telefono: form.telefono, fase: stages[1]?.name || stages[0]?.name,
      fonte: 'Calendly', categoria: '', esito: '', proposta: '', customData: {}, history
    }]);
    setForm({ nome: '', azienda: '', email: '', telefono: '', data: '', note: '' });
    showToast('Contatto importato', form.nome);
  };

  return (
    <>
      <div className="topbar"><span className="page-title">Calendly</span></div>
      <div className="content">
        {/* Google Sheet sync */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Sincronizzazione automatica da Google Sheet</div>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
            Zapier popola il Google Sheet ad ogni nuova prenotazione Calendly. Clicca <strong>Sincronizza ora</strong> per importare tutti i nuovi contatti — i duplicati vengono ignorati automaticamente.
          </p>
          {lastSync && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>Ultima sincronizzazione: {lastSync}</div>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={doSync} disabled={syncing}>
              {syncing ? '⏳ Sincronizzazione...' : '🔄 Sincronizza ora'}
            </button>
          </div>
          {syncResult && (
            <div style={{ marginTop: 12, fontSize: 13 }}>
              {syncResult.error ? (
                <span style={{ color: '#A32D2D' }}>Errore: {syncResult.error}</span>
              ) : (
                <span><span style={{ color: '#3B6D11', fontWeight: 600 }}>Sincronizzazione completata.</span>{' '}
                <span style={{ color: 'var(--text2)' }}>{syncResult.imported} nuovi contatti importati, {syncResult.skipped} già presenti.</span></span>
              )}
            </div>
          )}
        </div>

        {/* Manual import */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Importa prenotazione manualmente</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nome e Cognome *</label><input className="form-control" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Mario Rossi" /></div>
            <div className="form-group"><label className="form-label">Azienda</label><input className="form-control" value={form.azienda} onChange={e => set('azienda', e.target.value)} placeholder="Acme Srl" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Telefono</label><input className="form-control" value={form.telefono} onChange={e => set('telefono', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Data appuntamento</label><input className="form-control" type="datetime-local" value={form.data} onChange={e => set('data', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Note</label><textarea className="form-control" value={form.note} onChange={e => set('note', e.target.value)} placeholder="Note dalla prenotazione..." /></div>
          <button className="btn btn-primary" onClick={importManual}>Importa contatto</button>
        </div>

        {/* Calendly link */}
        <div className="card card-0">
          <div className="card-title">Il tuo link Calendly</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Link di prenotazione personale:</p>
          <a href={brand.callink || 'https://calendly.com'} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>{(brand.callink || '').replace('https://', '')} ↗</a>
        </div>
      </div>
    </>
  );
}
