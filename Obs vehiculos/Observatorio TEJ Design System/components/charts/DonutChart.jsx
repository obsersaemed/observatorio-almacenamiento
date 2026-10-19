import React from 'react';

const PALETTE = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];

/**
 * DonutChart — SVG donut matching the observatory's "Tecnología" chart.
 * data: [{ label, value, color? }]. Shows a centered percentage/label and a
 * side legend. A single segment renders as a full ring (e.g. 100% Li-ion).
 */
export function DonutChart({ data = [], size = 190, thickness = 34, centerLabel = null, legend = true, ...rest }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const center = centerLabel != null ? centerLabel : (data.length === 1 ? '100%' : total);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap', fontFamily: 'var(--font-sans)' }} {...rest}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: '0 0 auto' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-200)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = `${frac * c} ${c - frac * c}`;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={d.color || PALETTE[i % PALETTE.length]} strokeWidth={thickness}
              strokeDasharray={dash} strokeDashoffset={-offset * c}
              transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="butt" />
          );
          offset += frac;
          return el;
        })}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily: 'var(--font-data)', fontSize: '20px', fontWeight: 800, fill: 'var(--text-heading)' }}>{center}</text>
      </svg>
      {legend && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((d, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: 'var(--fs-small)', color: 'var(--text-body)' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: d.color || PALETTE[i % PALETTE.length] }} />
              {d.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
