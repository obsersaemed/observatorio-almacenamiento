import * as React from 'react';

export interface LogoProps {
  /** @default "full" */
  variant?: 'full' | 'pill' | 'mono';
  /** Set false when placing on a dark/teal background. @default true */
  onLight?: boolean;
}

/** TEJ brand wordmark (no image logo was supplied — set in Raleway). */
export function Logo(props: LogoProps): JSX.Element;
