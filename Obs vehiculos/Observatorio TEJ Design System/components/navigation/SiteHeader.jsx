import React from 'react';
import { Logo } from '../brand/Logo.jsx';
import { SocialLinks } from '../brand/SocialLinks.jsx';
import { SearchField } from '../forms/SearchField.jsx';
import { LangToggle } from './LangToggle.jsx';

const DEFAULT_NAV = [
  { label: 'Quiénes somos', dropdown: true },
  { label: 'Secciones', dropdown: true },
  { label: 'Glosario' },
  { label: 'Observatorios', dropdown: true },
  { label: 'Noticias' },
  { label: 'Contacto' },
];

/**
 * SiteHeader — the TEJ website masthead. Top band carries the stacked brand
 * lockup, social links, search and language toggle; the nav bar below lists the
 * primary sections. Composes Logo, SocialLinks, SearchField and LangToggle.
 */
export function SiteHeader({
  nav = DEFAULT_NAV,
  activeIndex = 0,
  lang = 'ES',
  onLangChange,
  onNavClick,
  ...rest
}) {
  return (
    <header style={{ fontFamily: 'var(--font-sans)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)' }} {...rest}>
      {/* top band */}
      <div style={{
        maxWidth: 'var(--page-max)', margin: '0 auto', padding: '16px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap',
      }}>
        <a href="#" style={{ textDecoration: 'none' }}><Logo variant="full" /></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <SocialLinks showLabel={false} size={17} />
          <div style={{ width: '240px' }}><SearchField placeholder="Buscar" /></div>
          <LangToggle value={lang} onChange={onLangChange} />
        </div>
      </div>
      {/* nav band */}
      <nav style={{ background: 'var(--teal-300)' }}>
        <ul style={{
          maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 28px', listStyle: 'none',
          display: 'flex', gap: '4px', alignItems: 'stretch',
        }}>
          {nav.map((item, i) => {
            const active = i === activeIndex;
            return (
              <li key={item.label}>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavClick && onNavClick(i, item); }} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '14px 16px', color: 'var(--white)', textDecoration: 'none',
                  fontWeight: active ? 800 : 600, fontSize: 'var(--fs-small)',
                  background: active ? 'rgba(255,255,255,0.16)' : 'transparent',
                  boxShadow: active ? 'inset 0 -3px 0 var(--white)' : 'none',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  {item.label}
                  {item.dropdown && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
