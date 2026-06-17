import React from 'react';

export function titleCase(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function statusClass(status) {
  switch (status) {
    case 'validee':
      return 'chip chip-success';
    case 'payee':
      return 'chip chip-accent';
    case 'rejetee':
      return 'chip chip-danger';
    case 'en_attente':
      return 'chip chip-warn';
    default:
      return 'chip';
  }
}

export function Field({ label, hint, children, wide = false, error }) {
  return (
    <label className={`field ${wide ? 'wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-hint field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Card({ title, value, note, icon: Icon, tone = 'default' }) {
  return (
    <section className={`card stat-card stat-card-${tone}`}>
      <div className="stat-card-top">
        <div className="stat-card-title">{title}</div>
        {Icon ? <div className="stat-card-icon"><Icon size={18} /></div> : null}
      </div>
      <div className="stat-card-value">{value}</div>
      {note ? <div className="muted stat-card-note">{note}</div> : null}
    </section>
  );
}

export function Panel({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`panel card ${className}`.trim()}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({ value }) {
  return <span className={statusClass(value)}>{titleCase(value)}</span>;
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function Skeleton({ width = '100%', height = '1rem', className = '' }) {
  return <div className={`skeleton ${className}`.trim()} style={{ width, height }} />;
}

export function LoadingPanel({ rows = 4 }) {
  return (
    <div className="loading-panel">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height={index === 0 ? '2rem' : '3.5rem'} />
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h2 className="page-title">{title}</h2>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  );
}

export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
