import React, { useEffect, useRef } from 'react';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { fmtEur, fmtDate, FONTI } from '../data';
import { FonteBadge } from './Badges';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Dashboard({ contacts, deals, stages, today, setPage }) {
  const pipeRef = useRef(null);
  const valRef  = useRef(null);
  const pipeChart = useRef(null);
  const valChart  = useRef(null);

  const activeStages = stages.filter(s => !s.isKo);
  const cnt = {}, val = {};
  stages.forEach(s => { cnt[s.name] = 0; val[s.name] = 0; });
  deals.forEach(d => { cnt[d.fase] = (cnt[d.fase] || 0) + 1; val[d.fase] = (val[d.fase] || 0) + d.valore; });

  const wonStage = activeStages[activeStages.length - 1];
  const closedVal = wonStage ? (val[wonStage.name] || 0) : 0;
  const totalVal  = deals.reduce((s, d) => s + (d.valore || 0), 0);
  const openDeals = deals.filter(d => !stages.find(s => s.name === d.fase && (s.isKo || s === wonStage))).length;

  const urgentFU = contacts.reduce((n, c) =>
    n + (c.history || []).filter(h => h.type === 'note' && h.followup && h.followup <= today).length, 0);

  const daRifissare = contacts.reduce((n, c) =>
    n + (c.history || []).filter(h => h.type === 'appt' && (h.stato === 'Da rifissare' || h.stato === 'Non effettuato')).length, 0);

  useEffect(() => {
    if (!pipeRef.current || !valRef.current) return;
    if (pipeChart.current) pipeChart.current.destroy();
    if (valChart.current)  valChart.current.destroy();

    pipeChart.current = new Chart(pipeRef.current, {
      type: 'bar',
      data: {
        labels: activeStages.map(s => s.name),
        datasets: [{ label: 'Trattative', data: activeStages.map(s => cnt[s.name] || 0), backgroundColor: activeStages.map(s => s.color + '99'), borderColor: activeStages.map(s => s.color), borderWidth: 1.5, borderRadius: 5 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }
    });

    valChart.current = new Chart(valRef.current, {
      type: 'doughnut',
      data: {
        labels: activeStages.map(s => s.name),
        datasets: [{ data: activeStages.map(s => val[s.name] || 0), backgroundColor: activeStages.map(s => s.color), borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }
    });

    return () => { pipeChart.current?.destroy(); valChart.current?.destroy(); };
  }, [deals, stages]);

  // Follow-ups urgenti
  const urgentList = [];
  contacts.forEach(c => (c.history || []).forEach(h => {
    if (h.type === 'note' && h.followup && h.followup <= today) {
      urgentList.push({ contact: c, note: h, status: h.followup < today ? 'scaduto' : 'oggi' });
    }
  }));
  urgentList.sort((a, b) => a.note.followup.localeCompare(b.note.followup));

  // Fonte breakdown
  const fonteCnt = {};
  FONTI.forEach(f => fonteCnt[f.name] = 0);
  contacts.forEach(c => { if (c.fonte) fonteCnt[c.fonte] = (fonteCnt[c.fonte] || 0) + 1; });

  return (
    <>
      <div className="topbar">
        <span className="page-title">Dashboard</span>
        <span className="text-muted fs-12">{new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
      <div className="content">
        {/* Metrics */}
        <div className="metric-grid">
          <div className="metric-card"><div className="metric-label">Trattative aperte</div><div className="metric-value">{openDeals}</div><div className="metric-sub">in pipeline</div></div>
          <div className="metric-card"><div className="metric-label">Valore pipeline</div><div className="metric-value">{fmtEur(totalVal - closedVal)}</div><div className="metric-sub">potenziale</div></div>
          <div className="metric-card"><div className="metric-label">Chiuso OK</div><div className="metric-value metric-green">{fmtEur(closedVal)}</div><div className="metric-sub">realizzato</div></div>
          <div className="metric-card"><div className="metric-label">Follow-up urgenti</div><div className={`metric-value${urgentFU ? ' metric-alert' : ''}`}>{urgentFU}</div><div className="metric-sub">oggi o scaduti</div></div>
        </div>

        {/* Alert appuntamenti */}
        {daRifissare > 0 && (
          <div style={{ background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ color: '#633806', fontWeight: 600 }}>🔄 {daRifissare} appuntamenti da gestire (Da rifissare / Non effettuati)</span>
            <button className="btn btn-sm" style={{ color: '#E07B1A', borderColor: '#E07B1A' }} onClick={() => setPage('appointments')}>Vedi →</button>
          </div>
        )}

        {/* Charts */}
        <div className="charts-grid">
          <div className="card card-0"><div className="card-title">Trattative per fase</div><div style={{ position: 'relative', height: 210 }}><canvas ref={pipeRef} /></div></div>
          <div className="card card-0"><div className="card-title">Valore pipeline (€)</div><div style={{ position: 'relative', height: 210 }}><canvas ref={valRef} /></div></div>
        </div>
        <div style={{ height: 16 }} />

        {/* Follow-up urgenti */}
        <div className="card">
          <div className="card-title">Follow-up urgenti</div>
          {urgentList.length === 0 ? <div className="empty" style={{ padding: '16px 0' }}>Nessun follow-up urgente</div> :
            urgentList.slice(0, 6).map((f, i) => (
              <div key={i} className={`fu-alert ${f.status}`}>
                <div style={{ flex: 1 }}>
                  <div className="fw-600">{f.contact.nome} <span className="badge" style={{ fontSize: 10, background: f.status === 'scaduto' ? '#FCEBEB' : '#FAEEDA', color: f.status === 'scaduto' ? '#791F1F' : '#633806' }}>{f.status === 'scaduto' ? 'Scaduto' : 'Oggi'}</span></div>
                  <div className="text-muted fs-12">{f.contact.azienda} — {(f.note.text || '').slice(0, 60)}{f.note.text?.length > 60 ? '...' : ''}</div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Fonte charts */}
        <div className="charts-grid">
          <div className="card card-0">
            <div className="card-title">Contatti per fonte</div>
            {FONTI.filter(f => fonteCnt[f.name] > 0).map(f => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FonteBadge name={f.name} />
                <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(4, fonteCnt[f.name] / Math.max(1, contacts.length) * 100)}%`, background: f.color, height: '100%', borderRadius: 4 }} />
                </div>
                <span className="fs-12 text-muted" style={{ minWidth: 20, textAlign: 'right' }}>{fonteCnt[f.name]}</span>
              </div>
            ))}
            {FONTI.every(f => !fonteCnt[f.name]) && <div className="empty" style={{ padding: '12px 0' }}>Nessun dato</div>}
          </div>
          <div className="card card-0">
            <div className="card-title">Ultimi contatti</div>
            {contacts.slice(-5).reverse().map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <div><div className="fw-600 fs-12">{c.nome}</div><div className="text-muted" style={{ fontSize: 11 }}>{c.categoria}</div></div>
                <FonteBadge name={c.fonte} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
