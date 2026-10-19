import React from 'react';

const ICONS = {
  x: 'M18.9 2H22l-6.9 7.9L23 22h-6.4l-5-6.6L5.8 22H2.7l7.4-8.5L2 2h6.6l4.5 6 5.8-6zm-1.1 18h1.8L7.3 3.8H5.4L17.8 20z',
  instagram: 'M12 7.2A4.8 4.8 0 1012 16.8 4.8 4.8 0 0012 7.2zm0 7.9a3.1 3.1 0 110-6.2 3.1 3.1 0 010 6.2zM17.8 7A1.1 1.1 0 1116.7 5.9 1.1 1.1 0 0117.8 7zM21 8.1c-.1-1.5-.4-2.9-1.5-4S17.4 2.6 15.9 2.5C14.3 2.4 9.7 2.4 8.1 2.5c-1.5.1-2.9.4-4 1.5S2.6 6.6 2.5 8.1c-.1 1.6-.1 6.2 0 7.8.1 1.5.4 2.9 1.5 4s2.5 1.4 4 1.5c1.6.1 6.2.1 7.8 0 1.5-.1 2.9-.4 4-1.5s1.4-2.5 1.5-4c.1-1.6.1-6.2 0-7.8zm-2 9.5a3.1 3.1 0 01-1.8 1.8c-1.2.5-4.2.4-5.6.4s-4.3.1-5.6-.4a3.1 3.1 0 01-1.8-1.8c-.5-1.2-.4-4.2-.4-5.6s-.1-4.3.4-5.6A3.1 3.1 0 016.4 4.8C7.7 4.3 10.6 4.4 12 4.4s4.3-.1 5.6.4a3.1 3.1 0 011.8 1.8c.5 1.2.4 4.2.4 5.6s.1 4.3-.4 5.6z',
  facebook: 'M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z',
  linkedin: 'M20.4 3H3.6A.6.6 0 003 3.6v16.8a.6.6 0 00.6.6h16.8a.6.6 0 00.6-.6V3.6a.6.6 0 00-.6-.6zM8.3 18.3H5.4V9.4h2.9v8.9zM6.9 8.2a1.7 1.7 0 110-3.4 1.7 1.7 0 010 3.4zm11.4 10.1h-2.9v-4.3c0-1 0-2.4-1.4-2.4s-1.7 1.1-1.7 2.3v4.4H9.4V9.4h2.8v1.2h.1a3 3 0 012.7-1.5c2.9 0 3.4 1.9 3.4 4.4v4.8z',
};

/**
 * SocialLinks — the header's "Redes sociales: X / Instagram / FB / LinkedIn" row.
 * Renders inline icon links. Pass onLight={false} on teal backgrounds.
 */
export function SocialLinks({
  networks = ['x', 'instagram', 'facebook', 'linkedin'],
  showLabel = true,
  onLight = true,
  size = 18,
  links = {},
  ...rest
}) {
  const color = onLight ? 'var(--ink-700)' : 'var(--white)';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-sans)' }} {...rest}>
      {showLabel && <span style={{ fontSize: 'var(--fs-caption)', color, fontWeight: 600 }}>Redes sociales</span>}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        {networks.map((n) => (
          <a key={n} href={links[n] || '#'} aria-label={n} style={{ color, display: 'inline-flex', lineHeight: 0 }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={ICONS[n]} /></svg>
          </a>
        ))}
      </div>
    </div>
  );
}
