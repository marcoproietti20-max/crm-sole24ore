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
  'Avvocato / Studio Legale', 'Architetto', 'Azienda', 'Caf/Patronato',
  'Commercialista', 'Consulente del Lavoro', 'Geometra', 'Ingegnere',
  'Notaio', 'Tributarista', 'Altro',
];

export const ESITI = [
  { name: 'Positivo',  color: '#639922' },
  { name: 'In attesa', color: '#E07B1A' },
  { name: 'Negativo',  color: '#A32D2D' },
];

export const PROPOSTE = [
  { name: 'Offerta Inviata',  color: '#639922' },
  { name: 'Non classificato', color: '#888888' },
  { name: 'Non interessato',  color: '#A32D2D' },
  { name: 'K.O',              color: '#791F1F' },
];

export const STATI_APPT = [
  { name: 'Programmato',    icon: '⏳', color: '#378ADD' },
  { name: 'Svolto',         icon: '✅', color: '#639922' },
  { name: 'Da rifissare',   icon: '🔄', color: '#E07B1A' },
  { name: 'Non effettuato', icon: '❌', color: '#A32D2D' },
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
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---- Formatters ----
export function fmtDate(d, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('it-IT', opts); }
  catch { return d; }
}

export function fmtDateTime(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
}

export function fmtEur(v) {
  return '€' + (Number(v) || 0).toLocaleString('it-IT');
}

export function parseDateIT(str) {
  if (!str) return '';
  str = str.trim();
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 16) || str;
  // Full date with year: DD/MM/YYYY or DD-MM-YYYY
  const mFull = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (mFull) {
    const y = mFull[3].length === 2 ? '20' + mFull[3] : mFull[3];
    return `${y}-${mFull[2].padStart(2, '0')}-${mFull[1].padStart(2, '0')}`;
  }
  // Partial date without year: DD/MM or D/M — assume current or next year
  const mPartial = str.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (mPartial) {
    const now = new Date();
    const day = mPartial[1].padStart(2, '0');
    const month = mPartial[2].padStart(2, '0');
    const thisYear = now.getFullYear();
    const candidate = `${thisYear}-${month}-${day}`;
    // If date already passed this year, use next year
    const candidateDate = new Date(candidate);
    const year = candidateDate < now ? thisYear + 1 : thisYear;
    return `${year}-${month}-${day}`;
  }
  return str;
}

// ---- Badge helpers ----
export function stageColor(stageName, stages) {
  const s = stages.find(x => x.name === stageName);
  return s ? s.color : '#888';
}

export function fonteColor(name) {
  const f = FONTI.find(x => x.name === name);
  return f ? f.color : '#888';
}

export function fonteIcon(name) {
  const f = FONTI.find(x => x.name === name);
  return f ? f.icon : '';
}

// ---- Demo data ----
export function buildDemoData() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const contacts = [
    {
      id: genId(), nome: 'Giulia Ferretti', azienda: 'Studio Ferretti & Associati',
      telefono: '06 1234567', email: 'g.ferretti@ferretti.it',
      fase: 'Proposta', fonte: 'LinkedIn', categoria: 'Commercialista',
      esito: 'In attesa', proposta: 'Offerta Inviata', customData: {},
      history: [
        { id: genId(), type: 'appt', date: '2025-03-10T09:00', stato: 'Svolto', esito: 'Primo contatto positivo. Interessata al pacchetto Platinum.' },
        { id: genId(), type: 'note', date: today, text: 'Richiede sconto sul rinnovo annuale.', followup: tomorrow },
      ]
    },
    {
      id: genId(), nome: 'Roberto Conti', azienda: 'Conti Consulting Srl',
      telefono: '02 9876543', email: 'r.conti@conti.com',
      fase: 'Appuntamento', fonte: 'Telemarketing Rosanna', categoria: 'Azienda',
      esito: 'In attesa', proposta: 'Non classificato', customData: {},
      history: [
        { id: genId(), type: 'appt', date: new Date(Date.now() + 86400000 * 2).toISOString(), stato: 'Programmato', esito: '' },
        { id: genId(), type: 'note', date: today, text: 'Primo contatto via Calendly. Da qualificare.', followup: tomorrow },
      ]
    },
    {
      id: genId(), nome: 'Sara Lombardi', azienda: 'TechVenture Spa',
      telefono: '051 456789', email: 's.lombardi@techventure.it',
      fase: 'Chiuso OK', fonte: 'Email Marketing', categoria: 'Azienda',
      esito: 'Positivo', proposta: 'Offerta Inviata', customData: {},
      history: [
        { id: genId(), type: 'appt', date: '2025-04-10T15:00', stato: 'Svolto', esito: 'Contratto firmato. Valore €4.800/anno.' },
      ]
    },
    {
      id: genId(), nome: 'Luca Moretti', azienda: 'Studio Notarile Moretti',
      telefono: '06 7654321', email: 'l.moretti@notaio.it',
      fase: 'Lead', fonte: 'Autonomia', categoria: 'Notaio',
      esito: '', proposta: '', customData: {},
      history: [
        { id: genId(), type: 'note', date: yesterday, text: 'Da ricontattare con proposta personalizzata.', followup: yesterday },
      ]
    },
    {
      id: genId(), nome: 'Anna De Luca', azienda: 'De Luca & Partners',
      telefono: '081 234567', email: 'a.deluca@partners.it',
      fase: 'Lead', fonte: 'Coupon Aziendale', categoria: 'Avvocato / Studio Legale',
      esito: '', proposta: '', customData: {}, history: []
    },
  ];

  const deals = [
    { id: genId(), contactId: contacts[0].id, nome: contacts[0].nome, azienda: contacts[0].azienda, valore: 3600, fase: 'Proposta', dataChiusura: '2025-05-01', note: '' },
    { id: genId(), contactId: contacts[1].id, nome: contacts[1].nome, azienda: contacts[1].azienda, valore: 2400, fase: 'Appuntamento', dataChiusura: '2025-05-15', note: '' },
    { id: genId(), contactId: contacts[2].id, nome: contacts[2].nome, azienda: contacts[2].azienda, valore: 4800, fase: 'Chiuso OK', dataChiusura: '2025-04-10', note: '' },
    { id: genId(), contactId: contacts[3].id, nome: contacts[3].nome, azienda: contacts[3].azienda, valore: 1800, fase: 'Lead', dataChiusura: '2025-05-30', note: '' },
    { id: genId(), contactId: contacts[4].id, nome: contacts[4].nome, azienda: contacts[4].azienda, valore: 3000, fase: 'Lead', dataChiusura: '2025-06-01', note: '' },
  ];

  return { contacts, deals };
}
