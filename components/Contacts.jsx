import React, { useState, useMemo, useEffect } from 'react';
import { fmtDate, fmtDateTime, genId, FONTI, CATEGORIE, ESITI, PROPOSTE, getImportoPreventivato, getImportoFatturato } from '../data';
import { StageBadge, FonteBadge, EsitoBadge, PropostaBadge, StatoBadge } from './Badges';

export default function Contacts({ contacts, stages, customFields, setModal, updateContact,
  deleteContact, deleteContacts, setContacts, showToast, today, pageFilter, setPageFilter, navigateTo }) {

  const [q, setQ] = useState('');
  const [filterFase, setFilterFase] = useState('');
  const [filterFonte, setFilterFonte] = useState('');
  const [filterProposta, setFilterProposta] = useState('');
  const [filterEsito, setFilterEsito] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedCid, setSelectedCid] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [noteFu, setNoteFu] = useState('');
  const [noteFase, setNoteFase] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  // Apply pageFilter from dashboard navigation
  useEffect(() => {
    if (!pageFilter) return;
    if (pageFilter.fase) setFilterFase(pageFilter.fase === 'aperto' ? '' : pageFilter.fase);
    if (pageFilter.fonte) setFilterFonte(pageFilter.fonte);
    if (pageFilter.id) setSelectedCid(pageFilter.id);
    setPageFilter(null);
  }, [pageFilter]);

  const handleSort = (key) => {
    if (sortKey===key) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const getLastAppt = c => {
    const a=(c.history||[]).filter(h=>h.type==='appt'&&h.date).sort((a,b)=>b.date.localeCompare(a.date));
    return a[0]?a[0].date.split('T')[0]:'';
  };
  const getNextFu = c => {
    const f=(c.history||[]).filter(h=>h.type==='note'&&h.followup).sort((a,b)=>a.followup.localeCompare(b.followup));
    return f[0]?f[0].followup:'';
  };

  const filtered = useMemo(() => {
    let list = contacts.filter(c => {
      if (q&&!(c.nome+c.azienda+(c.email||'')).toLowerCase().includes(q.toLowerCase())) return false;
      if (filterFase&&c.fase!==filterFase) return false;
      if (filterFonte&&c.fonte!==filterFonte) return false;
      if (filterProposta&&c.proposta!==filterProposta) return false;
      if (filterEsito&&c.esito!==filterEsito) return false;
      return true;
    });
    if (sortKey) {
      list=[...list].sort((a,b)=>{
        let va,vb;
        if (sortKey==='nome'){va=a.nome||'';vb=b.nome||'';}
        else if (sortKey==='azienda'){va=a.azienda||'';vb=b.azienda||'';}
        else if (sortKey==='fase'){va=a.fase||'';vb=b.fase||'';}
        else if (sortKey==='categoria'){va=a.categoria||'';vb=b.categoria||'';}
        else if (sortKey==='fonte'){va=a.fonte||'';vb=b.fonte||'';}
        else if (sortKey==='esito'){va=a.esito||'';vb=b.esito||'';}
        else if (sortKey==='proposta'){va=a.proposta||'';vb=b.proposta||'';}
        else if (sortKey==='importo'){va=String(getImportoPreventivato(a));vb=String(getImportoPreventivato(b));}
        else if (sortKey==='ultimoApp'){va=getLastAppt(a);vb=getLastAppt(b);}
        else if (sortKey==='followup'){va=getNextFu(a);vb=getNextFu(b);}
        else{va='';vb='';}
        const cmp=va.localeCompare(vb,'it',{numeric:true});
        return sortDir==='asc'?cmp:-cmp;
      });
    }
    return list;
  },[contacts,q,filterFase,filterFonte,filterProposta,filterEsito,sortKey,sortDir]);

  const allChecked=filtered.length>0&&filtered.every(c=>selectedIds.has(c.id));
  const toggleOne=(id,checked)=>setSelectedIds(prev=>{const n=new Set(prev);checked?n.add(id):n.delete(id);return n;});
  const toggleAll=checked=>setSelectedIds(prev=>{const n=new Set(prev);filtered.forEach(c=>checked?n.add(c.id):n.delete(c.id));return n;});

  const selectedContact=contacts.find(c=>c.id===selectedCid);

  const addNote=()=>{
    if(!noteText.trim()) return;
    updateContact(selectedCid,c=>({
      ...c,
      history:[...(c.history||[]),{id:genId(),type:'note',date:today,text:noteText,followup:noteFu}],
      ...(noteFase?{fase:noteFase}:{}),
    }));
    setNoteText('');setNoteFu('');setNoteFase('');
    showToast('Nota aggiunta','');
  };

  const Th=({k,label,w})=>(
    <th style={{width:w,cursor:k?'pointer':'default',userSelect:'none',whiteSpace:'nowrap'}}
      onClick={()=>k&&handleSort(k)}>
      {label}{sortKey===k?(sortDir==='asc'?' ↑':' ↓'):''}
    </th>
  );

  return (
    <>
      <div className="topbar">
        <span className="page-title">Contatti <span className="text-muted fs-12">({contacts.length})</span></span>
        <button className="btn btn-primary" onClick={()=>setModal({type:'contact',data:null})}>+ Nuovo contatto</button>
      </div>
      <div className="content">
        {/* Search bar */}
        <div className="search-bar">
          <input className="form-control" style={{flex:1,maxWidth:260}} placeholder="Cerca nome, azienda, email..." value={q} onChange={e=>setQ(e.target.value)}/>
          <select className="form-control" style={{width:140}} value={filterFase} onChange={e=>setFilterFase(e.target.value)}>
            <option value="">Tutte le fasi</option>
            {stages.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <select className="form-control" style={{width:140}} value={filterFonte} onChange={e=>setFilterFonte(e.target.value)}>
            <option value="">Tutte le fonti</option>
            {FONTI.map(f=><option key={f.name} value={f.name}>{f.icon} {f.name}</option>)}
          </select>
          <select className="form-control" style={{width:140}} value={filterProposta} onChange={e=>setFilterProposta(e.target.value)}>
            <option value="">Tutte le proposte</option>
            {PROPOSTE.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <select className="form-control" style={{width:120}} value={filterEsito} onChange={e=>setFilterEsito(e.target.value)}>
            <option value="">Tutti gli esiti</option>
            {ESITI.map(e=><option key={e.name} value={e.name}>{e.name}</option>)}
          </select>
        </div>

        {/* Bulk bar */}
        {selectedIds.size>0&&(
          <div className="bulk-bar">
            <span style={{fontSize:13,fontWeight:600,color:'#0C447C'}}>{selectedIds.size} selezionati</span>
            <div className="bulk-sep"/>
            <select className="form-control" style={{width:140,fontSize:12,padding:'4px 8px'}} onChange={e=>{if(!e.target.value)return;setContacts(p=>p.map(c=>selectedIds.has(c.id)?{...c,fase:e.target.value}:c));showToast(`${selectedIds.size} aggiornati`,e.target.value);e.target.value='';}}>
              <option value="">Cambia fase...</option>
              {stages.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select className="form-control" style={{width:155,fontSize:12,padding:'4px 8px'}} onChange={e=>{if(!e.target.value)return;setContacts(p=>p.map(c=>selectedIds.has(c.id)?{...c,fonte:e.target.value}:c));showToast(`${selectedIds.size} aggiornati`,e.target.value);e.target.value='';}}>
              <option value="">Cambia fonte...</option>
              {FONTI.map(f=><option key={f.name} value={f.name}>{f.icon} {f.name}</option>)}
            </select>
            <div className="bulk-sep"/>
            <button className="btn btn-sm btn-danger" onClick={()=>{if(window.confirm(`Eliminare ${selectedIds.size} contatti?`)){deleteContacts(selectedIds);setSelectedIds(new Set());}}}>🗑 Elimina</button>
            <button className="btn btn-sm btn-ghost" style={{marginLeft:'auto'}} onClick={()=>setSelectedIds(new Set())}>× Deseleziona</button>
          </div>
        )}

        {/* Table */}
        <div className="table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th style={{width:32,textAlign:'center'}}><input type="checkbox" checked={allChecked} onChange={e=>toggleAll(e.target.checked)}/></th>
                <Th k="nome" label="Nome" w={140}/>
                <Th k="azienda" label="Azienda" w={130}/>
                <Th k={null} label="Telefono" w={110}/>
                <Th k={null} label="Email" w={150}/>
                <Th k="fase" label="Fase" w={100}/>
                <Th k="categoria" label="Categoria" w={120}/>
                <Th k="ultimoApp" label="Ultimo App." w={105}/>
                <Th k="proposta" label="Proposta" w={110}/>
                <Th k="importo" label="Importo €" w={90}/>
                <Th k="followup" label="Follow-up" w={100}/>
                <Th k="fonte" label="Fonte" w={130}/>
                <Th k="esito" label="Esito" w={90}/>
                {customFields.slice(0,2).map(f=><th key={f.id}>{f.name}</th>)}
                <th style={{width:90}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?<tr><td colSpan={15} className="empty">Nessun contatto trovato</td></tr>:
                filtered.map(c=>{
                  const hist=c.history||[];
                  const appts=hist.filter(h=>h.type==='appt'&&h.date).sort((a,b)=>b.date.localeCompare(a.date));
                  const lastDs=appts[0]?appts[0].date.split('T')[0]:'';
                  const fus=hist.filter(h=>h.type==='note'&&h.followup).sort((a,b)=>a.followup.localeCompare(b.followup));
                  const fu=fus[0];
                  const isChecked=selectedIds.has(c.id);
                  const importo=getImportoPreventivato(c);
                  return(
                    <tr key={c.id} style={{background:isChecked?'rgba(200,16,46,0.04)':''}} onClick={()=>setSelectedCid(selectedCid===c.id?null:c.id)}>
                      <td style={{textAlign:'center'}} onClick={e=>{e.stopPropagation();toggleOne(c.id,!isChecked);}}><input type="checkbox" checked={isChecked} onChange={()=>{}}/></td>
                      <td><span className="fw-600">{c.nome}</span></td>
                      <td>{c.azienda||'—'}</td>
                      <td>{c.telefono||'—'}</td>
                      <td style={{maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.email||'—'}</td>
                      <td><StageBadge name={c.fase} stages={stages}/></td>
                      <td className="fs-12 text-muted">{c.categoria||'—'}</td>
                      <td className="fs-12">{lastDs?<span style={{color:lastDs<today?'#A32D2D':'#185FA5',fontWeight:500}}>{fmtDate(lastDs,{day:'2-digit',month:'short',year:'numeric'})}</span>:<span className="text-muted">—</span>}</td>
                      <td><PropostaBadge name={c.proposta}/></td>
                      <td className="fs-12">{importo>0?<span style={{fontWeight:600,color:'#185FA5'}}>€{importo.toLocaleString('it-IT')}</span>:<span className="text-muted">—</span>}</td>
                      <td className="fs-11">{fu?<span style={{color:fu.followup<today?'#A32D2D':fu.followup===today?'#E07B1A':'#185FA5',fontWeight:500}}>{fmtDate(fu.followup,{day:'2-digit',month:'short',year:'numeric'})}</span>:<span className="text-muted">—</span>}</td>
                      <td><FonteBadge name={c.fonte}/></td>
                      <td><EsitoBadge name={c.esito}/></td>
                      {customFields.slice(0,2).map(f=><td key={f.id} className="fs-12">{(c.customData||{})[f.id]||'—'}</td>)}
                      <td style={{whiteSpace:'nowrap'}} onClick={e=>e.stopPropagation()}>
                        <button className="btn btn-sm btn-primary" onClick={()=>setModal({type:'contact',data:c})}>Modifica</button>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedContact&&<ContactDetail c={selectedContact} stages={stages} customFields={customFields}
          today={today} setModal={setModal} updateContact={updateContact} showToast={showToast}
          noteText={noteText} setNoteText={setNoteText} noteFu={noteFu} setNoteFu={setNoteFu}
          noteFase={noteFase} setNoteFase={setNoteFase} addNote={addNote}/>}
      </div>
    </>
  );
}

function ContactDetail({c,stages,customFields,today,setModal,updateContact,showToast,
  noteText,setNoteText,noteFu,setNoteFu,noteFase,setNoteFase,addNote}){
  const hist=(c.history||[]).slice().reverse();
  const importo=getImportoPreventivato(c);


  return(
    <div className="detail-panel">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
        <div>
          <div style={{fontSize:18,fontWeight:700}}>{c.nome}</div>
          <div className="text-muted" style={{fontSize:13,marginTop:2}}>{c.azienda}</div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <StageBadge name={c.fase} stages={stages}/>
          <FonteBadge name={c.fonte}/>
          <EsitoBadge name={c.esito}/>
          <button className="btn btn-sm" onClick={()=>setModal({type:'contact',data:c})}>Modifica</button>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-item"><label>Telefono</label><span>{c.telefono||'—'}</span></div>
        <div className="info-item"><label>Email</label><span>{c.email||'—'}</span></div>
        <div className="info-item"><label>Categoria</label><span>{c.categoria||'—'}</span></div>
        <div className="info-item"><label>Proposta</label><span><PropostaBadge name={c.proposta}/></span></div>
        <div className="info-item"><label>Importo proposta</label><span style={{fontWeight:600,color:'#185FA5'}}>{importo>0?'€'+importo.toLocaleString('it-IT'):'—'}</span></div>
        <div className="info-item"><label>Attività totali</label><span>{(c.history||[]).length}</span></div>
      </div>

      {/* Contratto (solo Chiuso OK) */}
      {c.fase&&stages.find(s=>s.name===c.fase&&!s.isKo&&stages.filter(x=>!x.isKo).slice(-1)[0]?.name===s.name)&&(
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div className="form-label" style={{margin:0}}>Contratto</div>
            <button className="btn btn-sm btn-primary" onClick={()=>setModal({type:'contratto',data:{contact:c}})}>
              {c.contratto?'Modifica contratto':'+ Aggiungi contratto'}
            </button>
          </div>
          {c.contratto?(
            <div style={{background:'#EAF3DE',border:'1px solid #C0DD97',borderRadius:'var(--radius)',padding:'12px 14px'}}>
              <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:13}}>
                <span><strong>Totale:</strong> <span style={{color:'#3B6D11',fontWeight:700}}>€{c.contratto.totale?.toLocaleString('it-IT')}</span></span>
                <span><strong>Durata:</strong> {c.contratto.durataM} mesi</span>
                <span><strong>Inizio:</strong> {fmtDate(c.contratto.dataInizio)}</span>
                <span><strong>Fine:</strong> {fmtDate(c.contratto.dataFine)}</span>
              </div>
              {c.contratto.prodotti?.length>0&&(
                <div style={{marginTop:8,fontSize:12}}>
                  {c.contratto.prodotti.map(p=>(
                    <span key={p.id} style={{display:'inline-block',background:'white',border:'1px solid #C0DD97',borderRadius:4,padding:'2px 8px',marginRight:6,marginTop:4}}>
                      {p.nome}: €{Number(p.importo).toLocaleString('it-IT')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ):(
            <div style={{fontSize:12,color:'var(--text3)'}}>Nessun contratto registrato</div>
          )}
        </div>
      )}

      {customFields.length>0&&(
        <div className="info-grid" style={{marginBottom:14}}>
          {customFields.map(f=><div key={f.id} className="info-item"><label>{f.name}</label><span>{(c.customData||{})[f.id]||'—'}</span></div>)}
        </div>
      )}

      <div className="section-divider">
        <div className="section-head">
          Storico attività ({(c.history||[]).length})
          <button className="btn btn-sm btn-primary" onClick={()=>setModal({type:'appt',data:{contactId:c.id,appt:null}})}>+ Appuntamento</button>
        </div>
        {hist.map(h=>{
          if(h.type==='appt'){
            const sc={'Svolto':'#639922','Da rifissare':'#E07B1A','Non effettuato':'#A32D2D','Non si è presentato':'#A32D2D','Programmato':'#378ADD'};
            return(
              <div key={h.id} className="history-item appt" style={{borderLeftColor:sc[h.stato]||'#378ADD'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                  <span className="history-tag tag-appt">Appuntamento</span>
                  <StatoBadge name={h.stato}/>
                </div>
                <div className="history-date">{fmtDateTime(h.date)}</div>
                <div className="history-text">{h.esito||<em style={{color:'var(--text3)'}}>Nessun esito registrato</em>}</div>
                <button className="btn btn-sm" style={{marginTop:6}} onClick={()=>setModal({type:'appt',data:{contactId:c.id,appt:h}})}>Aggiorna</button>
              </div>
            );
          }
          const fuStatus=h.followup?(h.followup<today?'scaduto':h.followup===today?'oggi':'futuro'):'';
          const fuColor={scaduto:'#A32D2D',oggi:'#E07B1A',futuro:'#185FA5'}[fuStatus]||'';
          return(
            <div key={h.id} className="history-item note">
              <span className="history-tag tag-note">Nota</span>
              <div className="history-date">{fmtDate(h.date,{day:'2-digit',month:'long',year:'numeric'})}</div>
              <div className="history-text">{h.text}</div>
              {h.followup&&(
                <>
                  <div style={{fontSize:11,color:fuColor,fontWeight:500,marginTop:4}}>
                    Follow-up: {fmtDate(h.followup,{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
                    {fuStatus==='scaduto'?' — SCADUTO':fuStatus==='oggi'?' — OGGI':''}
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                    <button className="btn btn-sm" onClick={()=>setModal({type:'followup',data:{contactId:c.id,note:h}})}>✏️ Modifica</button>
                    <button className="btn btn-sm btn-danger" onClick={()=>{updateContact(c.id,ct=>({...ct,history:(ct.history||[]).map(x=>x.id===h.id?{...x,followup:''}:x)}));}}>× Elimina</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {hist.length===0&&<div className="empty" style={{padding:'14px 0'}}>Nessuna attività registrata</div>}

        <div style={{marginTop:12,background:'var(--bg3)',borderRadius:'var(--radius)',padding:14}}>
          <div className="form-label" style={{marginBottom:8}}>Aggiungi nota</div>
          <div className="form-group" style={{marginBottom:8}}><textarea className="form-control" style={{minHeight:60}} placeholder="Nota..." value={noteText} onChange={e=>setNoteText(e.target.value)}/></div>
          <div className="form-row" style={{marginBottom:8}}>
            <div className="form-group" style={{margin:0}}><label className="form-label">Follow-up</label><input className="form-control" type="date" value={noteFu} onChange={e=>setNoteFu(e.target.value)}/></div>
            <div className="form-group" style={{margin:0}}><label className="form-label">Aggiorna fase</label>
              <select className="form-control" value={noteFase} onChange={e=>setNoteFase(e.target.value)}>
                <option value="">— nessun cambiamento —</option>
                {stages.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={addNote}>Salva nota</button>
        </div>
      </div>
    </div>
  );
}
