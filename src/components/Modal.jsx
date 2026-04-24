import React, { useState, useEffect } from 'react';
import { FONTI, CATEGORIE, ESITI, PROPOSTE, STATI_APPT, genId, fmtDateTime } from '../data';

export default function Modal({ modal, setModal, contacts, stages, customFields,
  saveContact, deleteContact, saveDeal, deleteDeal, deals, updateContact, showToast }) {
  const close = () => setModal(null);

  if (modal.type === 'contact') return (
    <ContactModal
      contact={modal.data}
      stages={stages}
      customFields={customFields}
      onSave={(data) => { saveContact(data); close(); }}
      onDelete={(id) => { if (window.confirm('Eliminare questo contatto?')) { deleteContact(id); close(); } }}
      onClose={close}
    />
  );

  if (modal.type === 'deal') return (
    <DealModal
      deal={modal.data}
      contacts={contacts}
      stages={stages}
      onSave={(data) => { saveDeal(data); close(); }}
      onDelete={(id) => { if (window.confirm('Eliminare questa trattativa?')) { deleteDeal(id); close(); } }}
      onClose={close}
    />
  );

  if (modal.type === 'appt') return (
    <ApptModal
      contactId={modal.data.contactId}
      appt={modal.data.appt}
      stages={stages}
      onSave={(contactId, appt, fase) => {
        updateContact(contactId, c => {
          const hist = c.history ? [...c.history] : [];
          const idx = hist.findIndex(h => h.id === appt.id);
          if (idx >= 0) hist[idx] = appt; else hist.push(appt);
          return { ...c, history: hist, ...(fase ? { fase } : {}) };
        });
        showToast('Appuntamento salvato', '');
        close();
      }}
      onDelete={(contactId, apptId) => {
        updateContact(contactId, c => ({ ...c, history: (c.history || []).filter(h => h.id !== apptId) }));
        close();
      }}
      onClose={close}
    />
  );

  if (modal.type === 'followup') return (
    <FollowupModal
      contactId={modal.data.contactId}
      note={modal.data.note}
      onSave={(contactId, note) => {
        updateContact(contactId, c => {
          const hist = c.history ? [...c.history] : [];
          const idx = hist.findIndex(h => h.id === note.id);
          if (idx >= 0) hist[idx] = note; else hist.push(note);
          return { ...c, history: hist };
        });
        showToast('Follow-up aggiornato', '');
        close();
      }}
      onDelete={(contactId, noteId) => {
        updateContact(contactId, c => {
          const hist = (c.history || []).map(h => h.id === noteId ? { ...h, followup: '' } : h);
          return { ...c, history: hist };
        });
        showToast('Follow-up eliminato', '');
        close();
      }}
      onClose={close}
    />
  );

  return null;
}

