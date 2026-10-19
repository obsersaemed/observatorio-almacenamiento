import * as React from 'react';

/**
 * Primary action control.
 * @startingPoint section="Forms" subtitle="Teal / outline / ghost / peach buttons with optional chevron" viewport="700x150"
 */
export interface ButtonProps {
  children: React.ReactNode;
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Show a trailing chevron (the site's "Acceso sección" style). @default false */
  chevron?: boolean;
  /** Optional element rendered before the label. */
  iconLeft?: React.ReactNode;
  disabled?: boolean;
  /** Render as a different tag, e.g. "a". @default "button" */
  as?: 'button' | 'a';
}

export function Button(props: ButtonProps): JSX.Element;
