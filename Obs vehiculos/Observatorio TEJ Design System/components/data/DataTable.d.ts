import * as React from 'react';

export interface DataColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  /** Right-align + data font for numeric columns. */
  numeric?: boolean;
  /** Render the cell value as a StatusBadge (value must be a status key). */
  status?: boolean;
}

/**
 * The observatory project-inventory table (teal header, zebra rows, status cells).
 * @startingPoint section="Data" subtitle="Project inventory table with status cells" viewport="900x320"
 */
export interface DataTableProps {
  columns: DataColumn[];
  rows: Array<Record<string, any>>;
  /** Show a leading row-number column. @default true */
  indexed?: boolean;
}

export function DataTable(props: DataTableProps): JSX.Element;
