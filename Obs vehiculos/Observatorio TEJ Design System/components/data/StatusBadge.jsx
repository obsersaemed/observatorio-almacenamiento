import React from 'react';

export const STATUS = {
  op: { label: 'En operación', color: 'var(--status-op)' },
  con: { label: 'En construcción', color: 'var(--status-con)' },
  plan: { label: 'Planeado / otro', color: 'var(--status-plan)' },
  susp: { label: 'Suspendido', color: 'var(--status-susp)' },
};

/**
 * StatusBadge — project-status indicator. "dot" = colored dot + label (legend
 * / map style); "text" = colored label only (table cell style); "pill" = soft
 * tinted pill.
 */
export function StatusBadge({ status = 'op', label = null, variant = 'dot', ...rest }) {
  const s = STATUS[status] || STATUS.op;
  const text = label || s.label;
  if (variant === 'text') {
    return <span style={{ color: s.color, fontWeight: 700, fontSize: 'var(--fs-small)', fontFamily: 'var(--font-sans)' }} {...rest}>{text}</span>;
  }
  if (variant === 'pill') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '7px', fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-caption)', fontWeight: 700, color: s.color,
        background: 'color-mix(in srgb, currentColor 12%, white)', padding: '4px 10px', borderRadius: 'var(--radius-pill)',
      }} {...rest}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />{text}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-small)', color: 'var(--text-body)' }} {...rest}>
      <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: s.color, flex: '0 0 auto' }} />{text}
    </span>
  );
}
