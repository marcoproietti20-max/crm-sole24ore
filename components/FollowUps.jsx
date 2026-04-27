import React, { useState } from 'react';
import { fmtDate } from '../data';
import emailjs from '@emailjs/browser';

export default function FollowUps({ contacts, setModal, showToast, ejsCfg, updateContact }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedIds, setSelectedIds] = useState(new Set()); // Set of {contactId, noteId} keys
  const [postponeDays, setPostponeDays] = useState(7);

  const all = [];
  contacts.forEach(c => (c.history||[]).forEach(h => {
    if (h.type==='note'&&h.followup) {
      const status=h.followup<today?'scaduto':h.followup===today?'oggi':'futuro';
      all.push({contact:c,note:h,status,key:`${c.id}__${h.id}`});
    }
  }));
  all.sort((a,b)=>a.note.followup.localeCompare(b.note.followup));

  const groups={scaduto:[],oggi:[],futuro:[]};
  all.forEach(f=>groups[f.status].push(f));

  const toggleOne=(key)=>setSelectedIds(prev=>{const n=new Set(prev);n.has(key)?n.delete(key):n.add(key);return n;});
  const toggleAll=(checked)=>setSelectedIds(checked?new Set(all.map(f=>f.key)):new Set());
  const allChecked=all.length>0&&all.every(f=>selectedIds.has(f.key));

  const bulkDelete=()=>{
    if(!selectedIds.size) return;
    if(!window.confirm(`Eliminare ${selectedIds.size} follow-up?`)) return;
    selectedIds.forEach(key=>{
      const [cid,hid]=key.split('__');
      updateContact(cid,c=>({...c,history:(c.history||[]).map(h=>h.id===hid?{...h,followup:''}:h)}));
    });
    setSelectedIds(new Set());
    showToast('Follow-up eliminati','');
  };

  const bulkPostpone=()=>{
    if(!selectedIds.size) return;
    selectedIds.forEach(key=>{
      const [cid,hid]=key.split('__');
      updateContact(cid,c=>({...c,history:(c.history||[]).map(h=>{
        if(h.id!==hid) return h;
        const d=new Date(h.followup);
        d.setDate(d.getDate()+Number(postponeDays));
        return{...h,followup:d.toISOString().split('T')[0]};
      })}));
    });
    setSelectedIds(new Set());
    showToast(`${selectedIds.size} follow-up posticipati`,`di ${postponeDays} giorni`);
  };

  const sendEmail=async(f)=>{
    if(!ejsCfg?.serviceId||!ejsCfg?.pubKey){showToast('EmailJS non configurato','Vai in Impostazioni','warn');return;}
    try{
      await emailjs.send(ejsCfg.serviceId,ejsCfg.templateId,{
        to_email:ejsCfg.email,contact_name:f.contact.nome,
        company:f.contact.azienda||'—',note:f.note.text,
        followup_date:fmtDate(f.note.followup,{weekday:'long',day:'2-digit',month:'long',year:'numeric'}),
      },ejsCfg.pubKey);
      showToast('Email inviata',`Promemoria per ${f.contact.nome}`);
    }catch(e){showToast('Errore invio','Controlla le credenziali EmailJS','error');}
  };

  const FuCard=({f,showYear=true})=>(
    <div className={`fu-alert ${f.status}`} style={{alignItems:'flex-start'}}>
      <div style={{flexShrink:0,paddingTop:2}} onClick={e=>e.stopPropagation()}>
        <input type="checkbox" checked={selectedIds.has(f.key)} onChange={()=>toggleOne(f.key)}/>
      </div>
      <div style={{flex:1,minWidth:0,marginLeft:8}}>
        <div className="fw-600">{f.contact.nome}
          <span className="badge" style={{marginLeft:6,fontSize:10,background:f.status==='scaduto'?'#FCEBEB':f.status==='oggi'?'#FAEEDA':'#EAF3DE',color:f.status==='scaduto'?'#791F1F':f.status==='oggi'?'#633806':'#27500A'}}>
            {f.status==='scaduto'?'Scaduto':f.status==='oggi'?'Oggi':'Futuro'}
          </span>
        </div>
        <div className="text-muted fs-12">{f.contact.azienda} — {(f.note.text||'').slice(0,80)}</div>
        <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{fmtDate(f.note.followup,{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div>
      </div>
      <div style={{display:'flex',gap:6,flexShrink:0}}>
        <button className="btn btn-sm" onClick={()=>sendEmail(f)}>📧</button>
        <button className="btn btn-sm" onClick={()=>setModal({type:'followup',data:{contactId:f.contact.id,note:f.note}})}>✏️</button>
      </div>
    </div>
  );

  return(
    <>
      <div className="topbar">
        <span className="page-title">Follow-up</span>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn btn-sm btn-primary" onClick={()=>all.filter(f=>f.status!=='futuro').forEach(f=>sendEmail(f))}>📧 Invia tutti</button>
        </div>
      </div>
      <div className="content">
        {all.length===0&&<div className="empty">Nessun follow-up programmato</div>}

        {/* Bulk bar */}
        {all.length>0&&(
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'8px 12px',background:'var(--bg3)',borderRadius:'var(--radius)',flexWrap:'wrap'}}>
            <input type="checkbox" checked={allChecked} onChange={e=>toggleAll(e.target.checked)}/>
            <span className="fs-12 text-muted">{selectedIds.size>0?`${selectedIds.size} selezionati`:'Seleziona tutti'}</span>
            {selectedIds.size>0&&(
              <>
                <div className="bulk-sep"/>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span className="fs-12 text-muted">Posticipa di</span>
                  <input className="form-control" type="number" value={postponeDays} onChange={e=>setPostponeDays(e.target.value)} style={{width:60,padding:'4px 8px',fontSize:12}}/>
                  <span className="fs-12 text-muted">giorni</span>
                  <button className="btn btn-sm" onClick={bulkPostpone}>Applica</button>
                </div>
                <div className="bulk-sep"/>
                <button className="btn btn-sm btn-danger" onClick={bulkDelete}>🗑 Elimina selezionati</button>
              </>
            )}
          </div>
        )}

        {groups.scaduto.length>0&&<><div className="group-head" style={{color:'#791F1F'}}>Scaduti ({groups.scaduto.length})</div>{groups.scaduto.map(f=><FuCard key={f.key} f={f}/>)}</>}
        {groups.oggi.length>0&&<><div className="group-head" style={{color:'#633806'}}>Oggi ({groups.oggi.length})</div>{groups.oggi.map(f=><FuCard key={f.key} f={f}/>)}</>}
        {groups.futuro.length>0&&<><div className="group-head">Prossimi ({groups.futuro.length})</div>{groups.futuro.map(f=><FuCard key={f.key} f={f}/>)}</>}
      </div>
    </>
  );
}
