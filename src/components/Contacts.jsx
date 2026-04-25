import React, { useState, useMemo } from 'react';
import { fmtDate, fmtDateTime, genId, FONTI, CATEGORIE, ESITI, PROPOSTE, STATI_APPT } from '../data';
import { StageBadge, FonteBadge, EsitoBadge, PropostaBadge, StatoBadge } from './Badges';

export default function Contacts({ contacts, stages, customFields, setModal, updateContact,
  deleteContact, deleteContacts, setContacts, showToast, today }) {
  const [q, setQ] = useState('');
  const [filterFase, setFilterFase] = useState('');
  const [filterFonte, setFilterFonte] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedCid, setSelectedCid] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteFu, setNoteFu] = useState('');
  const [noteFase, setNoteFase] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const getLastAppt = (c) => {
    const appts = (c.history || []).filter(h => h.type === 'appt' && h.date).sort((a, b) => b.date.localeCompare(a.date));
    return appts[0] ? appts[0].date.split('T')[0] : '';
  };
  const getNextFu = (c) => {
    const fus = (c.history || []).filter(h => h.type === 'note' && h.followup).sort((a, b) => a.followup.localeCompare(b.followup));
    return fus[0] ? fus[0].followup : '';
  };

  const filtered = useMemo(() => {
    let list = contacts.filter(c => {
      if (q && !(c.nome + c.azienda + (c.email || '')).toLowerCase().includes(q.toLowerCase())) return false;
      if (filterFase && c.fase !== filterFase) return false;
      if (filterFonte && c.fonte !== filterFonte) return false;
      return true;
    });
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va, vb;
        if (sortKey === 'nome') { va = a.nome || ''; vb = b.nome || ''; }
        else if (sortKey === 'azienda') { va = a.azienda || ''; vb = b.azienda || ''; }
        else if (sortKey === 'fase') { va = a.fase || ''; vb = b.fase || ''; }
        else if (sortKey === 'categoria') { va = a.categoria || ''; vb = b.categoria || ''; }
        else if (sortKey === 'fonte') { va = a.fonte || ''; vb = b.fonte || ''; }
        else if (sortKey === 'esito') { va = a.esito || ''; vb = b.esito || ''; }
        else if (sortKey === 'proposta') { va = a.proposta || ''; vb = b.proposta || ''; }
        else if (sortKey === 'ultimoApp') { va = getLastAppt(a); vb = getLastAppt(b); }
        else if (sortKey === 'followup') { va = getNextFu(a); vb = getNextFu(b); }
        else { va = ''; vb = ''; }
        const cmp = va.localeCompare(vb, 'it', { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [contacts, q, filterFase, filterFonte, sortKey, sortDir]);

  const allChecked = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));

  const toggleOne = (id, checked) => {
    setSelectedIds(prev => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n; });
  };
  const toggleAll = (checked) => {
    setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(c => checked ? n.add(c.id) : n.delete(c.id)); return n; });
  };

  const selectedContact = contacts.find(c => c.id === selectedCid);

  const addNote = () => {
    if (!noteText.trim()) return;
    updateContact(selectedCid, c => ({
      ...c,
      history: [...(c.history || []), { id: genId(), type: 'note', date: today, text: noteText, followup: noteFu }],
      ...(noteFase ? { fase: noteFase } : {}),
    }));
    setNoteText(''); setNoteFu(''); setNoteFase('');
    showToast('Nota aggiunta', '');
  };

  const bulkChangeFase = (fase) => {
    if (!fase || !selectedIds.size) return;
    setContacts(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, fase } : c));
    showToast(`${selectedIds.size} contatti aggiornati`, fase);
  };

  const bulkChangeFonte = (fonte) => {
    if (!fonte || !selectedIds.size) return;
    setContacts(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, fonte } : c));
    showToast(`${selectedIds.size} contatti aggiornati`, fonte);
  };

  return (
    <>
      <div className="topbar">
        <span className="page-title">Contatti <span className="text-muted fs-12">({contacts.length})</span></span>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'contact', data: null })}>+ Nuovo contatto</button>
      </div>
      <div className="content">
        {/* Search bar */}
        <div className="search-bar">
          <input className="form-control" style={{ flex: 1, maxWidth: 300 }} placeholder="Cerca nome, azienda, email..."
            value={q} onChange={e => setQ(e.target.value)} />
          <select className="form-control" style={{ width: 150 }} value={filterFase} onChange={e => setFilterFase(e.target.value)}>
            <option value="">Tutte le fasi</option>
            {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select className="form-control" style={{ width: 150 }} value={filterFonte} onChange={e => setFilterFonte(e.target.value)}>
            <option value="">Tutte le fonti</option>
            {FONTI.map(f => <option key={f.name} value={f.name}>{f.icon} {f.name}</option>)}
          </select>
        </div>

        {/* Bulk bar */}
        {selectedIds.size > 0 && (
          <div className="bulk-bar">
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0C447C' }}>{selectedIds.size} selezionati</span>
            <div className="bulk-sep" />
            <select className="form-control" style={{ width: 140, fontSize: 12, padding: '4px 8px' }}
              onChange={e => { bulkChangeFase(e.target.value); e.target.value = ''; }}>
              <option value="">Cambia fase...</option>
              {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <div className="bulk-sep" />
            <select className="form-control" style={{ width: 155, fontSize: 12, padding: '4px 8px' }}
              onChange={e => { bulkChangeFonte(e.target.value); e.target.value = ''; }}>
              <option value="">Cambia fonte...</option>
              {FONTI.map(f => <option key={f.name} value={f.name}>{f.icon} {f.name}</option>)}
            </select>
            <div className="bulk-sep" />
            <button className="btn btn-sm btn-danger" onClick={() => {
              if (window.confirm(`Eliminare ${selectedIds.size} contatti?`)) {
                deleteContacts(selectedIds); setSelectedIds(new Set());
              }
            }}>🗑 Elimina</button>
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setSelectedIds(new Set())}>× Deseleziona</button>
          </div>
        )}

        {/* Table */}
        <div className="table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{ width: 32, textAlign: 'center' }}>
                  <input type="checkbox" checked={allChecked} onChange={e => toggleAll(e.target.checked)} />
                </th>
                {[
                  ['nome','Nome'],['azienda','Azienda'],['telefono','Telefono'],
                  ['email','Email'],['fase','Fase'],['categoria','Categoria'],
                  ['ultimoApp','Ultimo App.'],['proposta','Proposta'],
                  ['followup','Follow-up'],['fonte','Fonte'],['esito','Esito']
                ].map(([key, label]) => (
                  <th key={key} onClick={() => key !== 'telefono' && key !== 'email' ? handleSort(key) : null}
                    style={{ cursor: key !== 'telefono' && key !== 'email' ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    {label}{sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
                {customFields.slice(0, 2).map(f => <th key={f.id}>{f.name}</th>)}
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={13} className="empty">Nessun contatto trovato</td></tr>
              ) : filtered.map(c => {
                const hist = c.history || [];
                const appts = hist.filter(h => h.type === 'appt' && h.date).sort((a, b) => b.date.localeCompare(a.date));
                const lastDs = appts[0] ? appts[0].date.split('T')[0] : '';
                const fuNotes = hist.filter(h => h.type === 'note' && h.followup).sort((a, b) => a.followup.localeCompare(b.followup));
                const fu = fuNotes[0];
                const isChecked = selectedIds.has(c.id);
                return (
                  <tr key={c.id} style={{ background: isChecked ? 'rgba(200,16,46,0.04)' : '' }}
                    onClick={() => setSelectedCid(selectedCid === c.id ? null : c.id)}>
                    <td style={{ textAlign: 'center' }} onClick={e => { e.stopPropagation(); toggleOne(c.id, !isChecked); }}>
                      <input type="checkbox" checked={isChecked} onChange={() => {}} />
                    </td>
                    <td><span className="fw-600">{c.nome}</span></td>
                    <td>{c.azienda || '—'}</td>
                    <td>{c.telefono || '—'}</td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || '—'}</td>
                    <td><StageBadge name={c.fase} stages={stages} /></td>
                    <td className="fs-12 text-muted">{c.categoria || '—'}</td>
                    <td className="fs-12">
                      {lastDs ? <span style={{ color: lastDs < today ? '#A32D2D' : '#185FA5', fontWeight: 500 }}>{fmtDate(lastDs, { day: '2-digit', month: 'short', year: 'numeric' })}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td><PropostaBadge name={c.proposta} /></td>
                    <td className="fs-11">
                      {fu ? <span style={{ color: fu.followup < today ? '#A32D2D' : fu.followup === today ? '#E07B1A' : '#185FA5', fontWeight: 500 }}>{fmtDate(fu.followup, { day: '2-digit', month: 'short', year: 'numeric' })}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td><FonteBadge name={c.fonte} /></td>
                    <td><EsitoBadge name={c.esito} /></td>
                    {customFields.slice(0, 2).map(f => <td key={f.id} className="fs-12">{(c.customData || {})[f.id] || '—'}</td>)}
                    <td style={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sm btn-primary" style={{ marginRight: 4 }} onClick={() => setModal({ type: 'contact', data: c })}>Modifica</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedContact && <ContactDetail c={selectedContact} stages={stages} customFields={customFields} today={today}
          setModal={setModal} updateContact={updateContact} showToast={showToast}
          noteText={noteText} setNoteText={setNoteText} noteFu={noteFu} setNoteFu={setNoteFu}
          noteFase={noteFase} setNoteFase={setNoteFase} addNote={addNote} />}
      </div>
    </>
  );
}

function ContactDetail({ c, stages, customFields, today, setModal, updateContact, showToast,
  noteText, setNoteText, noteFu, setNoteFu, noteFase, setNoteFase, addNote }) {
  const hist = (c.history || []).slice().reverse();

  return (
    <div className="detail-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{c.nome}</div>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>{c.azienda}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <StageBadge name={c.fase} stages={stages} />
          {c.categoria && <span className="badge" style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', fontSize: 11 }}>{c.categoria}</span>}
          <FonteBadge name={c.fonte} />
          <EsitoBadge name={c.esito} />
          <button className="btn btn-sm" onClick={() => setModal({ type: 'contact', data: c })}>Modifica</button>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-item"><label>Telefono</label><span>{c.telefono || '—'}</span></div>
        <div className="info-item"><label>Email</label><span>{c.email || '—'}</span></div>
        <div className="info-item"><label>Proposta</label><span><PropostaBadge name={c.proposta} /></span></div>
        <div className="info-item"><label>Attività</label><span>{(c.history || []).length}</span></div>
      </div>

      {customFields.length > 0 && (
        <div className="info-grid" style={{ marginBottom: 14 }}>
          {customFields.map(f => (
            <div key={f.id} className="info-item"><label>{f.name}</label><span>{(c.customData || {})[f.id] || '—'}</span></div>
          ))}
        </div>
      )}

      <div className="section-divider">
        <div className="section-head">
          Storico attività
          <button className="btn btn-sm btn-primary" onClick={() => setModal({ type: 'appt', data: { contactId: c.id, appt: null } })}>+ Appuntamento</button>
        </div>

        {hist.map(h => {
          if (h.type === 'appt') {
            return (
              <div key={h.id} className="history-item appt" style={{ borderLeftColor: (h.stato === 'Svolto' ? '#639922' : h.stato === 'Da rifissare' ? '#E07B1A' : h.stato === 'Non effettuato' ? '#A32D2D' : '#378ADD') }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="history-tag tag-appt">Appuntamento</span>
                  <StatoBadge name={h.stato} />
                </div>
                <div className="history-date">{fmtDateTime(h.date)}</div>
                <div className="history-text">{h.esito || <em style={{ color: 'var(--text3)' }}>Nessun esito registrato</em>}</div>
                <button className="btn btn-sm" style={{ marginTop: 6 }} onClick={() => setModal({ type: 'appt', data: { contactId: c.id, appt: h } })}>Aggiorna</button>
              </div>
            );
          }
          const fuStatus = h.followup ? (h.followup < today ? 'scaduto' : h.followup === today ? 'oggi' : 'futuro') : '';
          const fuColor = { scaduto: '#A32D2D', oggi: '#E07B1A', futuro: '#185FA5' }[fuStatus] || '';
          return (
            <div key={h.id} className="history-item note">
              <span className="history-tag tag-note">Nota</span>
              <div className="history-date">{fmtDate(h.date, { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div className="history-text">{h.text}</div>
              {h.followup && (
                <>
                  <div style={{ fontSize: 11, color: fuColor, fontWeight: 500, marginTop: 4 }}>
                    Follow-up: {fmtDate(h.followup, { weekday: 'long', day: '2-digit', month: 'long' })}
                    {fuStatus === 'scaduto' ? ' — SCADUTO' : fuStatus === 'oggi' ? ' — OGGI' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-sm" onClick={() => setModal({ type: 'followup', data: { contactId: c.id, note: h } })}>✏️ Modifica</button>
                    <button className="btn btn-sm btn-danger" onClick={() => {
                      updateContact(c.id, ct => ({ ...ct, history: (ct.history || []).map(x => x.id === h.id ? { ...x, followup: '' } : x) }));
                    }}>× Elimina follow-up</button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {hist.length === 0 && <div className="empty" style={{ padding: '14px 0' }}>Nessuna attività registrata</div>}

        {/* Add note form */}
        <div style={{ marginTop: 12, background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 14 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>Aggiungi nota</div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <textarea className="form-control" style={{ minHeight: 60 }} placeholder="Nota sull'appuntamento..."
              value={noteText} onChange={e => setNoteText(e.target.value)} />
          </div>
          <div className="form-row" style={{ marginBottom: 8 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Follow-up</label>
              <input className="form-control" type="date" value={noteFu} onChange={e => setNoteFu(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Aggiorna fase</label>
              <select className="form-control" value={noteFase} onChange={e => setNoteFase(e.target.value)}>
                <option value="">— nessun cambiamento —</option>
                {/* stages passed as prop through parent */}
              </select>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={addNote}>Salva nota</button>
        </div>
      </div>
    </div>
  );
}
