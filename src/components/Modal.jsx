import React, { useState } from 'react';
import { FONTI, CATEGORIE, ESITI, PROPOSTE, STATI_APPT, PRODOTTI, genId, fmtDate } from '../data';

export default function Modal({ modal, setModal, contacts, stages, customFields,
  saveContact, deleteContact, updateContact, showToast }) {
  const close = () => setModal(null);

  if (modal.type === 'contact') return (
    <ContactModal contact={modal.data} stages={stages} customFields={customFields}
      onSave={d=>{saveContact(d);close();}}
      onDelete={id=>{if(window.confirm('Eliminare?')){deleteContact(id);close();}}}
      onClose={close}/>
  );
  if (modal.type === 'appt') return (
    <ApptModal contactId={modal.data.contactId} appt={modal.data.appt} stages={stages}
      onSave={(cid,appt,fase)=>{
        updateContact(cid,c=>{
          const hist=c.history?[...c.history]:[];
          const idx=hist.findIndex(h=>h.id===appt.id);
          if(idx>=0)hist[idx]=appt;else hist.push(appt);
          return{...c,history:hist,...(fase?{fase}:{})};
        });
        showToast('Appuntamento salvato','');close();
      }}
      onDelete={(cid,hid)=>{
        updateContact(cid,c=>({...c,history:(c.history||[]).filter(h=>h.id!==hid)}));
        close();
      }}
      onClose={close}/>
  );
  if (modal.type === 'followup') return (
    <FollowupModal contactId={modal.data.contactId} note={modal.data.note}
      onSave={(cid,note)=>{
        updateContact(cid,c=>{
          const hist=c.history?[...c.history]:[];
          const idx=hist.findIndex(h=>h.id===note.id);
          if(idx>=0)hist[idx]=note;else hist.push(note);
          return{...c,history:hist};
        });
        showToast('Follow-up aggiornato','');close();
      }}
      onDelete={(cid,nid)=>{
        updateContact(cid,c=>({...c,history:(c.history||[]).map(h=>h.id===nid?{...h,followup:''}:h)}));
        showToast('Follow-up eliminato','');close();
      }}
      onClose={close}/>
  );
  if (modal.type === 'contratto') return (
    <ContrattoModal contact={modal.data.contact}
      onSave={(cid,contratto)=>{
        updateContact(cid,c=>({...c,contratto}));
        showToast('Contratto salvato','');close();
      }}
      onClose={close}/>
  );
  return null;
}

