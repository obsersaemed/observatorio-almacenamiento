import React from 'react';

/**
 * Button — primary action control for the TEJ site & observatory.
 * Variants: primary (teal fill), secondary (teal outline), ghost (text),
 * accent (warm peach). Sizes sm | md | lg. Optional trailing chevron for
 * the "Acceso sección" style links from the site wireframe.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  chevron = false,
  iconLeft = null,
  disabled = false,
  as = 'button',
  ...rest
}) {
  const sizes = {
    sm: { padding: '8px 14px', font: 'var(--fs-small)', radius: 'var(--radius-md)' },
    md: { padding: '11px 20px', font: 'var(--fs-body)', radius: 'var(--radius-md)' },
    lg: { padding: '15px 28px', font: 'var(--fs-h3)', radius: 'var(--radius-lg)' },
  };
  const variants = {
    primary: { background: 'var(--teal-300)', color: 'var(--white)', border: '1px solid var(--teal-300)', boxShadow: 'var(--shadow-sm)' },
    secondary: { background: 'transparent', color: 'var(--brand-ink)', border: '1.5px solid var(--teal-300)' },
    ghost: { background: 'transparent', color: 'var(--brand-ink)', border: '1px solid transparent' },
    accent: { background: 'var(--peach-300)', color: 'var(--ink-900)', border: '1px solid var(--peach-300)', boxShadow: 'var(--shadow-sm)' },
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const style = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: s.font,
    lineHeight: 1, padding: s.padding, borderRadius: s.radius,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    transition: 'filter .15s ease, transform .05s ease', textDecoration: 'none',
    whiteSpace: 'nowrap', ...v,
  };
  const Tag = as;
  return (
    <Tag
      style={style}
      disabled={as === 'button' ? disabled : undefined}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(1px)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.94)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
      {...rest}
    >
      {iconLeft}
      <span>{children}</span>
      {chevron && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </Tag>
  );
}
