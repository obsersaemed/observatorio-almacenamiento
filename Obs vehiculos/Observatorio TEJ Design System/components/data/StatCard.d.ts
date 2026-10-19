import * as React from 'react';

/**
 * KPI pill for the observatory (teal fill, big numeral).
 * @startingPoint section="Data" subtitle="Teal KPI stat card with label + big numeral" viewport="360x140"
 */
export interface StatCardProps {
  /** Small caption above the number. */
  label: string;
  /** The KPI value (string keeps es-CO decimal comma, e.g. "67,0"). */
  value: string | number;
  /** Optional trailing unit. */
  unit?: string | null;
  /** @default "solid" */
  variant?: 'solid' | 'outline';
}

export function StatCard(props: StatCardProps): JSX.Element;
