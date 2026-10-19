import React from 'react';
import { StatusBadge, STATUS } from './StatusBadge.jsx';

/**
 * StatusLegend — the map's "Estado" legend box. Lists the project statuses with
 * colored dots. Floating variant adds the white rounded card + shadow.
 */
export function StatusLegend({
  title = 'Estado',
  items = ['op', 'con', 'plan'],
  floating = true,
  ...rest
}) {
  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
      background: floating ? 'var(--white)' : 'transparent',
      border: floating ? '1px solid var(--border-card)' : 'none',
      borderRadius: 'var(--radius-md)', boxShadow: floating ? 'var(--shadow-card)' : 'none',
      padding: floating ? '12px 16px' : 0, display: 'inline-flex', flexDirection: 'column', gap: '9px',
    }} {...rest}>
      {title && <span style={{ fontWeight: 700, fontSize: 'var(--fs-small)', color: 'var(--text-heading)' }}>{title}</span>}
      {items.map((k) => <StatusBadge key={k} status={k} variant="dot" />)}
    </div>
  );
}
