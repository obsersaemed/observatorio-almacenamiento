import * as React from 'react';

export interface PanelProps {
  title?: string;
  subtitle?: string | null;
  /** Title alignment. @default "center" */
  align?: 'left' | 'center';
  /** Optional top-right controls. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  /** CSS padding. @default "18px 20px" */
  padding?: string;
}

/** Titled white container for charts, maps and tables. */
export function Panel(props: PanelProps): JSX.Element;
