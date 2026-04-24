import React, { useState } from 'react';
import { genId, DEFAULT_STAGES } from '../data';

export default function Settings({ brand, setBrand, stages, setStages, customFields, setCustomFields,
  gsCfg, setGsCfg, ejsCfg, setEjsCfg, contacts, deals, setContacts, setDeals, showToast }) {

  const [newStage, setNewStage] = useState({ name: '', color: '#378ADD' });
  const [newField, setNewField] = useState({ name: '', type: 'text', options: '' });
  const [gsTest, setGsTest] = useState('');

  const saveBrand = (k, v) => setBrand(b => ({ ...b, [k]: v }));

  const addStage = () => {
    if (!newStage.name.trim()) return;
    setStages(prev => [...prev, { id: genId(), name: newStage.name, color: newStage.color, isKo: false }]);
    setNewStage({ name: '', color: '#378ADD' });
    showToast('Fase aggiunta', newStage.name);
  };

  const removeStage = (id) => {
    if (stages.length <= 1) return;
    if (!window.confirm('Eliminare questa fase? Le trattative verranno spostate alla prima fase.')) return;
    const removed = stages.find(s => s.id === id);
    setStages(prev => prev.filter(s => s.id !== id));
    setDeals(prev => prev.map(d => d.fase === removed?.name ? { ...d, fase: stages[0].name } : d));
    setContacts(prev => prev.map(c => c.fase === removed?.name ? { ...c, fase: stages[0].name } : c));
  };

  const addField = () => {
    if (!newField.name.trim()) return;
    const field = { id: genId(), name: newField.name, type: newField.type };
    if (newField.type === 'select' && newField.options) field.options = newField.options.split(',').map(s => s.trim()).filter(Boolean);
    setCustomFields(prev => [...prev, field]);
    setNewField({ name: '', type: 'text', options: '' });
    showToast('Campo aggiunto', newField.name);
  };

  const testGS = async () => {
    setGsTest('Connessione in corso...');
    try {
      const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${gsCfg.sheetId}?key=${gsCfg.apiKey}&fields=sheets.properties`);
      const data = await r.json();
      if (data.error) { setGsTest('Errore: ' + data.error.message); return; }
      const tabs = data.sheets?.map(s => s.properties.title).join(', ') || 'nessun tab';
      const match = data.sheets?.find(s => String(s.properties.sheetId) === gsCfg.gid);
      if (match) setGsCfg(c => ({ ...c, tabName: match.properties.title }));
      setGsTest('✅ Connessione OK — Tab: ' + tabs);
    } catch (e) { setGsTest('Errore: ' + e.message); }
  };

  const exportCSV = () => {
    const rows = [['Nome', 'Azienda', 'Telefono', 'Email', 'Fase', 'Fonte', 'Categoria', 'Esito', 'Proposta']];
    contacts.forEach(c => rows.push([c.nome, c.azienda || '', c.telefono || '', c.email || '', c.fase || '', c.fonte || '', c.categoria || '', c.esito || '', c.proposta || '']));
    const csv = rows.map(r => r.map(v => '"' + (v || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = 'crm_contatti_' + new Date().toISOString().split('T')[0] + '.csv'; a.click();
  };

  const clearAll = () => {
    if (!window.confirm('Cancellare TUTTI i dati? Azione irreversibile.')) return;
    setContacts([]); setDeals([]); showToast('Dati cancellati', '');
  };

  return (
    <>
      <div className="topbar"><span className="page-title">Impostazioni</span></div>
      <div className="content">

        {/* Brand */}
        <div className="settings-section">
          <div className="settings-title">Personalizzazione interfaccia</div>
          <div className="settings-desc">Modifica nome, colori e dettagli visivi del CRM.</div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Nome CRM</label><input className="form-control" value={brand.name || ''} onChange={e => saveBrand('name', e.target.value)} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Sottotitolo</label><input className="form-control" value={brand.sub || ''} onChange={e => saveBrand('sub', e.target.value)} /></div>
          </div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Il tuo nome</label><input className="form-control" value={brand.user || ''} onChange={e => saveBrand('user', e.target.value)} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Ruolo / Azienda</label><input className="form-control" value={brand.role || ''} onChange={e => saveBrand('role', e.target.value)} /></div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Colore principale</label><input className="form-control" type="color" value={brand.color || '#c8102e'} onChange={e => saveBrand('color', e.target.value)} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Link Calendly</label><input className="form-control" value={brand.callink || ''} onChange={e => saveBrand('callink', e.target.value)} /></div>
          </div>
        </div>

        {/* Stages */}
        <div className="settings-section">
          <div className="settings-title">Fasi della pipeline</div>
          <div className="settings-desc">Aggiungi, rinomina o rimuovi le fasi. Spunta "KO" per mandare una fase all'archivio.</div>
          {stages.map(s => (
            <div key={s.id} className="stage-row">
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <input className="form-control" style={{ flex: 1 }} value={s.name} onChange={e => setStages(prev => prev.map(x => x.id === s.id ? { ...x, name: e.target.value } : x))} />
              <input type="color" className="form-control" style={{ width: 40, height: 30, padding: '2px 3px' }} value={s.color} onChange={e => setStages(prev => prev.map(x => x.id === s.id ? { ...x, color: e.target.value } : x))} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={s.isKo || false} onChange={e => setStages(prev => prev.map(x => x.id === s.id ? { ...x, isKo: e.target.checked } : x))} /> KO
              </label>
              {stages.length > 1 && <button className="btn btn-sm btn-danger" onClick={() => removeStage(s.id)}>×</button>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input className="form-control" style={{ flex: 1 }} placeholder="Nome nuova fase..." value={newStage.name} onChange={e => setNewStage(n => ({ ...n, name: e.target.value }))} />
            <input type="color" className="form-control" style={{ width: 50 }} value={newStage.color} onChange={e => setNewStage(n => ({ ...n, color: e.target.value }))} />
            <button className="btn btn-primary btn-sm" onClick={addStage}>+ Aggiungi</button>
          </div>
        </div>

        {/* Custom fields */}
        <div className="settings-section">
          <div className="settings-title">Campi personalizzati</div>
          <div className="settings-desc">Aggiungi campi extra alle anagrafiche (es. "Settore", "Budget").</div>
          {customFields.map((f, i) => (
            <div key={f.id} className="field-row">
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{f.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text2)', padding: '2px 7px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4 }}>{f.type}</span>
              <button className="btn btn-sm btn-danger" onClick={() => setCustomFields(prev => prev.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {customFields.length === 0 && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>Nessun campo personalizzato.</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <input className="form-control" style={{ flex: 1, minWidth: 120 }} placeholder="Nome campo..." value={newField.name} onChange={e => setNewField(n => ({ ...n, name: e.target.value }))} />
            <select className="form-control" style={{ width: 120 }} value={newField.type} onChange={e => setNewField(n => ({ ...n, type: e.target.value }))}>
              <option value="text">Testo</option><option value="number">Numero</option>
              <option value="date">Data</option><option value="select">Selezione</option>
              <option value="textarea">Testo lungo</option>
            </select>
            {newField.type === 'select' && <input className="form-control" style={{ flex: 1, minWidth: 150 }} placeholder="Opzioni sep. da virgola" value={newField.options} onChange={e => setNewField(n => ({ ...n, options: e.target.value }))} />}
            <button className="btn btn-primary btn-sm" onClick={addField}>+ Aggiungi</button>
          </div>
        </div>

        {/* Google Sheets */}
        <div className="settings-section">
          <div className="settings-title">Sincronizzazione Google Sheet</div>
          <div className="settings-desc">Credenziali per la sincronizzazione automatica delle prenotazioni Calendly.</div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Sheet ID</label><input className="form-control" value={gsCfg.sheetId || ''} onChange={e => setGsCfg(c => ({ ...c, sheetId: e.target.value }))} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">API Key</label><input className="form-control" type="password" value={gsCfg.apiKey || ''} onChange={e => setGsCfg(c => ({ ...c, apiKey: e.target.value }))} /></div>
          </div>
          <div className="form-row" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Nome foglio (tab)</label><input className="form-control" value={gsCfg.tabName || ''} onChange={e => setGsCfg(c => ({ ...c, tabName: e.target.value }))} /></div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">GID</label><input className="form-control" value={gsCfg.gid || ''} onChange={e => setGsCfg(c => ({ ...c, gid: e.target.value }))} /></div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={testGS}>Test connessione</button>
          {gsTest && <div style={{ marginTop: 8, fontSize: 12, color: gsTest.startsWith('✅') ? '#3B6D11' : '#A32D2D' }}>{gsTest}</div>}
        </div>

        {/* Data management */}
        <div className="settings-section">
          <div className="settings-title">Gestione dati</div>
          <div className="settings-desc">Esporta o cancella i dati del CRM.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={exportCSV}>Esporta CSV</button>
            <button className="btn btn-sm btn-danger" onClick={clearAll}>Cancella tutti i dati</button>
          </div>
        </div>

      </div>
    </>
  );
}
