import * as React from 'react';

export interface StatusLegendProps {
  /** @default "Estado" */
  title?: string;
  /** Status keys to list. @default ["op","con","plan"] */
  items?: Array<'op' | 'con' | 'plan' | 'susp'>;
  /** Render as a floating white card (map overlay). @default true */
  floating?: boolean;
}

/** The map's "Estado" legend box. */
export function StatusLegend(props: StatusLegendProps): JSX.Element;
