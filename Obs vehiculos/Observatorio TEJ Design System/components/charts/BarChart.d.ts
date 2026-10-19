import * as React from 'react';

export interface BarSeries {
  label: string;
  color: string;
  values: number[];
}

export interface BarChartProps {
  categories: string[];
  series: BarSeries[];
  /** SVG height in px. @default 260 */
  height?: number;
  legend?: boolean;
  /** Format the value label above each bar. */
  formatValue?: (v: number) => string | number;
}

/** Grouped vertical bar chart ("MW vs MWh por proyecto"). */
export function BarChart(props: BarChartProps): JSX.Element;
