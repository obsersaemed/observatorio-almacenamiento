import * as React from 'react';

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutDatum[];
  /** Diameter in px. @default 190 */
  size?: number;
  /** Ring thickness in px. @default 34 */
  thickness?: number;
  /** Center text (defaults to "100%" for one segment, else total). */
  centerLabel?: string | number | null;
  /** Show the side legend. @default true */
  legend?: boolean;
}

/** SVG donut for the "Tecnología" breakdown. */
export function DonutChart(props: DonutChartProps): JSX.Element;
