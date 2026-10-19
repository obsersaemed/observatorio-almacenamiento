import React from 'react';

/**
 * Logo — the TEJ wordmark. No image logo was provided with the sources, so the
 * brand is set in Raleway. Variants: "full" (stacked lockup), "pill" (teal
 * badge), "mono" (short TEJ mark).
 */
export function Logo({ variant = 'full', onLight = true, ...rest }) {
  const ink = onLight ? 'var(--ink-900)' : 'var(--white)';
  const kicker = onLight ? 'var(--brand-ink)' : 'var(--white)';
  if (variant === 'pill') {
    return (
      <span style={{
        display: 'inline-block', background: 'var(--teal-300)', color: 'var(--white)',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h3)',
        letterSpacing: '0.06em', padding: '10px 20px', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-brand)',
      }} {...rest}>OBSERVATORIO TEJ</span>
    );
  }
  if (variant === 'mono') {
    return (
      <span style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '32px',
        color: 'var(--brand-ink)', letterSpacing: '-0.02em',
      }} {...rest}>TEJ</span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.06, fontFamily: 'var(--font-display)' }} {...rest}>
      <span style={{ color: kicker, fontWeight: 800, fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Observatorio</span>
      <span style={{ color: ink, fontWeight: 800, fontSize: '20px', letterSpacing: '-0.01em', maxWidth: '260px' }}>Transición Energética Justa</span>
    </span>
  );
}
