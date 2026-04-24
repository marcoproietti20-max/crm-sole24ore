import React, { useState, useEffect, useRef } from 'react';
import { Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { fmtDate, fmtEur } from '../data';

Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip);

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

export default function ChiusoPerMese({ deals, stages }) {
  const currentYear = new Date().getFullYear().toString();
  const wonStage = stages.filter(s => !s.isKo).slice(-1)[0];
  const closed = deals.filter(d => wonStage && d.fase === wonStage.name && d.dataChiusura);
  const allYears = [...new Set(closed.map(d => d.dataChiusura.slice(0, 4)))].sort().reverse();
  if (!allYears.includes(currentYear)) allYears.unshift(currentYear);

  const [year, setYear] = useState(currentYear);
  const [openMonths, setOpenMonths] = useState({});
  const chartRef = useRef(null);
  const chartInst = useRef(null);

  const yearDeals = closed.filter(d => d.dataChiusura.startsWith(year));
  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i, label: MESI[i], deals: [], value: 0, count: 0 }));
  yearDeals.forEach(d => { const m = parseInt(d.dataChiusura.slice(5, 7)) - 1; monthly[m].deals.push(d); monthly[m].value += d.valore || 0; monthly[m].count++; });

  const totalVal = yearDeals.reduce((s, d) => s + (d.valore || 0), 0);
  const activeMths = monthly.filter(m => m.count > 0);
  const bestMonth = monthly.reduce((best, m) => m.value > best.value ? m : best, monthly[0]);
  const avgMonth = activeMths.length ? Math.round(totalVal / activeMths.length) : 0;

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInst.current) chartInst.current.destroy();
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c8102e';
    chartInst.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: MESI.map(m => m.slice(0, 3)),
        datasets: [{ label: '€', data: monthly.map(m => m.value), backgroundColor: monthly.map(m => m.count ? accent + '99' : '#e0e0e066'), borderColor: monthly.map(m => m.count ? accent : '#ccc'), borderWidth: 1.5, borderRadius: 5 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + fmtEur(ctx.parsed.y) } } }, scales: { y: { ticks: { callback: v => fmtEur(v) }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } } }
    });
    return () => chartInst.current?.destroy();
  }, [year, deals, stages]);

  const toggleMonth = id => setOpenMonths(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      <div className="topbar">
        <span className="page-title">Chiuso per mese</span>
        <div className="topbar-right">
          <label className="fs-12 text-muted">Anno:</label>
          <select className="form-control" style={{ width: 90 }} value={year} onChange={e => setYear(e.target.value)}>
            {allYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="content">
        <div className="metric-grid">
          <div className="metric-card"><div className="metric-label">Totale {year}</div><div className="metric-value metric-green">{fmtEur(totalVal)}</div><div className="metric-sub">{yearDeals.length} trattative</div></div>
          <div className="metric-card"><div className="metric-label">Media mensile</div><div className="metric-value">{fmtEur(avgMonth)}</div><div className="metric-sub">mesi attivi</div></div>
          <div className="metric-card"><div className="metric-label">Mese migliore</div><div className="metric-value" style={{ fontSize: 18 }}>{bestMonth.count ? bestMonth.label : '—'}</div><div className="metric-sub">{bestMonth.count ? fmtEur(bestMonth.value) : ''}</div></div>
          <div className="metric-card"><div className="metric-label">Trattative</div><div className="metric-value">{yearDeals.length}</div><div className="metric-sub">nell'anno</div></div>
        </div>
        <div className="card"><div className="card-title">Valore chiuso per mese (€)</div><div style={{ position: 'relative', height: 240 }}><canvas ref={chartRef} /></div></div>
        {activeMths.slice().reverse().map(m => (
          <div key={m.month} className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: 'var(--bg3)', cursor: 'pointer' }} onClick={() => toggleMonth(m.month)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{m.label} {year}</span>
                <span className="text-muted fs-12">{m.count} trattativ{m.count === 1 ? 'a' : 'e'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#3B6D11' }}>{fmtEur(m.value)}</span>
                <span style={{ fontSize: 16, color: 'var(--text2)', transform: openMonths[m.month] ? 'rotate(180deg)' : '', transition: 'transform .2s' }}>▼</span>
              </div>
            </div>
            {openMonths[m.month] && (
              <table className="crm-table">
                <thead><tr><th>Cliente</th><th>Azienda</th><th>Data chiusura</th><th style={{ textAlign: 'right' }}>Valore</th><th>Note</th></tr></thead>
                <tbody>
                  {m.deals.map(d => (
                    <tr key={d.id}>
                      <td className="fw-600">{d.nome}</td>
                      <td className="text-muted">{d.azienda || '—'}</td>
                      <td className="text-muted">{fmtDate(d.dataChiusura, { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#3B6D11' }}>{fmtEur(d.valore)}</td>
                      <td className="text-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.note || '—'}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg3)' }}>
                    <td colSpan={3} style={{ fontWeight: 700, fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Totale {m.label}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#3B6D11' }}>{fmtEur(m.value)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        ))}
        {activeMths.length === 0 && <div className="empty">Nessuna trattativa chiusa in {year}</div>}
      </div>
    </>
  );
}
