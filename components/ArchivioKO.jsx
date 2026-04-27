import React, { useState } from 'react';
import { fmtDate, fmtEur, getImportoPreventivato } from '../data';
import { FonteBadge, EsitoBadge, StageBadge } from './Badges';

export default function ArchivioKO({ contacts, stages, setContacts, showToast, setModal }) {
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState('nome');
  const [sortDir, setSortDir] = useState('asc');

  const koStages = stages.filter(s => s.isKo);
  const koContacts = contacts.filter(c => koStages.some(s => s.name === c.fase));
  const filtered = koContacts.filter(c =>
    !q || (c.nome + (c.azienda||'')).toLowerCase().includes(q.toLowerCase())
  );

  const sorted = [...filtered].sort((a,b) => {
    let va,vb;
    if(sortKey==='nome'){va=a.nome||'';vb=b.nome||'';}
    else if(sortKey==='azienda'){va=a.azienda||'';vb=b.azienda||'';}
    else if(sortKey==='categoria'){va=a.categoria||'';vb=b.categoria||'';}
    else if(sortKey==='fonte'){va=a.fonte||'';vb=b.fonte||'';}
    else if(sortKey==='ultimoApp'){
      const ga=c=>(c.history||[]).filter(h=>h.type==='appt'&&h.date).sort((a,b)=>b.date.localeCompare(a.date))[0]?.date||'';
      va=ga(a);vb=ga(b);
    }
    else{va='';vb='';}
    const cmp=va.localeCompare(vb,'it',{numeric:true});
    return sortDir==='asc'?cmp:-cmp;
  });

  const handleSort=k=>{if(sortKey===k)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortKey(k);setSortDir('asc');}};
  const Th=({k,label,w})=><th style={{cursor:'pointer',userSelect:'none',width:w}} onClick={()=>handleSort(k)}>{label}{sortKey===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>;

  const prevStage=stages.filter(s=>!s.isKo).slice(-2)[0]?.name||stages.filter(s=>!s.isKo)[0]?.name;
  const reopen=id=>{
    setContacts(prev=>prev.map(c=>c.id===id?{...c,fase:prevStage}:c));
    showToast('Trattativa riaperta',`Spostata in "${prevStage}"`);
  };

  // Last appt helper
  const getLastAppt=c=>{
    const a=(c.history||[]).filter(h=>h.type==='appt'&&h.date).sort((a,b)=>b.date.localeCompare(a.date));
    return a[0]?a[0].date:'';
  };

  return(
    <>
      <div className="topbar">
        <span className="page-title">Archivio Chiuso KO</span>
        <span className="text-muted fs-12">{koContacts.length} trattative perse</span>
      </div>
      <div className="content">
        <div style={{background:'#FCEBEB',border:'1px solid #F7C1C1',borderRadius:'var(--radius)',padding:'10px 14px',marginBottom:16,fontSize:12,color:'#791F1F'}}>
          Trattative perse. Non compaiono nella pipeline attiva né nel grafico "Chiuso per mese".
        </div>
        <div className="search-bar">
          <input className="form-control" style={{maxWidth:300}} placeholder="Cerca..." value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <div className="table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <Th k="nome" label="Cliente" w={140}/>
                <Th k="azienda" label="Azienda" w={140}/>
                <Th k="categoria" label="Categoria" w={130}/>
                <Th k="fonte" label="Fonte" w={140}/>
                <Th k="ultimoApp" label="Ultimo App." w={110}/>
                <th style={{width:200}}>Ultima nota</th>
                <th style={{width:80}}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length===0?<tr><td colSpan={7} className="empty">Nessuna trattativa persa</td></tr>:
                sorted.map(c=>{
                  const lastAppt=getLastAppt(c);
                  const lastNote=(c.history||[]).filter(h=>h.type==='note'&&h.text).slice(-1)[0];
                  return(
                    <tr key={c.id} onClick={()=>setModal({type:'contact',data:c})} style={{cursor:'pointer'}}>
                      <td className="fw-600">{c.nome}</td>
                      <td className="text-muted">{c.azienda||'—'}</td>
                      <td className="fs-12 text-muted">{c.categoria||'—'}</td>
                      <td><FonteBadge name={c.fonte}/></td>
                      <td className="text-muted fs-12">{lastAppt?fmtDate(lastAppt.split('T')[0],{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
                      <td className="text-muted fs-12" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lastNote?.text||'—'}</td>
                      <td onClick={e=>e.stopPropagation()}><button className="btn btn-sm" onClick={()=>reopen(c.id)}>Riapri</button></td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
