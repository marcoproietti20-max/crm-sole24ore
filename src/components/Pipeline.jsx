// Pipeline.jsx
import React from 'react';
import { fmtDate, fmtEur } from '../data';
import { StageBadge } from './Badges';

export function Pipeline({ deals, stages, setModal }) {
  const activeStages = stages.filter(s => !s.isKo);
  return (
    <>
      <div className="topbar">
        <span className="page-title">Pipeline di vendita</span>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'deal', data: null })}>+ Nuova trattativa</button>
      </div>
      <div className="content">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeStages.length},1fr)`, gap: 12, marginBottom: 6 }}>
          {activeStages.map(s => (
            <div key={s.id} style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', paddingBottom: 6, borderBottom: `3px solid ${s.color}`, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.name}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeStages.length},1fr)`, gap: 12, alignItems: 'start' }}>
          {activeStages.map(s => {
            const stageDeals = deals.filter(d => d.fase === s.name);
            return (
              <div key={s.id} className="kanban-col">
                <div className="kanban-header"><span>{s.name}</span><span className="kanban-count">{stageDeals.length}</span></div>
                {stageDeals.map(d => (
                  <div key={d.id} className="deal-card" onClick={() => setModal({ type: 'deal', data: d })}>
                    <div className="deal-name">{d.nome}</div>
                    <div className="deal-company">{d.azienda}</div>
                    <div className="deal-footer">
                      <span className="deal-value">{fmtEur(d.valore)}</span>
                      <span className="deal-date">{d.dataChiusura ? fmtDate(d.dataChiusura, { day: '2-digit', month: 'short' }) : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default Pipeline;
