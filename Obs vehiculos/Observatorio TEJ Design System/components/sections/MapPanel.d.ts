import * as React from 'react';

/**
 * Framed map region with floating title card, "Estado" legend and attribution.
 * @startingPoint section="Sections" subtitle="Framed map with title card + status legend" viewport="800x420"
 */
export interface MapPanelProps {
  /** Floating title-card heading. */
  title?: string;
  subtitle?: string | null;
  /** Status keys for the "Estado" legend. @default ["op","con","plan"] */
  legendItems?: Array<'op' | 'con' | 'plan' | 'susp'>;
  /** Attribution strip text. */
  attribution?: string | null;
  /** Static map background image URL (relative to the page). */
  mapSrc?: string | null;
  /** Height in px. @default 420 */
  height?: number;
  /** The map itself — a Leaflet container, static image or marker overlay. */
  children?: React.ReactNode;
}

export function MapPanel(props: MapPanelProps): JSX.Element;
