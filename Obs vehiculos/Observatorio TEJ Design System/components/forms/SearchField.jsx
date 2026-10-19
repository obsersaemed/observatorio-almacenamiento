import React from 'react';

/**
 * SearchField — rounded search input matching the site's "Buscar" control.
 * Pill-shaped with a leading magnifier glyph and optional inline button.
 */
export function SearchField({
  placeholder = 'Buscar',
  value,
  onChange,
  onSubmit,
  buttonLabel = null,
  width = '100%',
  ...rest
}) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(); }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px', width,
        background: 'var(--white)', border: '1.5px solid var(--line-300)',
        borderRadius: 'var(--radius-pill)', padding: '9px 9px 9px 16px',
        boxShadow: 'var(--shadow-sm)',
      }}
      {...rest}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flex: '0 0 auto' }}>
        <circle cx="11" cy="11" r="7" stroke="var(--ink-500)" strokeWidth="2" />
        <path d="M20 20l-3.2-3.2" stroke="var(--ink-500)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search" value={value} placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        style={{
          flex: '1 1 auto', border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-body)',
          minWidth: 0,
        }}
      />
      {buttonLabel && (
        <button type="submit" style={{
          border: 'none', cursor: 'pointer', background: 'var(--teal-300)', color: 'var(--white)',
          fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'var(--fs-small)',
          padding: '8px 18px', borderRadius: 'var(--radius-pill)',
        }}>{buttonLabel}</button>
      )}
    </form>
  );
}
