import React from 'react';

/**
 * StatCard — a KPI pill from the observatory. Teal fill, white label + big
 * numeral. Set variant="outline" for a white card with teal numeral.
 */
export function StatCard({ label, value, unit = null, variant = 'solid', ...rest }) {
  const solid = variant === 'solid';
  return (
    <div style={{
      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
      background: solid ? 'var(--teal-300)' : 'var(--white)',
      color: solid ? 'var(--white)' : 'var(--text-body)',
      boxShadow: solid ? 'var(--shadow-brand)' : 'var(--shadow-card)',
      border: solid ? 'none' : '1px solid var(--border-card)',
      display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0,
    }} {...rest}>
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-caption)', fontWeight: 600,
        letterSpacing: 'var(--ls-caps)', opacity: solid ? 0.95 : 0.75,
      }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 'var(--fs-kpi)', fontWeight: 800, lineHeight: 1,
          color: solid ? 'var(--white)' : 'var(--brand-ink)',
        }}>{value}</span>
        {unit && <span style={{ fontSize: 'var(--fs-small)', fontWeight: 600, opacity: 0.9 }}>{unit}</span>}
      </span>
    </div>
  );
}
