import React from 'react';
import { Button } from '../forms/Button.jsx';

/**
 * SectionCard — an "Acceso sección" / "Observatorios" card: heading, short
 * description and a chevron CTA. Optional accent tab in a brand color.
 */
export function SectionCard({ title, description, cta = 'Conoce más', accent = 'var(--teal-300)', onClick, ...rest }) {
  return (
    <article style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', minWidth: 0,
    }} {...rest}>
      <div style={{ height: '6px', background: accent }} />
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h2)', fontWeight: 700, color: 'var(--text-heading)' }}>{title}</h3>
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-body)', margin: 0, flex: 1 }}>{description}</p>
        <div style={{ marginTop: '6px' }}>
          <Button variant="ghost" chevron onClick={onClick} style={{ padding: '4px 0' }}>{cta}</Button>
        </div>
      </div>
    </article>
  );
}
