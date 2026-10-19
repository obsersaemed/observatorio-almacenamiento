import * as React from 'react';

export interface SocialLinksProps {
  /** @default ["x","instagram","facebook","linkedin"] */
  networks?: Array<'x' | 'instagram' | 'facebook' | 'linkedin'>;
  /** Show the "Redes sociales" label. @default true */
  showLabel?: boolean;
  /** Set false on dark/teal backgrounds. @default true */
  onLight?: boolean;
  /** Icon size in px. @default 18 */
  size?: number;
  /** Map of network -> href. */
  links?: Record<string, string>;
}

/** Header social-media icon row (X / Instagram / Facebook / LinkedIn). */
export function SocialLinks(props: SocialLinksProps): JSX.Element;
