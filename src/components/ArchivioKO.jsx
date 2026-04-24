// ArchivioKO.jsx
import React, { useState } from 'react';
import { fmtDate, fmtEur } from '../data';

export function ArchivioKO({ deals, stages, setDeals, showToast }) {
  const [q, setQ] = useState('');
  const koDeals = deals.filter(d => stages.find(s => s.name === d.fase && s.isKo));
  const filtered = koDeals.filter(d => !q || (d.nome + d.azienda).toLowerCase().includes(q.toLowerCase()));
  const totalKo = filtered.reduce((s, d) => s + (d.valore || 0), 0);
  const prevStage = stages.filter(s => !s.isKo).slice(-1)[0]?.name || stages[0]?.name;

  const reopen = (id) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, fase: prevStage } : d));
    showToast('Trattativa riaperta', `Spostata in "${prevStage}"`);
  };

  return (
    <>
      <div className="topbar">
        <span className="page-title">Archivio Chiuso KO</span>
        <span className="text-muted fs-12">{koDeals.length} trattative perse</span>
      </div>
      <div className="content">
        <div style={{ background: '#FCEBEB', border: '1px solid #F7C1C1', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#791F1F' }}>
          Trattative perse. Non compaiono nella pipeline attiva né nel grafico "Chiuso per mese".
        </div>
        <div className="search-bar">
          <input className="form-control" style={{ maxWidth: 300 }} placeholder="Cerca..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="table-wrap">
          <table className="crm-table">
            <thead><tr><th>Cliente</th><th>Azienda</th><th>Data chiusura</th><th>Valore</th><th>Note</th><th style={{ width: 80 }}></th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={6} className="empty">Nessuna trattativa persa</td></tr> :
                filtered.map(d => (
                  <tr key={d.id}>
                    <td className="fw-600">{d.nome}</td>
                    <td className="text-muted">{d.azienda || '—'}</td>
                    <td className="text-muted">{d.dataChiusura ? fmtDate(d.dataChiusura, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td style={{ fontWeight: 700, color: '#A32D2D' }}>{fmtEur(d.valore)}</td>
                    <td className="text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.note || '—'}</td>
                    <td><button className="btn btn-sm" onClick={() => reopen(d.id)}>Riapri</button></td>
                  </tr>
                ))
              }
              {filtered.length > 0 && (
                <tr style={{ background: 'var(--bg3)' }}>
                  <td colSpan={3} style={{ fontWeight: 700, fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase' }}>Totale valore perso</td>
                  <td style={{ fontWeight: 700, color: '#A32D2D' }}>{fmtEur(totalKo)}</td>
                  <td colSpan={2} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default ArchivioKO;
