// ============================================================
// CRM DATA STORE — localStorage-backed
// ============================================================

export const FONTI = [
  { name: 'Telemarketing Rosanna', color: '#7F77DD', icon: '📞' },
  { name: 'LinkedIn',              color: '#0A66C2', icon: '🔗' },
  { name: 'Coupon Aziendale',      color: '#E07B1A', icon: '🎟' },
  { name: 'Autonomia',             color: '#639922', icon: '⭐' },
  { name: 'Email Marketing',       color: '#c8102e', icon: '✉' },
];

export const CATEGORIE = [
  'Avvocato / Studio Legale','Architetto','Azienda','Caf/Patronato',
  'Commercialista','Consulente del Lavoro','Geometra','Ingegnere',
  'Notaio','Tributarista','Altro',
];

export const ESITI = [
  { name: 'Positivo',       color: '#639922' },
  { name: 'In valutazione', color: '#E07B1A' },
  { name: 'Negativo',       color: '#A32D2D' },
];

export const PROPOSTE = [
  { name: 'Offerta Inviata', color: '#639922' },
  { name: 'Non inviata',     color: '#888888' },
];

export const STATI_APPT = [
  { name: 'Programmato',       icon: '⏳', color: '#378ADD' },
  { name: 'Svolto',            icon: '✅', color: '#639922' },
  { name: 'Da rifissare',      icon: '🔄', color: '#E07B1A' },
  { name: 'Non effettuato',    icon: '❌', color: '#A32D2D' },
  { name: 'Non si è presentato', icon: '🚫', color: '#A32D2D' },
];

export const PRODOTTI = [
  'Editoria elettronica','Software','Formazione','Partner24 Ore',
  'ItalyX','Quotidiani','Newsletter','Business Compass',
  'Studi di Settore','Altri Prodotti',
];

export const DEFAULT_STAGES = [
  { id: 'lead',  name: 'Lead',           color: '#378ADD', isKo: false },
  { id: 'appt',  name: 'Appuntamento',   color: '#EF9F27', isKo: false },
  { id: 'prop',  name: 'Proposta',       color: '#7F77DD', isKo: false },
  { id: 'eval',  name: 'In valutazione', color: '#E07B1A', isKo: false },
  { id: 'ok',    name: 'Chiuso OK',      color: '#639922', isKo: false },
  { id: 'ko',    name: 'Chiuso KO',      color: '#A32D2D', isKo: true  },
];

// ---- Storage helpers ----
export function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
export function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
export function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

// ---- Formatters ----
export function fmtDate(d, opts = { day:'2-digit', month:'short', year:'numeric' }) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('it-IT', opts); } catch { return d; }
}
export function fmtDateTime(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('it-IT', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
  catch { return d; }
}
export function fmtEur(v) { return '€' + (Number(v)||0).toLocaleString('it-IT'); }

export function parseDateIT(str) {
  if (!str) return '';
  str = str.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0,16)||str;
  const mFull = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (mFull) {
    const y = mFull[3].length===2 ? '20'+mFull[3] : mFull[3];
    return `${y}-${mFull[2].padStart(2,'0')}-${mFull[1].padStart(2,'0')}`;
  }
  const mPartial = str.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (mPartial) {
    const now = new Date();
    const day = mPartial[1].padStart(2,'0');
    const month = mPartial[2].padStart(2,'0');
    const thisYear = now.getFullYear();
    const candidate = `${thisYear}-${month}-${day}`;
    const year = new Date(candidate) < now ? thisYear+1 : thisYear;
    return `${year}-${month}-${day}`;
  }
  return str;
}

// ---- Badge helpers ----
export function stageColor(name, stages) {
  const s = stages?.find(x => x.name===name); return s ? s.color : '#888';
}
export function fonteColor(name) { const f=FONTI.find(x=>x.name===name); return f?f.color:'#888'; }
export function fonteIcon(name)  { const f=FONTI.find(x=>x.name===name); return f?f.icon:''; }

