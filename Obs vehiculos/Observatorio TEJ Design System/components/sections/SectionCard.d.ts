import * as React from 'react';

export interface SectionCardProps {
  title: string;
  description: string;
  /** CTA label. @default "Conoce más" */
  cta?: string;
  /** Top accent bar color. @default teal */
  accent?: string;
  onClick?: () => void;
}

/** "Acceso sección" / observatorios card with a chevron CTA. */
export function SectionCard(props: SectionCardProps): JSX.Element;
