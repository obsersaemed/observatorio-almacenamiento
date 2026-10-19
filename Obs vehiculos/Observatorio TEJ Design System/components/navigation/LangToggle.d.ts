import * as React from 'react';

export interface LangToggleProps {
  /** @default "ES" */
  value?: 'ES' | 'EN';
  onChange?: (value: string) => void;
  /** Set false on teal backgrounds. @default true */
  onLight?: boolean;
}

/** ES / EN language switch. */
export function LangToggle(props: LangToggleProps): JSX.Element;
