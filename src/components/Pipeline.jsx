import React, { useState } from 'react';
import { fmtDate, getImportoPreventivato, getNextFu, getLastAppt } from '../data';
import { FonteBadge, PropostaBadge } from './Badges';

export default function Pipeline({ contacts, stages, setModal }) {
  const activeStages = stages.filter(s => !s.isKo);
  const [sortKey, setSortKey] = useState('nome');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const today = new Date().toISOString().split('T')[0];

  const sortContacts = (list) => {
    return [...list].sort((a, b) => {
      let va, vb;
      if (sortKey==='nome'){va=a.nome||'';vb=b.nome||'';}
      else if (sortKey==='ultimoApp'){va=getLastAppt(a);vb=getLastAppt(b);}
      else if (sortKey==='followup'){va=getNextFu(a);vb=getNextFu(b);}
      else if (sortKey==='importo'){va=getImportoPreventivato(a);vb=getImportoPreventivato(b);return sortDir==='asc'?va-vb:vb-va;}
      else{va='';vb='';}
      const cmp=va.localeCompare(vb,'it',{numeric:true});
      return sortDir==='asc'?cmp:-cmp;
    });
  };

  const toggleOne=(id)=>setSelectedIds(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
  const cols=activeStages.length;

  return (
    <>
      <div className="topbar">
        <span className="page-title">Pipeline</span>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span className="text-muted fs-12">Ordina per:</span>
          {[['nome','Nome'],['ultimoApp','App.'],['followup','Follow-up'],['importo','Importo']].map(([k,l])=>(
            <button key={k} className={`btn btn-sm${sortKey===k?' btn-primary':''}`}
              onClick={()=>{if(sortKey===k)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortKey(k);setSortDir('asc');}}}>
              {l}{sortKey===k?(sortDir==='asc'?' ↑':' ↓'):''}
            </button>
          ))}
        </div>
      </div>
      <div className="content">
        {/* Bulk bar */}
        {selectedIds.size>0&&(
          <div className="bulk-bar" style={{marginBottom:12}}>
            <span style={{fontSize:13,fontWeight:600,color:'#0C447C'}}>{selectedIds.size} selezionati</span>
            <div className="bulk-sep"/>
            <select className="form-control" style={{width:140,fontSize:12,padding:'4px 8px'}}
              onChange={e=>{if(!e.target.value)return;/* bulk change fase */ e.target.value='';}}>
              <option value="">Cambia fase...</option>
              {stages.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <button className="btn btn-sm btn-ghost" style={{marginLeft:'auto'}} onClick={()=>setSelectedIds(new Set())}>× Deseleziona</button>
          </div>
        )}

        {/* Stage headers */}
        <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:12,marginBottom:6}}>
          {activeStages.map(s=>{
            const cnt=contacts.filter(c=>c.fase===s.name).length;
            const val=contacts.filter(c=>c.fase===s.name).reduce((sum,c)=>sum+getImportoPreventivato(c),0);
            return(
              <div key={s.id} style={{fontSize:11,fontWeight:700,textAlign:'center',paddingBottom:6,borderBottom:`3px solid ${s.color}`,color:s.color,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                {s.name} ({cnt}){val>0&&<div style={{fontWeight:400,fontSize:10,marginTop:2}}>€{val.toLocaleString('it-IT')}</div>}
              </div>
            );
          })}
        </div>

        {/* Kanban */}
        <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:12,alignItems:'start'}}>
          {activeStages.map(s=>{
            const stageContacts=sortContacts(contacts.filter(c=>c.fase===s.name));
            return(
              <div key={s.id} className="kanban-col">
                <div className="kanban-header"><span>{s.name}</span><span className="kanban-count">{stageContacts.length}</span></div>
                {stageContacts.length===0&&<div style={{fontSize:12,color:'var(--text3)',textAlign:'center',padding:'16px 0'}}>Nessun contatto</div>}
                {stageContacts.map(c=>{
                  const lastAppt=getLastAppt(c);
                  const fu=getNextFu(c);
                  const fuUrgent=fu&&fu<=today;
                  const importo=getImportoPreventivato(c);
                  const isChecked=selectedIds.has(c.id);
                  return(
                    <div key={c.id} className="deal-card" style={{border:isChecked?`2px solid var(--accent)`:'1px solid var(--border)',position:'relative'}}>
                      <div style={{position:'absolute',top:8,right:8}} onClick={e=>{e.stopPropagation();toggleOne(c.id);}}>
                        <input type="checkbox" checked={isChecked} onChange={()=>{}} style={{cursor:'pointer'}}/>
                      </div>
                      <div onClick={()=>setModal({type:'contact',data:c})}>
                        <div className="deal-name" style={{paddingRight:20}}>{c.nome}</div>
                        <div className="deal-company">{c.azienda||'—'}</div>
                        {c.categoria&&<div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>{c.categoria}</div>}
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:6}}>
                          {c.fonte&&<FonteBadge name={c.fonte}/>}
                          {c.proposta&&<PropostaBadge name={c.proposta}/>}
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:4}}>
                          {importo>0&&<span style={{fontSize:11,fontWeight:700,color:'#185FA5'}}>€{importo.toLocaleString('it-IT')}</span>}
                          {lastAppt&&<span style={{fontSize:11,color:'var(--text3)'}}>📅 {fmtDate(lastAppt,{day:'2-digit',month:'short',year:'numeric'})}</span>}
                        </div>
                        {fu&&<div style={{marginTop:4,fontSize:11,fontWeight:600,color:fuUrgent?'#A32D2D':'#185FA5'}}>🔔 {fmtDate(fu,{day:'2-digit',month:'short',year:'numeric'})}</div>}
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
