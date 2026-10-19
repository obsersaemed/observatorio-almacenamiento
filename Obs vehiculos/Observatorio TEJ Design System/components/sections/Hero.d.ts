import * as React from 'react';

/**
 * TEJ landing hero — title, blurb, search and section-access buttons over the map watermark.
 * @startingPoint section="Sections" subtitle="Site landing hero with search + access buttons" viewport="1240x420"
 */
export interface HeroProps {
  /** Uppercase kicker above the title. @default "Observatorio de" */
  kicker?: string;
  title?: string;
  description?: string;
  /** Show the search field. @default true */
  showSearch?: boolean;
  /** Up to three section-access button labels. */
  accesos?: string[];
  /** URL to the Colombia-map watermark image (relative to the page). */
  mapSrc?: string | null;
  /** @default "left" */
  align?: 'left' | 'center';
  onAccesoClick?: (index: number, label: string) => void;
  children?: React.ReactNode;
}

export function Hero(props: HeroProps): JSX.Element;