// ---- Helpers ----
export function getLastAppt(c) {
  const appts = (c.history||[]).filter(h=>h.type==='appt'&&h.date).sort((a,b)=>b.date.localeCompare(a.date));
  return appts[0] ? appts[0].date.split('T')[0] : '';
}
export function getNextFu(c) {
  const fus = (c.history||[]).filter(h=>h.type==='note'&&h.followup).sort((a,b)=>a.followup.localeCompare(b.followup));
  return fus[0] ? fus[0].followup : '';
}
export function getImportoPreventivato(c) { return Number(c.importoProposta)||0; }
export function getDataChiusura(c) {
  // Use explicit dataChiusura first, fall back to contratto.dataInizio
  return c.dataChiusura || c.contratto?.dataInizio || '';
}

export function getImportoFatturato(c) {
  if (!c.contratto?.prodotti?.length) return Number(c.contratto?.totale)||0;
  return c.contratto.prodotti.reduce((s,p)=>s+(Number(p.importo)||0),0);
}

// ---- Demo data ----
export function buildDemoData() {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now()+86400000).toISOString().split('T')[0];
  const yesterday= new Date(Date.now()-86400000).toISOString().split('T')[0];
  const contacts = [
    { id:genId(), nome:'Giulia Ferretti', azienda:'Studio Ferretti & Associati', telefono:'06 1234567', email:'g.ferretti@ferretti.it', fase:'In valutazione', fonte:'LinkedIn', categoria:'Commercialista', esito:'In valutazione', proposta:'Offerta Inviata', importoProposta:3600, customData:{}, contratto:null,
      history:[
        {id:genId(),type:'appt',date:'2025-03-10T09:00',stato:'Svolto',esito:'Primo contatto positivo. Interessata al pacchetto Platinum.'},
        {id:genId(),type:'note',date:today,text:'Richiede sconto sul rinnovo annuale.',followup:tomorrow},
      ]},
    { id:genId(), nome:'Roberto Conti', azienda:'Conti Consulting Srl', telefono:'02 9876543', email:'r.conti@conti.com', fase:'Appuntamento', fonte:'Telemarketing Rosanna', categoria:'Azienda', esito:'In valutazione', proposta:'Non inviata', importoProposta:0, customData:{}, contratto:null,
      history:[
        {id:genId(),type:'appt',date:new Date(Date.now()+86400000*2).toISOString(),stato:'Programmato',esito:''},
        {id:genId(),type:'note',date:today,text:'Primo contatto via Calendly.',followup:tomorrow},
      ]},
    { id:genId(), nome:'Sara Lombardi', azienda:'TechVenture Spa', telefono:'051 456789', email:'s.lombardi@techventure.it', fase:'Chiuso OK', fonte:'Email Marketing', categoria:'Azienda', esito:'Positivo', proposta:'Offerta Inviata', importoProposta:4800, customData:{}, 
      contratto:{ dataInizio:'2025-04-10', durataM:12, dataFine:'2026-04-10', prodotti:[{nome:'Software',importo:3200},{nome:'Formazione',importo:1600}], totale:4800 },
      history:[{id:genId(),type:'appt',date:'2025-04-10T15:00',stato:'Svolto',esito:'Contratto firmato.'}]},
    { id:genId(), nome:'Luca Moretti', azienda:'Studio Notarile Moretti', telefono:'06 7654321', email:'l.moretti@notaio.it', fase:'Chiuso KO', fonte:'Autonomia', categoria:'Notaio', esito:'Negativo', proposta:'Non inviata', importoProposta:0, customData:{}, contratto:null,
      history:[{id:genId(),type:'note',date:yesterday,text:'Non interessato.',followup:yesterday}]},
    { id:genId(), nome:'Anna De Luca', azienda:'De Luca & Partners', telefono:'081 234567', email:'a.deluca@partners.it', fase:'Lead', fonte:'Coupon Aziendale', categoria:'Avvocato / Studio Legale', esito:'', proposta:'', importoProposta:0, customData:{}, contratto:null, history:[]},
  ];
  return { contacts, deals:[] };
}