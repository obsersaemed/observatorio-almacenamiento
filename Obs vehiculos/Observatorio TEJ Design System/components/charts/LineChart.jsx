import React from 'react';

/**
 * LineChart — single line + area fill matching "Potencia nominal [MW] vs FPO".
 * points: [{ x: label, y: number }]. Teal line, markers, soft area gradient.
 */
export function LineChart({ points = [], height = 240, color = 'var(--teal-300)', yLabel = null, ...rest }) {
  const pad = { top: 20, right: 16, bottom: 40, left: 40 };
  const W = 560, H = height;
  const plotW = W - pad.left - pad.right, plotH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...points.map((p) => p.y));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = []; for (let v = 0; v <= top; v += step) ticks.push(v);
  const n = points.length;
  const x = (i) => pad.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v) => pad.top + plotH - (v / top) * plotH;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.y)}`).join(' ');
  const area = `${line} L${x(n - 1)},${pad.top + plotH} L${x(0)},${pad.top + plotH} Z`;
  const gid = 'lc' + Math.random().toString(36).slice(2, 7);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', fontFamily: 'var(--font-sans)' }} {...rest}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="var(--line-200)" strokeWidth="1" />
          <text x={pad.left - 8} y={y(v)} textAnchor="end" dominantBaseline="central" style={{ fontSize: '11px', fill: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>{v}</text>
        </g>
      ))}
      {yLabel && <text x={12} y={pad.top + plotH / 2} textAnchor="middle" transform={`rotate(-90 12 ${pad.top + plotH / 2})`} style={{ fontSize: '10px', fill: 'var(--text-muted)' }}>{yLabel}</text>}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.y)} r="4" fill="var(--white)" stroke={color} strokeWidth="2.5" />
          <text x={x(i)} y={H - pad.bottom + 16} textAnchor="middle" style={{ fontSize: '11px', fill: 'var(--text-body)' }}>{p.x}</text>
        </g>
      ))}
    </svg>
  );
}

function niceStep(max) {
  const raw = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}
