import React, { useState, useEffect, useRef } from 'react';
import { Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { fmtDate, fmtEur, getImportoFatturato, getImportoPreventivato, getDataChiusura } from '../data';

Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip);

const MESI=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

export default function ChiusoPerMese({ contacts, stages }) {
  const curYear=new Date().getFullYear().toString();
  const wonStage=stages.filter(s=>!s.isKo).slice(-1)[0];
  const closed=contacts.filter(c=>wonStage&&c.fase===wonStage.name&&getDataChiusura(c));
  const allYears=[...new Set(closed.map(c=>getDataChiusura(c).slice(0,4)))].sort().reverse();
  if(!allYears.includes(curYear)) allYears.unshift(curYear);

  const [year,setYear]=useState(curYear);
  const [openMonths,setOpenMonths]=useState({});
  const [sortKey,setSortKey]=useState('data');
  const [sortDir,setSortDir]=useState('desc');
  const chartRef=useRef(null);
  const chartInst=useRef(null);

  const yearClosed=closed.filter(c=>getDataChiusura(c).startsWith(year));
  const monthly=Array.from({length:12},(_,i)=>({month:i,label:MESI[i],contacts:[],value:0,count:0}));
  // Use importoProposta as fallback when no contratto
  const getValore = c => getImportoFatturato(c) || getImportoPreventivato(c);
  yearClosed.forEach(c=>{
    const m=parseInt(getDataChiusura(c).slice(5,7))-1;
    monthly[m].contacts.push(c);
    monthly[m].value+=getValore(c);
    monthly[m].count++;
  });

  const totalVal=yearClosed.reduce((s,c)=>s+getValore(c),0);
  const activeMths=monthly.filter(m=>m.count>0);
  const bestMonth=monthly.reduce((best,m)=>m.value>best.value?m:best,monthly[0]);
  const avgMonth=activeMths.length?Math.round(totalVal/activeMths.length):0;

  const sortContacts=(list)=>[...list].sort((a,b)=>{
    let va,vb;
    if(sortKey==='nome'){va=a.nome||'';vb=b.nome||'';}
    else if(sortKey==='valore'){va=getImportoFatturato(a);vb=getImportoFatturato(b);return sortDir==='asc'?va-vb:vb-va;}
    else if(sortKey==='data'){va=a.contratto?.dataInizio||'';vb=b.contratto?.dataInizio||'';}
    else if(sortKey==='durata'){va=a.contratto?.durataM||0;vb=b.contratto?.durataM||0;return sortDir==='asc'?va-vb:vb-va;}
    else{va='';vb='';}
    const cmp=va.localeCompare(vb,'it',{numeric:true});
    return sortDir==='asc'?cmp:-cmp;
  });

  const handleSort=(k)=>{if(sortKey===k)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortKey(k);setSortDir('asc');}};
  const Th=({k,label})=><th style={{cursor:'pointer',userSelect:'none'}} onClick={()=>handleSort(k)}>{label}{sortKey===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>;

  useEffect(()=>{
    if(!chartRef.current) return;
    if(chartInst.current) chartInst.current.destroy();
    const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#c8102e';
    chartInst.current=new Chart(chartRef.current,{
      type:'bar',
      data:{labels:MESI.map(m=>m.slice(0,3)),datasets:[{label:'€',data:monthly.map(m=>m.value),backgroundColor:monthly.map(m=>m.count?accent+'99':'#e0e0e055'),borderColor:monthly.map(m=>m.count?accent:'#ccc'),borderWidth:1.5,borderRadius:5}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+fmtEur(ctx.parsed.y)}}},scales:{y:{ticks:{callback:v=>fmtEur(v)},grid:{color:'rgba(0,0,0,0.05)'}},x:{grid:{display:false}}}}
    });
    return()=>chartInst.current?.destroy();
  },[year,contacts,stages]);

  const toggleMonth=id=>setOpenMonths(prev=>({...prev,[id]:!prev[id]}));

  return(
    <>
      <div className="topbar">
        <span className="page-title">Chiuso per mese</span>
        <div className="topbar-right">
          <label className="fs-12 text-muted">Anno:</label>
          <select className="form-control" style={{width:90}} value={year} onChange={e=>setYear(e.target.value)}>
            {allYears.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="content">
        <div className="metric-grid">
          <div className="metric-card"><div className="metric-label">Totale {year}</div><div className="metric-value metric-green">{fmtEur(totalVal)}</div><div className="metric-sub">{yearClosed.length} contratti</div></div>
          <div className="metric-card"><div className="metric-label">Media mensile</div><div className="metric-value">{fmtEur(avgMonth)}</div><div className="metric-sub">mesi attivi</div></div>
          <div className="metric-card"><div className="metric-label">Mese migliore</div><div className="metric-value" style={{fontSize:18}}>{bestMonth.count?bestMonth.label:'—'}</div><div className="metric-sub">{bestMonth.count?fmtEur(bestMonth.value):''}</div></div>
          <div className="metric-card"><div className="metric-label">Contratti</div><div className="metric-value">{yearClosed.length}</div><div className="metric-sub">nell'anno</div></div>
        </div>
        <div className="card"><div className="card-title">Fatturato per mese (€)</div><div style={{position:'relative',height:240}}><canvas ref={chartRef}/></div></div>
        {activeMths.slice().reverse().map(m=>(
          <div key={m.month} className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 16px',background:'var(--bg3)',cursor:'pointer'}} onClick={()=>toggleMonth(m.month)}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:14,fontWeight:700}}>{m.label} {year}</span>
                <span className="text-muted fs-12">{m.count} contratt{m.count===1?'o':'i'}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:16}}>
                <span style={{fontSize:15,fontWeight:700,color:'#3B6D11'}}>{fmtEur(m.value)}</span>
                <span style={{fontSize:16,color:'var(--text2)',transform:openMonths[m.month]?'rotate(180deg)':'',transition:'transform .2s'}}>▼</span>
              </div>
            </div>
            {openMonths[m.month]&&(
              <table className="crm-table">
                <thead>
                  <tr>
                    <Th k="nome" label="Cliente"/>
                    <th>Azienda</th>
                    <Th k="data" label="Data inizio"/>
                    <Th k="durata" label="Durata"/>
                    <th>Prodotti</th>
                    <Th k="valore" label="Valore"/>
                  </tr>
                </thead>
                <tbody>
                  {sortContacts(m.contacts).map(c=>(
                    <tr key={c.id}>
                      <td className="fw-600">{c.nome}</td>
                      <td className="text-muted">{c.azienda||'—'}</td>
                      <td className="text-muted">{fmtDate(getDataChiusura(c),{day:'2-digit',month:'long',year:'numeric'})}</td>
                      <td className="text-muted">{c.contratto?.durataM?`${c.contratto.durataM} mesi`:'—'}</td>
                      <td className="text-muted fs-12">{(c.contratto?.prodotti||[]).map(p=>p.nome).join(', ')||'—'}</td>
                      <td style={{fontWeight:700,color:'#3B6D11'}}>{fmtEur(getValore(c))}</td>
                    </tr>
                  ))}
                  <tr style={{background:'var(--bg3)'}}>
                    <td colSpan={5} style={{fontWeight:700,fontSize:11,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.04em'}}>Totale {m.label}</td>
                    <td style={{fontWeight:700,color:'#3B6D11'}}>{fmtEur(m.value)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        ))}
        {activeMths.length===0&&<div className="empty">Nessun contratto chiuso in {year}</div>}
      </div>
    </>
  );
}
