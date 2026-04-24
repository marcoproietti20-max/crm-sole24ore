// FollowUps.jsx
import React from 'react';
import { fmtDate } from '../data';
import emailjs from '@emailjs/browser';

export default function FollowUps({ contacts, setModal, showToast, ejsCfg }) {
  const today = new Date().toISOString().split('T')[0];
  const all = [];
  contacts.forEach(c => (c.history || []).forEach(h => {
    if (h.type === 'note' && h.followup) {
      const status = h.followup < today ? 'scaduto' : h.followup === today ? 'oggi' : 'futuro';
      all.push({ contact: c, note: h, status });
    }
  }));
  all.sort((a, b) => a.note.followup.localeCompare(b.note.followup));

  const groups = { scaduto: [], oggi: [], futuro: [] };
  all.forEach(f => groups[f.status].push(f));

  const sendEmail = async (f) => {
    if (!ejsCfg?.serviceId || !ejsCfg?.pubKey) { showToast('EmailJS non configurato', 'Vai in Impostazioni', 'warn'); return; }
    try {
      await emailjs.send(ejsCfg.serviceId, ejsCfg.templateId, {
        to_email: ejsCfg.email, contact_name: f.contact.nome,
        company: f.contact.azienda || '—', note: f.note.text,
        followup_date: fmtDate(f.note.followup, { weekday: 'long', day: '2-digit', month: 'long' }),
      }, ejsCfg.pubKey);
      showToast('Email inviata', `Promemoria per ${f.contact.nome}`);
    } catch (e) { showToast('Errore invio', 'Controlla le credenziali EmailJS', 'error'); }
  };

  const FuCard = ({ f }) => (
    <div className={`fu-alert ${f.status}`}>
      <div style={{ flex: 1 }}>
        <div className="fw-600">{f.contact.nome}
          <span className="badge" style={{ marginLeft: 6, fontSize: 10, background: f.status === 'scaduto' ? '#FCEBEB' : '#FAEEDA', color: f.status === 'scaduto' ? '#791F1F' : '#633806' }}>
            {f.status === 'scaduto' ? 'Scaduto' : 'Oggi'}
          </span>
        </div>
        <div className="text-muted fs-12">{f.contact.azienda} — {(f.note.text || '').slice(0, 80)}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{fmtDate(f.note.followup, { weekday: 'long', day: '2-digit', month: 'long' })}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-sm" onClick={() => sendEmail(f)}>📧</button>
        <button className="btn btn-sm" onClick={() => setModal({ type: 'followup', data: { contactId: f.contact.id, note: f.note } })}>✏️</button>
      </div>
    </div>
  );

  const FuCardFuturo = ({ f }) => (
    <div className="fu-alert futuro">
      <div style={{ flex: 1 }}>
        <div className="fw-600">{f.contact.nome}</div>
        <div className="text-muted fs-12">{f.contact.azienda} — {(f.note.text || '').slice(0, 80)}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{fmtDate(f.note.followup, { weekday: 'long', day: '2-digit', month: 'long' })}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-sm" onClick={() => sendEmail(f)}>📧</button>
        <button className="btn btn-sm" onClick={() => setModal({ type: 'followup', data: { contactId: f.contact.id, note: f.note } })}>✏️</button>
      </div>
    </div>
  );

  return (
    <>
      <div className="topbar">
        <span className="page-title">Follow-up</span>
        <button className="btn btn-primary btn-sm" onClick={() => all.filter(f => f.status !== 'futuro').forEach(f => sendEmail(f))}>Invia tutti i promemoria</button>
      </div>
      <div className="content">
        {all.length === 0 && <div className="empty">Nessun follow-up programmato</div>}
        {groups.scaduto.length > 0 && <><div className="group-head" style={{ color: '#791F1F' }}>Scaduti ({groups.scaduto.length})</div>{groups.scaduto.map((f, i) => <FuCard key={i} f={f} />)}</>}
        {groups.oggi.length > 0 && <><div className="group-head" style={{ color: '#633806' }}>Oggi ({groups.oggi.length})</div>{groups.oggi.map((f, i) => <FuCard key={i} f={f} />)}</>}
        {groups.futuro.length > 0 && <><div className="group-head">Prossimi ({groups.futuro.length})</div>{groups.futuro.map((f, i) => <FuCardFuturo key={i} f={f} />)}</>}
      </div>
    </>
  );
}
