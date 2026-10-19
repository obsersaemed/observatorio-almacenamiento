import React from 'react';

/**
 * Panel — titled white container that wraps a chart, map or table on the
 * observatory. Centered bold title (optional subtitle), soft card shadow.
 */
export function Panel({ title, subtitle = null, align = 'center', actions = null, children, padding = '18px 20px', ...rest }) {
  return (
    <section style={{
      background: 'var(--surface-card)', border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding,
      display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0,
    }} {...rest}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ textAlign: align, flex: 1 }}>
            {title && <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', fontWeight: 700, color: 'var(--text-heading)' }}>{title}</h3>}
            {subtitle && <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </section>
  );
}
