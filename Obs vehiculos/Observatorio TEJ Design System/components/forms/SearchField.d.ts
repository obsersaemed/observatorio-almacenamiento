import * as React from 'react';

export interface SearchFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  /** Optional inline submit button label, e.g. "Buscar". */
  buttonLabel?: string | null;
  /** CSS width. @default "100%" */
  width?: string;
}

/** Pill-shaped search input with leading magnifier. */
export function SearchField(props: SearchFieldProps): JSX.Element;
