import React from 'react';

/**
 * LangToggle — ES / EN language switch. The source used a small flag button;
 * this is a text toggle for editability. Controlled via value/onChange.
 */
export function LangToggle({ value = 'ES', onChange, onLight = true, ...rest }) {
  const options = ['ES', 'EN'];
  const base = onLight ? 'var(--ink-500)' : 'rgba(255,255,255,0.7)';
  return (
    <div role="group" aria-label="Idioma" style={{
      display: 'inline-flex', alignItems: 'center', gap: '2px',
      border: `1px solid ${onLight ? 'var(--line-300)' : 'rgba(255,255,255,0.5)'}`,
      borderRadius: 'var(--radius-pill)', padding: '3px', fontFamily: 'var(--font-sans)',
    }} {...rest}>
      {options.map((o) => {
        const active = o === value;
        return (
          <button key={o} type="button" onClick={() => onChange && onChange(o)} style={{
            border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 'var(--fs-caption)',
            padding: '4px 11px', borderRadius: 'var(--radius-pill)',
            background: active ? 'var(--teal-300)' : 'transparent',
            color: active ? 'var(--white)' : base,
          }}>{o}</button>
        );
      })}
    </div>
  );
}
