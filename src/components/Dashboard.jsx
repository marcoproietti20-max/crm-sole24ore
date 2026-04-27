import React, { useEffect, useRef } from 'react';
import { Chart, ArcElement, BarElement, BarController, DoughnutController, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { fmtEur, fmtDate, FONTI, getImportoFatturato, getImportoPreventivato, getDataChiusura } from '../data';
import { FonteBadge, StageBadge } from './Badges';

Chart.register(ArcElement, BarElement, BarController, DoughnutController, CategoryScale, LinearScale, Tooltip, Legend);

const MESI_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

export default function Dashboard({ contacts, stages, today, navigateTo }) {
  const barRef = useRef(null);
  const doughRef = useRef(null);
  const pieRef  = useRef(null);
  const barChart  = useRef(null);
  const doughChart = useRef(null);
  const pieChart  = useRef(null);

  const activeStages = stages.filter(s => !s.isKo);
  const wonStage = activeStages[activeStages.length - 1];
  const koStages = stages.filter(s => s.isKo);

  // Metrics
  const openContacts = contacts.filter(c => !stages.find(s => s.name === c.fase && s.isKo) && c.fase !== wonStage?.name);
  const chiusiOK = contacts.filter(c => c.fase === wonStage?.name);
  const chiusiKO = contacts.filter(c => koStages.some(s => s.name === c.fase));

  const totalPreventivato = openContacts.reduce((s,c) => s + getImportoPreventivato(c), 0);
  const totalFatturato = chiusiOK.reduce((s,c) => s + getImportoFatturato(c), 0);

  // Current month fatturato
  const curMonth = new Date().toISOString().slice(0,7);
  const fatturatoCurMese = chiusiOK.filter(c => {
    return getDataChiusura(c).startsWith(curMonth);
  }).reduce((s,c) => s + getImportoFatturato(c) + getImportoPreventivato(c), 0);

  // YTD fatturato
  const curYear = new Date().getFullYear().toString();
  const fatturatoAnno = chiusiOK.filter(c => {
    return getDataChiusura(c).startsWith(curYear);
  }).reduce((s,c) => s + getImportoFatturato(c) + getImportoPreventivato(c), 0);

  // Urgent follow-ups
  const urgentFU = contacts.reduce((n,c) =>
    n+(c.history||[]).filter(h=>h.type==='note'&&h.followup&&h.followup<=today).length, 0);
  const daRifissare = contacts.reduce((n,c) =>
    n+(c.history||[]).filter(h=>h.type==='appt'&&(h.stato==='Da rifissare'||h.stato==='Non si è presentato'||h.stato==='Non effettuato')).length, 0);

  // Monthly fatturato for bar chart (last 12 months)
  const monthlyFatturato = Array(12).fill(0);
  chiusiOK.forEach(c => {
    const d = c.contratto?.dataInizio;
    if (!d) return;
    const mIdx = new Date(d).getMonth();
    const yr = new Date(d).getFullYear().toString();
    if (yr === curYear) monthlyFatturato[mIdx] += getImportoFatturato(c);
  });

  // Stage breakdown
  const stageCnt = {};
  activeStages.forEach(s => stageCnt[s.name] = 0);
  contacts.forEach(c => { if (stageCnt[c.fase] !== undefined) stageCnt[c.fase]++; });

  // Prodotti aggregation for pie chart
  const prodCat = {};
  contacts.forEach(ct => {
    (ct.contratto?.prodotti||[]).forEach(p => {
      if (!p.categoria) return;
      prodCat[p.categoria] = (prodCat[p.categoria]||0) + (Number(p.importo)||0);
    });
    // fallback: if chiuso OK with importo but no contratto prodotti
    if (ct.fase===wonStage?.name && !ct.contratto?.prodotti?.length && getImportoPreventivato(ct)>0) {
      prodCat['Non categorizzato'] = (prodCat['Non categorizzato']||0) + getImportoPreventivato(ct);
    }
  });
  const prodCatLabels = Object.keys(prodCat).filter(k=>prodCat[k]>0);
  const prodCatColors = ['#378ADD','#EF9F27','#7F77DD','#E07B1A','#639922','#c8102e','#0A66C2','#A32D2D','#3B6D11','#888','#F7C1C1'];

  // Fonte breakdown
  const fonteCnt = {};
  FONTI.forEach(f => fonteCnt[f.name] = 0);
  contacts.forEach(c => { if (c.fonte) fonteCnt[c.fonte] = (fonteCnt[c.fonte]||0)+1; });

  useEffect(() => {
    if (!barRef.current || !doughRef.current) return;
    if (barChart.current) barChart.current.destroy();
    if (doughChart.current) doughChart.current.destroy();

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#c8102e';

    barChart.current = new Chart(barRef.current, {
      type:'bar',
      data:{labels:MESI_SHORT,datasets:[{label:'Fatturato €',data:monthlyFatturato,backgroundColor:accent+'99',borderColor:accent,borderWidth:1.5,borderRadius:5}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+fmtEur(ctx.parsed.y)}}},scales:{y:{ticks:{callback:v=>fmtEur(v)},grid:{color:'rgba(0,0,0,0.05)'}},x:{grid:{display:false}}}}
    });
    doughChart.current = new Chart(doughRef.current, {
      type:'doughnut',
      data:{labels:activeStages.map(s=>s.name),datasets:[{data:activeStages.map(s=>stageCnt[s.name]||0),backgroundColor:activeStages.map(s=>s.color),borderWidth:0}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:11}}}}}
    });
    if (pieRef.current && prodCatLabels.length > 0) {
      if (pieChart.current) pieChart.current.destroy();
      pieChart.current = new Chart(pieRef.current, {
        type: 'doughnut',
        data: {
          labels: prodCatLabels,
          datasets: [{ data: prodCatLabels.map(k=>prodCat[k]), backgroundColor: prodCatColors.slice(0,prodCatLabels.length), borderWidth: 0 }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins: { legend: { position:'right', labels:{ boxWidth:10, font:{size:11}, padding:8 } }, tooltip: { callbacks: { label: ctx => ' '+fmtEur(ctx.parsed) } } } }
      });
    }
    return () => { barChart.current?.destroy(); doughChart.current?.destroy(); pieChart.current?.destroy(); };
  }, [contacts, stages, prodCatLabels.length]);

  // Urgent list
  const urgentList = [];
  contacts.forEach(c => (c.history||[]).forEach(h => {
    if (h.type==='note'&&h.followup&&h.followup<=today)
      urgentList.push({contact:c,note:h,status:h.followup<today?'scaduto':'oggi'});
  }));
  urgentList.sort((a,b)=>a.note.followup.localeCompare(b.note.followup));

  const MetricCard = ({label,value,sub,color,onClick,alert}) => (
    <div className="metric-card" onClick={onClick} style={{cursor:onClick?'pointer':'default',transition:'transform 0.1s'}}
      onMouseEnter={e=>{if(onClick)e.currentTarget.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>e.currentTarget.style.transform=''}>
      <div className="metric-label">{label}</div>
      <div className={`metric-value${alert?' metric-alert':''}`} style={color?{color}:{}}>{value}</div>
      {sub&&<div className="metric-sub">{sub}</div>}
      {onClick&&<div style={{fontSize:10,color:'var(--text3)',marginTop:4}}>Clicca per dettaglio →</div>}
    </div>
  );

  return (
    <>
      <div className="topbar">
        <span className="page-title">Dashboard</span>
        <span className="text-muted fs-12">{new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span>
      </div>
      <div className="content">

        {/* Alert bar */}
        {(urgentFU>0||daRifissare>0) && (
          <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
            {urgentFU>0&&<div style={{flex:1,background:'#FCEBEB',border:'1px solid #F7C1C1',borderRadius:'var(--radius)',padding:'9px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>navigateTo('followups')}>
              <span style={{color:'#791F1F',fontWeight:600,fontSize:13}}>🔔 {urgentFU} follow-up urgenti</span>
              <span style={{fontSize:11,color:'#791F1F'}}>Vedi →</span>
            </div>}
            {daRifissare>0&&<div style={{flex:1,background:'#FAEEDA',border:'1px solid #FAC775',borderRadius:'var(--radius)',padding:'9px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}} onClick={()=>navigateTo('appointments')}>
              <span style={{color:'#633806',fontWeight:600,fontSize:13}}>🔄 {daRifissare} appuntamenti da gestire</span>
              <span style={{fontSize:11,color:'#633806'}}>Vedi →</span>
            </div>}
          </div>
        )}

        {/* Metrics row 1 */}
        <div className="metric-grid" style={{marginBottom:12}}>
          <MetricCard label="Trattative aperte" value={openContacts.length} sub="in pipeline" onClick={()=>navigateTo('pipeline')}/>
          <MetricCard label="Totale preventivato" value={fmtEur(totalPreventivato)} sub="trattative attive" onClick={()=>navigateTo('contacts',{preventivato:true})}/>
          <MetricCard label="Fatturato mese" value={fmtEur(fatturatoCurMese)} sub={new Date().toLocaleDateString('it-IT',{month:'long',year:'numeric'})} color="#3B6D11" onClick={()=>navigateTo('chiuso')}/>
          <MetricCard label="Fatturato anno" value={fmtEur(fatturatoAnno)} sub={curYear} color="#3B6D11" onClick={()=>navigateTo('chiuso')}/>
        </div>

        {/* Metrics row 2 */}
        <div className="metric-grid" style={{marginBottom:20}}>
          <MetricCard label="Chiuso OK" value={chiusiOK.length} sub={fmtEur(totalFatturato)+' fatturati'} color="#3B6D11" onClick={()=>navigateTo('chiuso')}/>
          <MetricCard label="Chiuso KO" value={chiusiKO.length} sub="trattative perse" onClick={()=>navigateTo('archivio')}/>
          <MetricCard label="Follow-up urgenti" value={urgentFU} sub="oggi o scaduti" alert={urgentFU>0} onClick={()=>navigateTo('followups')}/>
          <MetricCard label="Contatti totali" value={contacts.length} sub="in rubrica" onClick={()=>navigateTo('contacts')}/>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="card card-0">
            <div className="card-title">Fatturato mensile {curYear} (€)</div>
            <div style={{position:'relative',height:210}}><canvas ref={barRef}/></div>
          </div>
          <div className="card card-0">
            <div className="card-title">Pipeline per fase</div>
            <div style={{position:'relative',height:210}}><canvas ref={doughRef}/></div>
          </div>
        </div>
        <div style={{height:16}}/>

        {/* Stage breakdown clickable */}
        <div className="card">
          <div className="card-title">Trattative per fase</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8}}>
            {activeStages.map(s=>(
              <div key={s.id} onClick={()=>navigateTo('contacts',{fase:s.name})}
                style={{background:s.color+'11',border:`1px solid ${s.color}44`,borderRadius:'var(--radius)',padding:'10px 12px',cursor:'pointer',transition:'transform 0.1s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e=>e.currentTarget.style.transform=''}>
                <div style={{fontSize:11,color:s.color,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{s.name}</div>
                <div style={{fontSize:22,fontWeight:700,color:s.color}}>{stageCnt[s.name]||0}</div>
                <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>Clicca per vedere →</div>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up urgenti */}
        <div className="card">
          <div className="card-title" style={{display:'flex',justifyContent:'space-between'}}>
            Follow-up urgenti
            {urgentList.length>0&&<button className="btn btn-sm" onClick={()=>navigateTo('followups')}>Vedi tutti →</button>}
          </div>
          {urgentList.length===0?<div className="empty" style={{padding:'14px 0'}}>Nessun follow-up urgente</div>:
            urgentList.slice(0,5).map((f,i)=>(
              <div key={i} className={`fu-alert ${f.status}`} style={{cursor:'pointer'}} onClick={()=>navigateTo('contacts',{id:f.contact.id})}>
                <div style={{flex:1}}>
                  <div className="fw-600">{f.contact.nome} <span className="badge" style={{fontSize:10,background:f.status==='scaduto'?'#FCEBEB':'#FAEEDA',color:f.status==='scaduto'?'#791F1F':'#633806'}}>{f.status==='scaduto'?'Scaduto':'Oggi'}</span></div>
                  <div className="text-muted fs-12">{f.contact.azienda} — {(f.note.text||'').slice(0,60)}</div>
                </div>
                <span style={{fontSize:11,color:'var(--text3)'}}>{fmtDate(f.note.followup,{day:'2-digit',month:'short',year:'numeric'})}</span>
              </div>
            ))
          }
        </div>

        {/* Prodotti per categoria */}
        {prodCatLabels.length > 0 && (
          <div className="card">
            <div className="card-title">Fatturato per categoria prodotto</div>
            <div style={{position:'relative',height:220}}><canvas ref={pieRef}/></div>
          </div>
        )}

        {/* Fonte breakdown */}
        <div className="card card-0">
          <div className="card-title">Contatti per fonte</div>
          {FONTI.filter(f=>fonteCnt[f.name]>0).map(f=>(
            <div key={f.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:9,cursor:'pointer'}} onClick={()=>navigateTo('contacts',{fonte:f.name})}>
              <FonteBadge name={f.name}/>
              <div style={{flex:1,background:'var(--bg3)',borderRadius:4,height:8,overflow:'hidden'}}>
                <div style={{width:`${Math.max(4,fonteCnt[f.name]/Math.max(1,contacts.length)*100)}%`,background:f.color,height:'100%',borderRadius:4}}/>
              </div>
              <span className="fs-12 text-muted" style={{minWidth:24,textAlign:'right'}}>{fonteCnt[f.name]}</span>
            </div>
          ))}
          {FONTI.every(f=>!fonteCnt[f.name])&&<div className="empty" style={{padding:'12px 0'}}>Nessun dato</div>}
        </div>

      </div>
    </>
  );
}
