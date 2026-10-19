import * as React from 'react';

export interface LinePoint {
  x: string;
  y: number;
}

export interface LineChartProps {
  points: LinePoint[];
  /** SVG height in px. @default 240 */
  height?: number;
  /** Line + area color. @default teal */
  color?: string;
  /** Optional rotated y-axis label. */
  yLabel?: string | null;
}

/** Single line + area chart ("Potencia nominal [MW] vs FPO"). */
export function LineChart(props: LineChartProps): JSX.Element;
