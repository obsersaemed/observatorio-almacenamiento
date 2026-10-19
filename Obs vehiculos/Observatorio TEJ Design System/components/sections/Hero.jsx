import React from 'react';
import { SearchField } from '../forms/SearchField.jsx';
import { Button } from '../forms/Button.jsx';

/**
 * Hero — the TEJ site's landing hero: brand title, a short impactful blurb, a
 * search field and up to three "Acceso sección" buttons, over the faint
 * Colombia-map watermark. Pass mapSrc to point at the watermark asset.
 */
export function Hero({
  kicker = 'Observatorio de',
  title = 'Transición Energética Justa en Colombia',
  description = 'Descripción breve, impactante del sitio. Datos abiertos sobre la transición energética y los sistemas de almacenamiento del país.',
  showSearch = true,
  accesos = ['Acceso sección 1', 'Acceso sección 2', 'Acceso sección 3'],
  mapSrc = null,
  align = 'left',
  onAccesoClick,
  children,
  ...rest
}) {
  return (
    <section style={{
      position: 'relative', overflow: 'hidden', background: 'var(--surface-alt)',
      padding: '56px 28px', fontFamily: 'var(--font-sans)',
    }} {...rest}>
      {mapSrc && (
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, right: '-4%', bottom: 0, width: '46%',
          background: `url("${mapSrc}") center right/contain no-repeat`, opacity: 0.55, pointerEvents: 'none',
        }} />
      )}
      <div style={{ position: 'relative', maxWidth: 'var(--page-max)', margin: '0 auto', textAlign: align }}>
        <div style={{ maxWidth: '640px', marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0 }}>
          {kicker && <div style={{ color: 'var(--brand-ink)', fontWeight: 800, fontSize: 'var(--fs-h3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{kicker}</div>}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-display)', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.01em', margin: '8px 0 0', lineHeight: 1.08 }}>{title}</h1>
          <p style={{ fontSize: 'var(--fs-h3)', color: 'var(--text-body)', margin: '18px 0 0', maxWidth: '540px', marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0 }}>{description}</p>
          {showSearch && <div style={{ marginTop: '24px', maxWidth: '460px', marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0 }}><SearchField placeholder="Buscar" buttonLabel="Buscar" /></div>}
          {accesos && accesos.length > 0 && (
            <div style={{ marginTop: '26px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
              {accesos.map((a, i) => (
                <Button key={i} variant={i === 0 ? 'primary' : 'secondary'} chevron onClick={() => onAccesoClick && onAccesoClick(i, a)}>{a}</Button>
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
