import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';

/**
 * DataTable — the observatory's project inventory table. Light-teal header,
 * zebra rows, right-aligned numeric columns and colored status cells.
 * columns: [{ key, label, align, numeric, status }]. rows: array of objects.
 */
export function DataTable({ columns = [], rows = [], indexed = true, ...rest }) {
  const th = {
    textAlign: 'left', padding: '11px 14px', fontFamily: 'var(--font-sans)',
    fontSize: 'var(--fs-small)', fontWeight: 700, color: 'var(--ink-800)',
    background: 'var(--teal-100)', whiteSpace: 'nowrap',
  };
  const td = {
    padding: '11px 14px', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-small)',
    color: 'var(--text-body)', borderBottom: '1px solid var(--line-200)',
  };
  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }} {...rest}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '640px' }}>
        <thead>
          <tr>
            {indexed && <th style={{ ...th, width: '36px', textAlign: 'right' }}>#</th>}
            {columns.map((c) => (
              <th key={c.key} style={{ ...th, textAlign: c.align || (c.numeric ? 'right' : 'left') }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 ? 'var(--line-100)' : 'var(--white)' }}>
              {indexed && <td style={{ ...td, textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>{ri + 1}</td>}
              {columns.map((c) => (
                <td key={c.key} style={{ ...td, textAlign: c.align || (c.numeric ? 'right' : 'left'), fontFamily: c.numeric ? 'var(--font-data)' : 'var(--font-sans)', fontWeight: c.numeric ? 700 : 400 }}>
                  {c.status ? <StatusBadge status={row[c.key]} variant="text" /> : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
