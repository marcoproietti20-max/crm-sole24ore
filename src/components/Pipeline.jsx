import React from 'react';
import { fmtDate } from '../data';
import { FonteBadge, PropostaBadge } from './Badges';

export default function Pipeline({ contacts, stages, setModal, setPage }) {
  const activeStages = stages.filter(s => !s.isKo);
  const cols = activeStages.length;

  return (
    <>
      <div className="topbar">
        <span className="page-title">Pipeline di vendita</span>
        <span className="text-muted fs-12">{contacts.filter(c => !stages.find(s => s.name === c.fase && s.isKo)).length} contatti attivi</span>
      </div>
      <div className="content">
        {/* Stage headers */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, marginBottom: 6 }}>
          {activeStages.map(s => {
            const cnt = contacts.filter(c => c.fase === s.name).length;
            return (
              <div key={s.id} style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', paddingBottom: 6, borderBottom: `3px solid ${s.color}`, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.name} <span style={{ fontWeight: 400, opacity: 0.7 }}>({cnt})</span>
              </div>
            );
          })}
        </div>

        {/* Kanban columns */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, alignItems: 'start' }}>
          {activeStages.map(s => {
            const stageContacts = contacts.filter(c => c.fase === s.name);
            return (
              <div key={s.id} className="kanban-col">
                <div className="kanban-header">
                  <span>{s.name}</span>
                  <span className="kanban-count">{stageContacts.length}</span>
                </div>
                {stageContacts.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>Nessun contatto</div>
                )}
                {stageContacts.map(c => {
                  // Get last appt date
                  const appts = (c.history || []).filter(h => h.type === 'appt' && h.date).sort((a, b) => b.date.localeCompare(a.date));
                  const lastAppt = appts[0] ? appts[0].date.split('T')[0] : '';
                  // Get next follow-up
                  const today = new Date().toISOString().split('T')[0];
                  const fus = (c.history || []).filter(h => h.type === 'note' && h.followup).sort((a, b) => a.followup.localeCompare(b.followup));
                  const fu = fus[0];
                  const fuUrgent = fu && fu.followup <= today;

                  return (
                    <div key={c.id} className="deal-card" onClick={() => {
                      setModal({ type: 'contact', data: c });
                    }}>
                      <div className="deal-name">{c.nome}</div>
                      <div className="deal-company">{c.azienda || '—'}</div>
                      {c.categoria && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{c.categoria}</div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                        {c.fonte && <FonteBadge name={c.fonte} />}
                        {c.proposta && <PropostaBadge name={c.proposta} />}
                      </div>
                      <div className="deal-footer">
                        <span style={{ fontSize: 11, color: lastAppt ? (lastAppt < today ? 'var(--text3)' : 'var(--text2)') : 'var(--text3)' }}>
                          {lastAppt ? '📅 ' + fmtDate(lastAppt, { day: '2-digit', month: 'short' }) : 'Nessun app.'}
                        </span>
                        {fu && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: fuUrgent ? '#A32D2D' : '#185FA5' }}>
                            🔔 {fmtDate(fu.followup, { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
