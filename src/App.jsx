import React, { useState, useEffect, useCallback } from 'react';
import { load, save, genId, buildDemoData, DEFAULT_STAGES, parseDateIT } from './data';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Contacts from './components/Contacts';
import Pipeline from './components/Pipeline';
import Appointments from './components/Appointments';
import FollowUps from './components/FollowUps';
import ChiusoPerMese from './components/ChiusoPerMese';
import ArchivioKO from './components/ArchivioKO';
import Calendly from './components/Calendly';
import Settings from './components/Settings';
import Modal from './components/Modal';
import Toast from './components/Toast';
import './App.css';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [contacts, setContacts] = useState(() => {
    const saved = load('crm_contacts', null);
    if (saved) return saved;
    const demo = buildDemoData();
    save('crm_contacts', demo.contacts);
    return demo.contacts;
  });
  const [deals, setDeals] = useState(() => {
    const saved = load('crm_deals', null);
    if (saved) return saved;
    const demo = buildDemoData();
    save('crm_deals', demo.deals);
    return demo.deals;
  });
  const [stages, setStages] = useState(() => load('crm_stages', DEFAULT_STAGES));
  const [customFields, setCustomFields] = useState(() => load('crm_fields', []));
  const [brand, setBrand] = useState(() => load('crm_brand', {
    name: 'Sole 24 Ore Pro', sub: 'CRM Personale',
    user: 'Marco Proietti', role: 'Il Sole 24 Ore Professionale',
    color: '#c8102e', callink: 'https://calendly.com/marco-proietti-il-sole-24-ore'
  }));
  const [gsCfg, setGsCfg] = useState(() => load('crm_gs', {
    sheetId: '1nC3fC_REUsd-XmoAKYXrsAqvxTlN8jcq4dvUrl32E3A',
    apiKey: 'AIzaSyBK57pFTI_sIIvy4haf0OZcDHws27kFPfM',
    tabName: 'Appuntamenti e trattative',
    gid: '2071299283'
  }));
  const [ejsCfg, setEjsCfg] = useState(() => load('crm_ejs', {}));
  const [modal, setModal] = useState(null); // { type, data }
  const [toast, setToast] = useState(null);

  // Persist contacts/deals/stages
  useEffect(() => { save('crm_contacts', contacts); }, [contacts]);
  useEffect(() => { save('crm_deals', deals); }, [deals]);
  useEffect(() => { save('crm_stages', stages); }, [stages]);
  useEffect(() => { save('crm_fields', customFields); }, [customFields]);
  useEffect(() => { save('crm_brand', brand); }, [brand]);
  useEffect(() => { save('crm_gs', gsCfg); }, [gsCfg]);
  useEffect(() => { save('crm_ejs', ejsCfg); }, [ejsCfg]);

  // Apply brand color
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', brand.color || '#c8102e');
    document.title = (brand.name || 'CRM') + ' — CRM';
  }, [brand]);

  const showToast = useCallback((title, msg, type = 'success') => {
    setToast({ title, msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Follow-up count for badge
  const today = new Date().toISOString().split('T')[0];
  const urgentFU = contacts.reduce((n, c) =>
    n + (c.history || []).filter(h => h.type === 'note' && h.followup && h.followup <= today).length, 0);

  // Contact CRUD
  const saveContact = useCallback((data) => {
    setContacts(prev => {
      const idx = prev.findIndex(c => c.id === data.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = data;
        return next;
      }
      return [...prev, { ...data, id: genId(), history: [], customData: {} }];
    });
    showToast('Contatto salvato', data.nome);
  }, [showToast]);

  const deleteContact = useCallback((id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    showToast('Contatto eliminato', '', 'info');
  }, [showToast]);

  const deleteContacts = useCallback((ids) => {
    setContacts(prev => prev.filter(c => !ids.has(c.id)));
    showToast(`${ids.size} contatti eliminati`, '', 'info');
  }, [showToast]);

  const updateContact = useCallback((id, updater) => {
    setContacts(prev => prev.map(c => c.id === id ? updater(c) : c));
  }, []);

  // Deal CRUD
  const saveDeal = useCallback((data) => {
    setDeals(prev => {
      const idx = prev.findIndex(d => d.id === data.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = data; return next; }
      return [...prev, { ...data, id: genId() }];
    });
    showToast('Trattativa salvata', data.nome);
  }, [showToast]);

  const deleteDeal = useCallback((id) => {
    setDeals(prev => prev.filter(d => d.id !== id));
  }, []);

  // Google Sheet sync
  const syncFromGoogleSheet = useCallback(async () => {
    const { sheetId, apiKey, tabName } = gsCfg;
    if (!sheetId || !apiKey) return { error: 'Credenziali mancanti' };

    const tab = encodeURIComponent(tabName || 'Sheet1');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${tab}?key=${apiKey}`;
    try {
      const r = await fetch(url);
      const data = await r.json();
      if (data.error) return { error: data.error.message };

      const rows = data.values || [];
      if (rows.length < 2) return { imported: 0, skipped: 0 };

      const header = rows[0].map(h => h.toLowerCase().trim());
      const colExact = name => header.indexOf(name.toLowerCase().trim());
      const colPartial = names => { for (const n of names) { const i = header.findIndex(h => h.includes(n)); if (i >= 0) return i; } return -1; };

      const iNome     = colExact('nome') >= 0 ? colExact('nome') : colPartial(['nome', 'name']);
      const iCat      = colExact('categoria') >= 0 ? colExact('categoria') : colPartial(['categoria', 'category']);
      const iEmail    = colExact('email') >= 0 ? colExact('email') : colPartial(['email', 'mail']);
      const iTel      = colExact('telefono') >= 0 ? colExact('telefono') : colPartial(['telefono', 'tel', 'phone']);
      const iData     = colExact('data ultimo appuntamento') >= 0 ? colExact('data ultimo appuntamento') : colPartial(['data ultimo', 'data app', 'scheduled']);
      const iFonte    = colExact('fonte') >= 0 ? colExact('fonte') : colPartial(['fonte', 'source']);
      const iAzienda  = colExact('azienda') >= 0 ? colExact('azienda') : colPartial(['azienda', 'studio', 'company']);
      const iEsitoApp = colExact('esito appuntamento') >= 0 ? colExact('esito appuntamento') : colPartial(['esito appuntamento']);
      const iProposta = colExact('proposta') >= 0 ? colExact('proposta') : colPartial(['proposta']);
      const iEsito    = colExact('esito') >= 0 ? colExact('esito') : colPartial(['esito']);
      const iNote     = colExact('note app.to') >= 0 ? colExact('note app.to') : colPartial(['note app', 'note']);
      const iFollowup = colExact('follow up') >= 0 ? colExact('follow up') : colPartial(['follow up', 'follow-up', 'ricontattare']);

      const g = (row, idx) => idx >= 0 ? (row[idx] || '').trim() : '';
      const faseMap = {
        'ok': 'Chiuso OK', 'chiuso ok': 'Chiuso OK',
        'ko': 'Chiuso KO', 'chiuso ko': 'Chiuso KO', 'ko momentaneo': 'Chiuso KO',
        'in trattativa': 'In valutazione', 'in valutazione': 'In valutazione',
        'proposta': 'Proposta', 'appuntamento': 'Appuntamento', 'lead': 'Lead',
      };
      const propostaMap = {
        'offerta inviata': 'Offerta Inviata', 'k.o': 'K.O', 'ko': 'K.O',
        'non interessato': 'Non interessato', 'non classificato': 'Non classificato',
      };

      let imported = 0, skipped = 0;
      const newContacts = [];

      setContacts(prev => {
        const result = [...prev];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const nome = g(row, iNome);
          if (!nome) { skipped++; continue; }
          const email = g(row, iEmail);
          const exists = result.find(c =>
            (email && c.email && c.email.toLowerCase() === email.toLowerCase()) ||
            c.nome.toLowerCase() === nome.toLowerCase()
          );
          if (exists) { skipped++; continue; }

          const esitoRaw = g(row, iEsitoApp).toLowerCase() || g(row, iEsito).toLowerCase();
          const esito = esitoRaw.includes('positiv') ? 'Positivo' : esitoRaw.includes('negativ') ? 'Negativo' : esitoRaw.includes('attesa') ? 'In attesa' : '';
          const faseRaw = colPartial(['esito trattativa', 'trattativa']) >= 0 ? g(row, colPartial(['esito trattativa', 'trattativa'])).toLowerCase() : '';
          const fase = faseMap[faseRaw] || stages[1]?.name || stages[0]?.name || 'Appuntamento';
          const propostaRaw = g(row, iProposta).toLowerCase();
          const proposta = propostaMap[propostaRaw] || g(row, iProposta) || '';

          const history = [];
          const dataRaw = g(row, iData);
          const noteRaw = g(row, iNote);
          const followup = parseDateIT(g(row, iFollowup));
          const todayStr = new Date().toISOString().split('T')[0];

          if (dataRaw) {
            const apptDate = parseDateIT(dataRaw) || dataRaw;
            const apptDs = apptDate.split('T')[0];
            const isPast = apptDs < todayStr;
            const stato = isPast ? (esito === 'Negativo' ? 'Non effettuato' : 'Svolto') : 'Programmato';
            history.push({ id: genId(), type: 'appt', date: apptDate, stato, esito: noteRaw || '' });
          }
          if (followup) {
            history.push({ id: genId(), type: 'note', date: todayStr, text: noteRaw || 'Follow-up da importazione', followup });
          }

          result.push({
            id: genId(), nome, azienda: g(row, iAzienda), email,
            telefono: g(row, iTel), categoria: g(row, iCat),
            fase, fonte: g(row, iFonte) || 'Calendly',
            esito, proposta, customData: {}, history
          });
          imported++;
        }
        return result;
      });

      // AI note rewriting
      if (imported > 0) {
        showToast('Sincronizzazione completata', `${imported} nuovi contatti importati`, 'success');
      }

      return { imported, skipped };
    } catch (e) {
      return { error: e.message };
    }
  }, [gsCfg, stages, showToast]);

  const sharedProps = {
    contacts, deals, stages, customFields, brand, gsCfg, ejsCfg,
    setContacts, setDeals, setStages, setCustomFields, setBrand, setGsCfg, setEjsCfg,
    saveContact, deleteContact, deleteContacts, updateContact, saveDeal, deleteDeal,
    syncFromGoogleSheet, setModal, showToast, today, setPage,
  };

  const pages = {
    dashboard: Dashboard,
    contacts: Contacts,
    pipeline: Pipeline,
    appointments: Appointments,
    followups: FollowUps,
    chiuso: ChiusoPerMese,
    archivio: ArchivioKO,
    calendly: Calendly,
    settings: Settings,
  };
  const PageComponent = pages[page] || Dashboard;

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} brand={brand} urgentFU={urgentFU} />
      <main className="main">
        <PageComponent {...sharedProps} />
      </main>
      {modal && <Modal modal={modal} setModal={setModal} {...sharedProps} />}
      {toast && <Toast toast={toast} />}
    </div>
  );
}
