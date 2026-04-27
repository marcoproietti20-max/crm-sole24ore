import React, { useState, useEffect } from 'react';

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',       icon: 'M2 2h5v5H2zm7 0h5v5H9zm-7 7h5v5H2zm7 0h5v5H9z' },
  { id: 'contacts',     label: 'Contatti',         icon: 'M8 8a3 3 0 100-6 3 3 0 000 6zm-6 6c0-3.3 2.7-6 6-6s6 2.7 6 6' },
  { id: 'pipeline',     label: 'Pipeline',         icon: 'M2 4h4v8H2zm5 3h4v5H7zm5-5h2v10h-2z' },
  { id: 'appointments', label: 'Appuntamenti',     icon: 'M1 2h14a1 1 0 011 1v11a1 1 0 01-1 1H1a1 1 0 01-1-1V3a1 1 0 011-1zm0 4h14M5 1v2M11 1v2' },
  { id: 'followups',    label: 'Follow-up',        icon: 'M8 1v7l4 2M15 8A7 7 0 111 8a7 7 0 0114 0z', badge: true },
  { id: 'chiuso',       label: 'Chiuso per mese',  icon: 'M2 12l4-4 3 3 5-6M1 15h14' },
  { id: 'archivio',     label: 'Archivio KO',      icon: 'M1 5h14l-2-3H3zm0 0v10a1 1 0 001 1h12a1 1 0 001-1V5M6 9h4' },
  { id: 'calendly',     label: 'Calendly',         icon: 'M8 2a6 6 0 100 12A6 6 0 008 2zm0 3v4l3 2' },
  { id: 'settings',     label: 'Impostazioni',     icon: 'M8 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8 1v2M8 13v2M1 8h2M13 8h2' },
];

export default function Sidebar({ page, setPage, brand, urgentFU }) {
  const [open, setOpen] = useState(window.innerWidth > 1280);

  useEffect(() => {
    const handler = () => setOpen(window.innerWidth > 1280);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const navigate = (id) => {
    setPage(id);
    if (window.innerWidth <= 600) setOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && window.innerWidth <= 600 && (
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 49 }} />
      )}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        {/* Toggle button */}
        <button className="sidebar-toggle" onClick={() => setOpen(o => !o)} title={open ? 'Chiudi menu' : 'Apri menu'}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            {open
              ? <path d="M15 5L5 15M5 5l10 10" />
              : <path d="M3 5h14M3 10h14M3 15h14" />}
          </svg>
        </button>

        <div className="sidebar-logo">
          <div className="brand-row">
            <span className="brand-dot" style={{ background: brand.color || '#c8102e' }} />
            <span className="brand-name">{brand.name || 'Sole 24 Ore Pro'}</span>
          </div>
          <div className="brand-sub">{brand.sub || 'CRM Personale'}</div>
        </div>

        <nav className="nav">
          <div className="nav-label">Menu</div>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item${page === item.id ? ' active' : ''}`}
              onClick={() => navigate(item.id)}
              title={item.label}
            >
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
              {item.badge && urgentFU > 0 && (
                <span className="nav-badge">{urgentFU}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>{brand.user || 'Marco Proietti'}</strong>
          <span>{brand.role || 'Il Sole 24 Ore Professionale'}</span>
        </div>
      </aside>
    </>
  );
}
