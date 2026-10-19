import React from 'react';
import { StatusLegend } from '../data/StatusLegend.jsx';

/**
 * MapPanel — the framed map region from the observatory. Renders a floating
 * title card (top-left), an "Estado" legend (bottom-right) and an attribution
 * strip over whatever map you pass as children (e.g. a Leaflet container or a
 * static map image). Use `mapSrc` to render a simple static background instead.
 */
export function MapPanel({
  title = 'Inventario de Sistemas BESS en Colombia',
  subtitle = 'Almacenamiento de energía por baterías — operadores y capacidades',
  legendItems = ['op', 'con', 'plan'],
  attribution = 'Leaflet | © OpenStreetMap contributors',
  mapSrc = null,
  height = 420,
  children,
  ...rest
}) {
  return (
    <div style={{
      position: 'relative', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)',
      background: mapSrc ? `#e8eef0 url("${mapSrc}") center/cover no-repeat` : '#e8eef0',
      fontFamily: 'var(--font-sans)',
    }} {...rest}>
      {children}
      {title && (
        <div style={{
          position: 'absolute', top: '16px', left: '16px', maxWidth: '62%',
          background: 'var(--white)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)',
          padding: '12px 16px', zIndex: 5,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-h3)', color: 'var(--text-heading)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</div>}
        </div>
      )}
      {legendItems && (
        <div style={{ position: 'absolute', bottom: '30px', right: '16px', zIndex: 5 }}>
          <StatusLegend items={legendItems} />
        </div>
      )}
      {attribution && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0, zIndex: 5,
          background: 'rgba(255,255,255,0.85)', color: 'var(--text-muted)',
          fontSize: '10px', padding: '2px 6px', borderTopLeftRadius: '4px',
        }}>{attribution}</div>
      )}
    </div>
  );
}
