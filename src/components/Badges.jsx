import React from 'react';
import { FONTI, ESITI, PROPOSTE, STATI_APPT } from '../data';

export function StageBadge({ name, stages }) {
  const s = stages?.find(x => x.name === name);
  const color = s ? s.color : '#888';
  return (
    <span className="badge" style={{ background: color + '22', color, border: `1px solid ${color}55` }}>
      {name || '—'}
    </span>
  );
}

export function FonteBadge({ name }) {
  if (!name) return <span className="text-muted fs-12">—</span>;
  const f = FONTI.find(x => x.name === name);
  const color = f ? f.color : '#888';
  const icon = f ? f.icon : '';
  return (
    <span className="badge-fonte" style={{ background: color + '18', color, border: `1px solid ${color}44` }}>
      {icon} {name}
    </span>
  );
}

export function EsitoBadge({ name }) {
  if (!name) return <span className="text-muted fs-12">—</span>;
  const e = ESITI.find(x => x.name === name);
  const color = e ? e.color : '#888';
  return (
    <span className="badge-esito" style={{ background: color + '18', color, border: `1px solid ${color}44` }}>
      {name}
    </span>
  );
}

export function PropostaBadge({ name }) {
  if (!name) return <span className="text-muted fs-12">—</span>;
  const p = PROPOSTE.find(x => x.name === name || x.name.toLowerCase() === (name || '').toLowerCase());
  const color = p ? p.color : '#888';
  const label = p ? p.name : name;
  return (
    <span className="badge" style={{ background: color + '18', color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

export function StatoBadge({ name }) {
  if (!name) return null;
  const s = STATI_APPT.find(x => x.name === name);
  const color = s ? s.color : '#888';
  const icon = s ? s.icon : '';
  return (
    <span className="badge-stato" style={{ background: color + '18', color, border: `1px solid ${color}44` }}>
      {icon} {name}
    </span>
  );
}
