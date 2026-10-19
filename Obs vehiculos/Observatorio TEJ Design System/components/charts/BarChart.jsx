import React from 'react';

/**
 * BarChart — grouped vertical bars matching "Comparación MW vs MWh por
 * proyecto". categories: string[]. series: [{ label, color, values:number[] }].
 * Value labels sit above bars; light horizontal gridlines behind.
 */
export function BarChart({ categories = [], series = [], height = 260, legend = true, formatValue = (v) => v, ...rest }) {
  const pad = { top: 24, right: 12, bottom: 46, left: 34 };
  const W = 560, H = height;
  const plotW = W - pad.left - pad.right, plotH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const groups = categories.length || 1;
  const gW = plotW / groups;
  const nSeries = series.length || 1;
  const bW = Math.min(30, (gW * 0.62) / nSeries);
  const gap = 4;
  const ticks = []; for (let v = 0; v <= top; v += step) ticks.push(v);
  const y = (v) => pad.top + plotH - (v / top) * plotH;
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }} {...rest}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="var(--line-200)" strokeWidth="1" />
            <text x={pad.left - 8} y={y(v)} textAnchor="end" dominantBaseline="central" style={{ fontSize: '11px', fill: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>{v}</text>
          </g>
        ))}
        {categories.map((cat, ci) => {
          const groupX = pad.left + ci * gW;
          const clusterW = nSeries * bW + (nSeries - 1) * gap;
          const startX = groupX + (gW - clusterW) / 2;
          return (
            <g key={ci}>
              {series.map((s, si) => {
                const v = s.values[ci] || 0;
                const bx = startX + si * (bW + gap);
                const bh = (v / top) * plotH;
                return (
                  <g key={si}>
                    <rect x={bx} y={pad.top + plotH - bh} width={bW} height={bh} rx="2" fill={s.color} />
                    <text x={bx + bW / 2} y={pad.top + plotH - bh - 6} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 700, fill: s.color, fontFamily: 'var(--font-data)' }}>{formatValue(v)}</text>
                  </g>
                );
              })}
              <text x={groupX + gW / 2} y={H - pad.bottom + 16} textAnchor="middle" style={{ fontSize: '11px', fill: 'var(--text-body)' }}>{wrapLabel(cat)}</text>
            </g>
          );
        })}
      </svg>
      {legend && (
        <div style={{ display: 'flex', gap: '18px', justifyContent: 'center', marginTop: '4px' }}>
          {series.map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: 'var(--fs-caption)', color: 'var(--text-body)' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: s.color }} />{s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function niceStep(max) {
  const raw = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}
function wrapLabel(s) {
  return s.length > 14 ? s.slice(0, 13) + '…' : s;
}
