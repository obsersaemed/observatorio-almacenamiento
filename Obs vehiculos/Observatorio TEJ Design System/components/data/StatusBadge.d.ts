import * as React from 'react';

export interface StatusBadgeProps {
  /** Project status key. @default "op" */
  status?: 'op' | 'con' | 'plan' | 'susp';
  /** Override the default Spanish label. */
  label?: string | null;
  /** "dot" (legend/map), "text" (table cell), "pill" (tinted). @default "dot" */
  variant?: 'dot' | 'text' | 'pill';
}

/** Project-status indicator (operación / construcción / planeado / suspendido). */
export function StatusBadge(props: StatusBadgeProps): JSX.Element;