// ---- Contact Form ----
function ContactModal({contact,stages,customFields,onSave,onDelete,onClose}){
  const c=contact||{};
  const [form,setForm]=useState({
    id:c.id||'',nome:c.nome||'',azienda:c.azienda||'',
    email:c.email||'',telefono:c.telefono||'',
    fase:c.fase||stages[0]?.name||'',
    fonte:c.fonte||'',categoria:c.categoria||'',
    esito:c.esito||'',proposta:c.proposta||'',
    importoProposta:c.importoProposta||0,
    dataChiusura:c.dataChiusura||'',
    customData:c.customData||{},history:c.history||[],
    contratto:c.contratto||null,
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{c.id?'Modifica contatto':'Nuovo contatto'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nome e Cognome *</label><input className="form-control" value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="Mario Rossi"/></div>
            <div className="form-group"><label className="form-label">Azienda</label><input className="form-control" value={form.azienda} onChange={e=>set('azienda',e.target.value)} placeholder="Acme Srl"/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Telefono</label><input className="form-control" value={form.telefono} onChange={e=>set('telefono',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Fase</label>
              <select className="form-control" value={form.fase} onChange={e=>set('fase',e.target.value)}>
                {stages.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Categoria</label>
              <select className="form-control" value={form.categoria} onChange={e=>set('categoria',e.target.value)}>
                <option value="">— seleziona —</option>
                {CATEGORIE.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Fonte</label>
              <select className="form-control" value={form.fonte} onChange={e=>set('fonte',e.target.value)}>
                <option value="">— seleziona —</option>
                {FONTI.map(f=><option key={f.name} value={f.name}>{f.icon} {f.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Esito</label>
              <select className="form-control" value={form.esito} onChange={e=>set('esito',e.target.value)}>
                <option value="">— seleziona —</option>
                {ESITI.map(e=><option key={e.name} value={e.name}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Proposta</label>
              <select className="form-control" value={form.proposta} onChange={e=>set('proposta',e.target.value)}>
                <option value="">— seleziona —</option>
                {PROPOSTE.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Importo proposta (€)</label>
              <input className="form-control" type="number" value={form.importoProposta} onChange={e=>set('importoProposta',e.target.value)} placeholder="0"/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Data chiusura</label>
              <input className="form-control" type="date" value={form.dataChiusura||''} onChange={e=>set('dataChiusura',e.target.value)}/>
              <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>Usata per "Chiuso per mese" e fatturato in dashboard</div>
            </div>
            <div className="form-group"/>
          </div>
          {customFields.length>0&&(
            <div style={{borderTop:'1px solid var(--border)',paddingTop:14,marginTop:4}}>
              <div className="form-label" style={{marginBottom:10}}>Campi aggiuntivi</div>
              {customFields.map(f=>(
                <div className="form-group" key={f.id}>
                  <label className="form-label">{f.name}</label>
                  {f.type==='textarea'?<textarea className="form-control" value={form.customData[f.id]||''} onChange={e=>set('customData',{...form.customData,[f.id]:e.target.value})}/>
                  :f.type==='select'&&f.options?<select className="form-control" value={form.customData[f.id]||''} onChange={e=>set('customData',{...form.customData,[f.id]:e.target.value})}><option value="">—</option>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select>
                  :<input className="form-control" type={f.type||'text'} value={form.customData[f.id]||''} onChange={e=>set('customData',{...form.customData,[f.id]:e.target.value})}/>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {c.id&&<button className="btn btn-danger" style={{marginRight:'auto'}} onClick={()=>onDelete(c.id)}>Elimina</button>}
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={()=>{if(!form.nome.trim())return alert('Nome obbligatorio');onSave(form);}}>Salva</button>
        </div>
      </div>
    </div>
  );
}

// ---- Appt Form ----
function ApptModal({contactId,appt,stages,onSave,onDelete,onClose}){
  const a=appt||{};
  const [form,setForm]=useState({id:a.id||genId(),date:a.date||'',stato:a.stato||'Programmato',esito:a.esito||''});
  const [fase,setFase]=useState('');
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-header"><span className="modal-title">{a.id?'Aggiorna appuntamento':'Registra appuntamento'}</span><button className="modal-close" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Data e ora</label><input className="form-control" type="datetime-local" value={form.date} onChange={e=>set('date',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Stato</label>
              <select className="form-control" value={form.stato} onChange={e=>set('stato',e.target.value)}>
                {STATI_APPT.map(s=><option key={s.name} value={s.name}>{s.icon} {s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Note / Esito</label><textarea className="form-control" value={form.esito} onChange={e=>set('esito',e.target.value)} placeholder="Come è andato?"/></div>
          <div className="form-group"><label className="form-label">Aggiorna fase pipeline</label>
            <select className="form-control" value={fase} onChange={e=>setFase(e.target.value)}>
              <option value="">— nessun cambiamento —</option>
              {stages.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          {a.id&&<button className="btn btn-danger" style={{marginRight:'auto'}} onClick={()=>onDelete(contactId,a.id)}>Elimina</button>}
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={()=>onSave(contactId,{...form,type:'appt'},fase)}>Salva</button>
        </div>
      </div>
    </div>
  );
}

// ---- Follow-up Form ----
function FollowupModal({contactId,note,onSave,onDelete,onClose}){
  const n=note||{};
  const [form,setForm]=useState({id:n.id||genId(),type:'note',date:n.date||new Date().toISOString().split('T')[0],text:n.text||'',followup:n.followup||''});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-header"><span className="modal-title">Modifica follow-up</span><button className="modal-close" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Data follow-up</label><input className="form-control" type="date" value={form.followup} onChange={e=>set('followup',e.target.value)}/></div>
          <div className="form-group"><label className="form-label">Nota</label><textarea className="form-control" value={form.text} onChange={e=>set('text',e.target.value)}/></div>
        </div>
        <div className="modal-footer">
          {n.id&&<button className="btn btn-danger" style={{marginRight:'auto'}} onClick={()=>onDelete(contactId,n.id)}>Elimina follow-up</button>}
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={()=>onSave(contactId,form)}>Salva</button>
        </div>
      </div>
    </div>
  );
}

// ---- Contratto Form ----
function ContrattoModal({contact,onSave,onClose}){
  const ct=contact.contratto||{};
  const [prodotti,setProdotti]=useState(ct.prodotti||[]);
  const [dataInizio,setDataInizio]=useState(ct.dataInizio||'');
  const [durataM,setDurataM]=useState(ct.durataM||12);

  const addProdotto=()=>setProdotti(p=>[...p,{id:genId(),categoria:'',nome:'',importo:0}]);
  const updateProdotto=(id,k,v)=>setProdotti(p=>p.map(x=>x.id===id?{...x,[k]:v}:x));
  const removeProdotto=id=>setProdotti(p=>p.filter(x=>x.id!==id));
  const totale=prodotti.reduce((s,p)=>s+(Number(p.importo)||0),0);
  const dataFine=dataInizio&&durataM?(()=>{
    const d=new Date(dataInizio);d.setMonth(d.getMonth()+Number(durataM));
    return d.toISOString().split('T')[0];
  })():'';

  const save=()=>{
    onSave(contact.id,{prodotti,dataInizio,durataM:Number(durataM),dataFine,totale});
  };
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div className="modal-header"><span className="modal-title">Contratto — {contact.nome}</span><button className="modal-close" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="form-row" style={{marginBottom:16}}>
            <div className="form-group" style={{margin:0}}><label className="form-label">Data inizio</label><input className="form-control" type="date" value={dataInizio} onChange={e=>setDataInizio(e.target.value)}/></div>
            <div className="form-group" style={{margin:0}}><label className="form-label">Durata (mesi)</label><input className="form-control" type="number" value={durataM} onChange={e=>setDurataM(e.target.value)} min="1"/></div>
          </div>
          {dataFine&&<div style={{fontSize:12,color:'var(--text2)',marginBottom:14}}>Data fine contratto: <strong>{fmtDate(dataFine)}</strong></div>}
          <div className="form-label" style={{marginBottom:8}}>Prodotti</div>
          {prodotti.length===0&&<div style={{fontSize:12,color:'var(--text3)',marginBottom:8}}>Nessun prodotto. Clicca "+ Aggiungi prodotto".</div>}
          {prodotti.map((p,i)=>(
            <div key={p.id} style={{background:'var(--bg3)',borderRadius:'var(--radius)',padding:'10px 12px',marginBottom:8}}>
              <div style={{display:'flex',gap:8,marginBottom:6,alignItems:'center'}}>
                <span style={{fontSize:11,fontWeight:600,color:'var(--text2)',minWidth:20}}>#{i+1}</span>
                <select className="form-control" style={{flex:2}} value={p.categoria||''} onChange={e=>updateProdotto(p.id,'categoria',e.target.value)}>
                  <option value="">— categoria —</option>
                  {PRODOTTI.map(pr=><option key={pr} value={pr}>{pr}</option>)}
                </select>
                <input className="form-control" style={{flex:2}} type="text" placeholder="Nome prodotto (es. SoleLex, Corso...)" value={p.nome||''} onChange={e=>updateProdotto(p.id,'nome',e.target.value)}/>
                <input className="form-control" style={{flex:1}} type="number" placeholder="€" value={p.importo} onChange={e=>updateProdotto(p.id,'importo',e.target.value)}/>
                <button className="btn btn-sm btn-danger" onClick={()=>removeProdotto(p.id)}>×</button>
              </div>
            </div>
          ))}
          <button className="btn btn-sm" onClick={addProdotto} style={{marginBottom:14}}>+ Aggiungi prodotto</button>
          <div style={{background:'var(--bg3)',borderRadius:'var(--radius)',padding:'10px 14px',fontSize:14,fontWeight:700}}>
            Totale contratto: <span style={{color:'#3B6D11'}}>€{totale.toLocaleString('it-IT')}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={save}>Salva contratto</button>
        </div>
      </div>
    </div>
  );
}
