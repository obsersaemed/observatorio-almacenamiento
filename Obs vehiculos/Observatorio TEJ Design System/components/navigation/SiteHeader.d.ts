import * as React from 'react';

export interface NavItem {
  label: string;
  /** Show a dropdown chevron. */
  dropdown?: boolean;
}

/**
 * TEJ website masthead: brand lockup + social + search + language over a teal nav bar.
 * @startingPoint section="Navigation" subtitle="Full TEJ site header with brand, search and teal nav" viewport="1240x180"
 */
export interface SiteHeaderProps {
  /** Primary nav items. Defaults to the six TEJ sections. */
  nav?: NavItem[];
  /** Index of the active nav item. @default 0 */
  activeIndex?: number;
  /** @default "ES" */
  lang?: 'ES' | 'EN';
  onLangChange?: (lang: string) => void;
  onNavClick?: (index: number, item: NavItem) => void;
}

export function SiteHeader(props: SiteHeaderProps): JSX.Element;