// ---- Contact Form ----
function ContactModal({ contact, stages, customFields, onSave, onDelete, onClose }) {
  const c = contact || {};
  const [form, setForm] = useState({
    id: c.id || '', nome: c.nome || '', azienda: c.azienda || '',
    email: c.email || '', telefono: c.telefono || '',
    fase: c.fase || stages[0]?.name || '',
    fonte: c.fonte || '', categoria: c.categoria || '',
    esito: c.esito || '', proposta: c.proposta || '',
    customData: c.customData || {}, history: c.history || [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = () => {
    if (!form.nome.trim()) return alert('Il nome è obbligatorio');
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{c.id ? 'Modifica contatto' : 'Nuovo contatto'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome e Cognome *</label>
              <input className="form-control" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Mario Rossi" />
            </div>
            <div className="form-group">
              <label className="form-label">Azienda</label>
              <input className="form-control" value={form.azienda} onChange={e => set('azienda', e.target.value)} placeholder="Acme Srl" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefono</label>
              <input className="form-control" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+39 06..." />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="mario@acme.it" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fase</label>
              <select className="form-control" value={form.fase} onChange={e => set('fase', e.target.value)}>
                {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-control" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                <option value="">— seleziona —</option>
                {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fonte</label>
              <select className="form-control" value={form.fonte} onChange={e => set('fonte', e.target.value)}>
                <option value="">— seleziona —</option>
                {FONTI.map(f => <option key={f.name} value={f.name}>{f.icon} {f.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Esito</label>
              <select className="form-control" value={form.esito} onChange={e => set('esito', e.target.value)}>
                <option value="">— seleziona —</option>
                {ESITI.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Proposta</label>
              <select className="form-control" value={form.proposta} onChange={e => set('proposta', e.target.value)}>
                <option value="">— seleziona —</option>
                {PROPOSTE.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group" />
          </div>
          {customFields.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
              <div className="form-label" style={{ marginBottom: 10 }}>Campi aggiuntivi</div>
              {customFields.map(f => (
                <div className="form-group" key={f.id}>
                  <label className="form-label">{f.name}</label>
                  {f.type === 'textarea' ? (
                    <textarea className="form-control" value={form.customData[f.id] || ''}
                      onChange={e => set('customData', { ...form.customData, [f.id]: e.target.value })} />
                  ) : f.type === 'select' && f.options ? (
                    <select className="form-control" value={form.customData[f.id] || ''}
                      onChange={e => set('customData', { ...form.customData, [f.id]: e.target.value })}>
                      <option value="">—</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="form-control" type={f.type || 'text'} value={form.customData[f.id] || ''}
                      onChange={e => set('customData', { ...form.customData, [f.id]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {c.id && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => onDelete(c.id)}>Elimina</button>}
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={handle}>Salva</button>
        </div>
      </div>
    </div>
  );
}

// ---- Deal Form ----
function DealModal({ deal, contacts, stages, onSave, onDelete, onClose }) {
  const d = deal || {};
  const [form, setForm] = useState({
    id: d.id || '', contactId: d.contactId || '',
    nome: d.nome || '', azienda: d.azienda || '',
    valore: d.valore || '', dataChiusura: d.dataChiusura || '',
    fase: d.fase || stages[0]?.name || '', note: d.note || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleContactChange = (id) => {
    const c = contacts.find(x => x.id === id);
    set('contactId', id);
    if (c) { setForm(f => ({ ...f, contactId: id, nome: c.nome, azienda: c.azienda || '' })); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{d.id ? 'Modifica trattativa' : 'Nuova trattativa'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Contatto</label>
            <select className="form-control" value={form.contactId} onChange={e => handleContactChange(e.target.value)}>
              <option value="">— seleziona —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.nome} – {c.azienda || ''}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valore (€)</label>
              <input className="form-control" type="number" value={form.valore} onChange={e => set('valore', e.target.value)} placeholder="3600" />
            </div>
            <div className="form-group">
              <label className="form-label">Data chiusura prevista</label>
              <input className="form-control" type="date" value={form.dataChiusura} onChange={e => set('dataChiusura', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Fase</label>
            <select className="form-control" value={form.fase} onChange={e => set('fase', e.target.value)}>
              {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <textarea className="form-control" value={form.note} onChange={e => set('note', e.target.value)} placeholder="Dettagli proposta..." />
          </div>
        </div>
        <div className="modal-footer">
          {d.id && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => onDelete(d.id)}>Elimina</button>}
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={() => onSave({ ...form, valore: parseFloat(form.valore) || 0 })}>Salva</button>
        </div>
      </div>
    </div>
  );
}

// ---- Appointment Form ----
function ApptModal({ contactId, appt, stages, onSave, onDelete, onClose }) {
  const a = appt || {};
  const [form, setForm] = useState({
    id: a.id || genId(),
    date: a.date || '', stato: a.stato || 'Programmato', esito: a.esito || '',
  });
  const [fase, setFase] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{a.id ? 'Aggiorna appuntamento' : 'Registra appuntamento'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data e ora</label>
              <input className="form-control" type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Stato</label>
              <select className="form-control" value={form.stato} onChange={e => set('stato', e.target.value)}>
                {STATI_APPT.map(s => <option key={s.name} value={s.name}>{s.icon} {s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note / Esito</label>
            <textarea className="form-control" value={form.esito} onChange={e => set('esito', e.target.value)} placeholder="Come è andato? Cosa è emerso?" />
          </div>
          <div className="form-group">
            <label className="form-label">Aggiorna fase pipeline</label>
            <select className="form-control" value={fase} onChange={e => setFase(e.target.value)}>
              <option value="">— nessun cambiamento —</option>
              {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          {a.id && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => onDelete(contactId, a.id)}>Elimina</button>}
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={() => onSave(contactId, { ...form, type: 'appt' }, fase)}>Salva</button>
        </div>
      </div>
    </div>
  );
}

// ---- Follow-up Form ----
function FollowupModal({ contactId, note, onSave, onDelete, onClose }) {
  const n = note || {};
  const [form, setForm] = useState({ id: n.id || genId(), type: 'note', date: n.date || new Date().toISOString().split('T')[0], text: n.text || '', followup: n.followup || '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Modifica follow-up</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Data follow-up</label>
            <input className="form-control" type="date" value={form.followup} onChange={e => set('followup', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Nota</label>
            <textarea className="form-control" value={form.text} onChange={e => set('text', e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          {n.id && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => onDelete(contactId, n.id)}>Elimina follow-up</button>}
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={() => onSave(contactId, form)}>Salva</button>
        </div>
      </div>
    </div>
  );
}
