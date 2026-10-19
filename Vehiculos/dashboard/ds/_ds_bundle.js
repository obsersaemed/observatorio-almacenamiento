/* @ds-bundle: {"format":4,"namespace":"ObservatorioTEJDesignSystem_45c7be","components":[{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"SocialLinks","sourcePath":"components/brand/SocialLinks.jsx"},{"name":"BarChart","sourcePath":"components/charts/BarChart.jsx"},{"name":"DonutChart","sourcePath":"components/charts/DonutChart.jsx"},{"name":"LineChart","sourcePath":"components/charts/LineChart.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"Panel","sourcePath":"components/data/Panel.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"STATUS","sourcePath":"components/data/StatusBadge.jsx"},{"name":"StatusBadge","sourcePath":"components/data/StatusBadge.jsx"},{"name":"StatusLegend","sourcePath":"components/data/StatusLegend.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"LangToggle","sourcePath":"components/navigation/LangToggle.jsx"},{"name":"SiteHeader","sourcePath":"components/navigation/SiteHeader.jsx"},{"name":"Hero","sourcePath":"components/sections/Hero.jsx"},{"name":"MapPanel","sourcePath":"components/sections/MapPanel.jsx"},{"name":"SectionCard","sourcePath":"components/sections/SectionCard.jsx"}],"sourceHashes":{"components/brand/Logo.jsx":"4c07f559d7f2","components/brand/SocialLinks.jsx":"3bb12c45baa3","components/charts/BarChart.jsx":"762d9644c5eb","components/charts/DonutChart.jsx":"c768aaaf4d4e","components/charts/LineChart.jsx":"e1ba60fc8eb9","components/data/DataTable.jsx":"5d97f91dc2fb","components/data/Panel.jsx":"79214e6a9230","components/data/StatCard.jsx":"7564263fe24a","components/data/StatusBadge.jsx":"dd784bcd4814","components/data/StatusLegend.jsx":"55f84153e538","components/forms/Button.jsx":"edea0aa94262","components/forms/SearchField.jsx":"40d17531ec62","components/navigation/LangToggle.jsx":"b658bffde722","components/navigation/SiteHeader.jsx":"487968784acd","components/sections/Hero.jsx":"a7194147a825","components/sections/MapPanel.jsx":"4e25498b9f8a","components/sections/SectionCard.jsx":"a067e18c3a4f","ui_kits/observatorio-bess/ObservatorioDashboard.jsx":"4656cc66c2f0","ui_kits/observatorio-bess/data.js":"26f8f758a48e","ui_kits/observatorio-ve/VEDashboard.jsx":"a98b09a1ade7","ui_kits/observatorio-ve/data.js":"08d7f6e1d0cd","ui_kits/sitio-tej/TejSite.jsx":"8c106dfcb217"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ObservatorioTEJDesignSystem_45c7be = window.ObservatorioTEJDesignSystem_45c7be || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Logo — the TEJ wordmark. No image logo was provided with the sources, so the
 * brand is set in Raleway. Variants: "full" (stacked lockup), "pill" (teal
 * badge), "mono" (short TEJ mark).
 */
function Logo({
  variant = 'full',
  onLight = true,
  ...rest
}) {
  const ink = onLight ? 'var(--ink-900)' : 'var(--white)';
  const kicker = onLight ? 'var(--brand-ink)' : 'var(--white)';
  if (variant === 'pill') {
    return /*#__PURE__*/React.createElement("span", _extends({
      style: {
        display: 'inline-block',
        background: 'var(--teal-300)',
        color: 'var(--white)',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 'var(--fs-h3)',
        letterSpacing: '0.06em',
        padding: '10px 20px',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-brand)'
      }
    }, rest), "OBSERVATORIO TEJ");
  }
  if (variant === 'mono') {
    return /*#__PURE__*/React.createElement("span", _extends({
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '32px',
        color: 'var(--brand-ink)',
        letterSpacing: '-0.02em'
      }
    }, rest), "TEJ");
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      lineHeight: 1.06,
      fontFamily: 'var(--font-display)'
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      color: kicker,
      fontWeight: 800,
      fontSize: '12px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase'
    }
  }, "Observatorio"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: ink,
      fontWeight: 800,
      fontSize: '20px',
      letterSpacing: '-0.01em',
      maxWidth: '260px'
    }
  }, "Transici\xF3n Energ\xE9tica Justa"));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/brand/SocialLinks.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ICONS = {
  x: 'M18.9 2H22l-6.9 7.9L23 22h-6.4l-5-6.6L5.8 22H2.7l7.4-8.5L2 2h6.6l4.5 6 5.8-6zm-1.1 18h1.8L7.3 3.8H5.4L17.8 20z',
  instagram: 'M12 7.2A4.8 4.8 0 1012 16.8 4.8 4.8 0 0012 7.2zm0 7.9a3.1 3.1 0 110-6.2 3.1 3.1 0 010 6.2zM17.8 7A1.1 1.1 0 1116.7 5.9 1.1 1.1 0 0117.8 7zM21 8.1c-.1-1.5-.4-2.9-1.5-4S17.4 2.6 15.9 2.5C14.3 2.4 9.7 2.4 8.1 2.5c-1.5.1-2.9.4-4 1.5S2.6 6.6 2.5 8.1c-.1 1.6-.1 6.2 0 7.8.1 1.5.4 2.9 1.5 4s2.5 1.4 4 1.5c1.6.1 6.2.1 7.8 0 1.5-.1 2.9-.4 4-1.5s1.4-2.5 1.5-4c.1-1.6.1-6.2 0-7.8zm-2 9.5a3.1 3.1 0 01-1.8 1.8c-1.2.5-4.2.4-5.6.4s-4.3.1-5.6-.4a3.1 3.1 0 01-1.8-1.8c-.5-1.2-.4-4.2-.4-5.6s-.1-4.3.4-5.6A3.1 3.1 0 016.4 4.8C7.7 4.3 10.6 4.4 12 4.4s4.3-.1 5.6.4a3.1 3.1 0 011.8 1.8c.5 1.2.4 4.2.4 5.6s.1 4.3-.4 5.6z',
  facebook: 'M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z',
  linkedin: 'M20.4 3H3.6A.6.6 0 003 3.6v16.8a.6.6 0 00.6.6h16.8a.6.6 0 00.6-.6V3.6a.6.6 0 00-.6-.6zM8.3 18.3H5.4V9.4h2.9v8.9zM6.9 8.2a1.7 1.7 0 110-3.4 1.7 1.7 0 010 3.4zm11.4 10.1h-2.9v-4.3c0-1 0-2.4-1.4-2.4s-1.7 1.1-1.7 2.3v4.4H9.4V9.4h2.8v1.2h.1a3 3 0 012.7-1.5c2.9 0 3.4 1.9 3.4 4.4v4.8z'
};

/**
 * SocialLinks — the header's "Redes sociales: X / Instagram / FB / LinkedIn" row.
 * Renders inline icon links. Pass onLight={false} on teal backgrounds.
 */
function SocialLinks({
  networks = ['x', 'instagram', 'facebook', 'linkedin'],
  showLabel = true,
  onLight = true,
  size = 18,
  links = {},
  ...rest
}) {
  const color = onLight ? 'var(--ink-700)' : 'var(--white)';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      fontFamily: 'var(--font-sans)'
    }
  }, rest), showLabel && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color,
      fontWeight: 600
    }
  }, "Redes sociales"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, networks.map(n => /*#__PURE__*/React.createElement("a", {
    key: n,
    href: links[n] || '#',
    "aria-label": n,
    style: {
      color,
      display: 'inline-flex',
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: ICONS[n]
  }))))));
}
Object.assign(__ds_scope, { SocialLinks });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/SocialLinks.jsx", error: String((e && e.message) || e) }); }

// components/charts/BarChart.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BarChart — grouped vertical bars matching "Comparación MW vs MWh por
 * proyecto". categories: string[]. series: [{ label, color, values:number[] }].
 * Value labels sit above bars; light horizontal gridlines behind.
 */
function BarChart({
  categories = [],
  series = [],
  height = 260,
  legend = true,
  formatValue = v => v,
  ...rest
}) {
  const pad = {
    top: 24,
    right: 12,
    bottom: 46,
    left: 34
  };
  const W = 560,
    H = height;
  const plotW = W - pad.left - pad.right,
    plotH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...series.flatMap(s => s.values));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const groups = categories.length || 1;
  const gW = plotW / groups;
  const nSeries = series.length || 1;
  const bW = Math.min(30, gW * 0.62 / nSeries);
  const gap = 4;
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  const y = v => pad.top + plotH - v / top * plotH;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      fontFamily: 'var(--font-sans)'
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    width: "100%",
    style: {
      display: 'block'
    }
  }, ticks.map((v, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("line", {
    x1: pad.left,
    x2: W - pad.right,
    y1: y(v),
    y2: y(v),
    stroke: "var(--line-200)",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("text", {
    x: pad.left - 8,
    y: y(v),
    textAnchor: "end",
    dominantBaseline: "central",
    style: {
      fontSize: '11px',
      fill: 'var(--text-muted)',
      fontFamily: 'var(--font-data)'
    }
  }, v))), categories.map((cat, ci) => {
    const groupX = pad.left + ci * gW;
    const clusterW = nSeries * bW + (nSeries - 1) * gap;
    const startX = groupX + (gW - clusterW) / 2;
    return /*#__PURE__*/React.createElement("g", {
      key: ci
    }, series.map((s, si) => {
      const v = s.values[ci] || 0;
      const bx = startX + si * (bW + gap);
      const bh = v / top * plotH;
      return /*#__PURE__*/React.createElement("g", {
        key: si
      }, /*#__PURE__*/React.createElement("rect", {
        x: bx,
        y: pad.top + plotH - bh,
        width: bW,
        height: bh,
        rx: "2",
        fill: s.color
      }), /*#__PURE__*/React.createElement("text", {
        x: bx + bW / 2,
        y: pad.top + plotH - bh - 6,
        textAnchor: "middle",
        style: {
          fontSize: '11px',
          fontWeight: 700,
          fill: s.color,
          fontFamily: 'var(--font-data)'
        }
      }, formatValue(v)));
    }), /*#__PURE__*/React.createElement("text", {
      x: groupX + gW / 2,
      y: H - pad.bottom + 16,
      textAnchor: "middle",
      style: {
        fontSize: '11px',
        fill: 'var(--text-body)'
      }
    }, wrapLabel(cat)));
  })), legend && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '18px',
      justifyContent: 'center',
      marginTop: '4px'
    }
  }, series.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '12px',
      height: '12px',
      borderRadius: '2px',
      background: s.color
    }
  }), s.label))));
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
Object.assign(__ds_scope, { BarChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/BarChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/DonutChart.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PALETTE = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];

/**
 * DonutChart — SVG donut matching the observatory's "Tecnología" chart.
 * data: [{ label, value, color? }]. Shows a centered percentage/label and a
 * side legend. A single segment renders as a full ring (e.g. 100% Li-ion).
 */
function DonutChart({
  data = [],
  size = 190,
  thickness = 34,
  centerLabel = null,
  legend = true,
  ...rest
}) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const center = centerLabel != null ? centerLabel : data.length === 1 ? '100%' : total;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '22px',
      flexWrap: 'wrap',
      fontFamily: 'var(--font-sans)'
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: {
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--line-200)",
    strokeWidth: thickness
  }), data.map((d, i) => {
    const frac = d.value / total;
    const dash = `${frac * c} ${c - frac * c}`;
    const el = /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: size / 2,
      cy: size / 2,
      r: r,
      fill: "none",
      stroke: d.color || PALETTE[i % PALETTE.length],
      strokeWidth: thickness,
      strokeDasharray: dash,
      strokeDashoffset: -offset * c,
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
      strokeLinecap: "butt"
    });
    offset += frac;
    return el;
  }), /*#__PURE__*/React.createElement("text", {
    x: "50%",
    y: "50%",
    textAnchor: "middle",
    dominantBaseline: "central",
    style: {
      fontFamily: 'var(--font-data)',
      fontSize: '20px',
      fontWeight: 800,
      fill: 'var(--text-heading)'
    }
  }, center)), legend && /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '9px',
      fontSize: 'var(--fs-small)',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '11px',
      height: '11px',
      borderRadius: '50%',
      background: d.color || PALETTE[i % PALETTE.length]
    }
  }), d.label))));
}
Object.assign(__ds_scope, { DonutChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/DonutChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/LineChart.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * LineChart — single line + area fill matching "Potencia nominal [MW] vs FPO".
 * points: [{ x: label, y: number }]. Teal line, markers, soft area gradient.
 */
function LineChart({
  points = [],
  height = 240,
  color = 'var(--teal-300)',
  yLabel = null,
  ...rest
}) {
  const pad = {
    top: 20,
    right: 16,
    bottom: 40,
    left: 40
  };
  const W = 560,
    H = height;
  const plotW = W - pad.left - pad.right,
    plotH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...points.map(p => p.y));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  const n = points.length;
  const x = i => pad.left + (n <= 1 ? plotW / 2 : i / (n - 1) * plotW);
  const y = v => pad.top + plotH - v / top * plotH;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.y)}`).join(' ');
  const area = `${line} L${x(n - 1)},${pad.top + plotH} L${x(0)},${pad.top + plotH} Z`;
  const gid = 'lc' + Math.random().toString(36).slice(2, 7);
  return /*#__PURE__*/React.createElement("svg", _extends({
    viewBox: `0 0 ${W} ${H}`,
    width: "100%",
    style: {
      display: 'block',
      fontFamily: 'var(--font-sans)'
    }
  }, rest), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.28"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), ticks.map((v, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("line", {
    x1: pad.left,
    x2: W - pad.right,
    y1: y(v),
    y2: y(v),
    stroke: "var(--line-200)",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("text", {
    x: pad.left - 8,
    y: y(v),
    textAnchor: "end",
    dominantBaseline: "central",
    style: {
      fontSize: '11px',
      fill: 'var(--text-muted)',
      fontFamily: 'var(--font-data)'
    }
  }, v))), yLabel && /*#__PURE__*/React.createElement("text", {
    x: 12,
    y: pad.top + plotH / 2,
    textAnchor: "middle",
    transform: `rotate(-90 12 ${pad.top + plotH / 2})`,
    style: {
      fontSize: '10px',
      fill: 'var(--text-muted)'
    }
  }, yLabel), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: `url(#${gid})`
  }), /*#__PURE__*/React.createElement("path", {
    d: line,
    fill: "none",
    stroke: color,
    strokeWidth: "2.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }), points.map((p, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("circle", {
    cx: x(i),
    cy: y(p.y),
    r: "4",
    fill: "var(--white)",
    stroke: color,
    strokeWidth: "2.5"
  }), /*#__PURE__*/React.createElement("text", {
    x: x(i),
    y: H - pad.bottom + 16,
    textAnchor: "middle",
    style: {
      fontSize: '11px',
      fill: 'var(--text-body)'
    }
  }, p.x))));
}
function niceStep(max) {
  const raw = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}
Object.assign(__ds_scope, { LineChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/LineChart.jsx", error: String((e && e.message) || e) }); }

// components/data/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Panel — titled white container that wraps a chart, map or table on the
 * observatory. Centered bold title (optional subtitle), soft card shadow.
 */
function Panel({
  title,
  subtitle = null,
  align = 'center',
  actions = null,
  children,
  padding = '18px 20px',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      padding,
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      minWidth: 0
    }
  }, rest), (title || actions) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align,
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-h3)',
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: 'var(--fs-small)',
      color: 'var(--text-muted)'
    }
  }, subtitle)), actions), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Panel.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatCard — a KPI pill from the observatory. Teal fill, white label + big
 * numeral. Set variant="outline" for a white card with teal numeral.
 */
function StatCard({
  label,
  value,
  unit = null,
  variant = 'solid',
  ...rest
}) {
  const solid = variant === 'solid';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      background: solid ? 'var(--teal-300)' : 'var(--white)',
      color: solid ? 'var(--white)' : 'var(--text-body)',
      boxShadow: solid ? 'var(--shadow-brand)' : 'var(--shadow-card)',
      border: solid ? 'none' : '1px solid var(--border-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      minWidth: 0
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-caption)',
      fontWeight: 600,
      letterSpacing: 'var(--ls-caps)',
      opacity: solid ? 0.95 : 0.75
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '6px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-data)',
      fontSize: 'var(--fs-kpi)',
      fontWeight: 800,
      lineHeight: 1,
      color: solid ? 'var(--white)' : 'var(--brand-ink)'
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-small)',
      fontWeight: 600,
      opacity: 0.9
    }
  }, unit)));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/data/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const STATUS = {
  op: {
    label: 'En operación',
    color: 'var(--status-op)'
  },
  con: {
    label: 'En construcción',
    color: 'var(--status-con)'
  },
  plan: {
    label: 'Planeado / otro',
    color: 'var(--status-plan)'
  },
  susp: {
    label: 'Suspendido',
    color: 'var(--status-susp)'
  }
};

/**
 * StatusBadge — project-status indicator. "dot" = colored dot + label (legend
 * / map style); "text" = colored label only (table cell style); "pill" = soft
 * tinted pill.
 */
function StatusBadge({
  status = 'op',
  label = null,
  variant = 'dot',
  ...rest
}) {
  const s = STATUS[status] || STATUS.op;
  const text = label || s.label;
  if (variant === 'text') {
    return /*#__PURE__*/React.createElement("span", _extends({
      style: {
        color: s.color,
        fontWeight: 700,
        fontSize: 'var(--fs-small)',
        fontFamily: 'var(--font-sans)'
      }
    }, rest), text);
  }
  if (variant === 'pill') {
    return /*#__PURE__*/React.createElement("span", _extends({
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-caption)',
        fontWeight: 700,
        color: s.color,
        background: 'color-mix(in srgb, currentColor 12%, white)',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)'
      }
    }, rest), /*#__PURE__*/React.createElement("span", {
      style: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: s.color
      }
    }), text);
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-small)',
      color: 'var(--text-body)'
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: '11px',
      height: '11px',
      borderRadius: '50%',
      background: s.color,
      flex: '0 0 auto'
    }
  }), text);
}
Object.assign(__ds_scope, { STATUS, StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * DataTable — the observatory's project inventory table. Light-teal header,
 * zebra rows, right-aligned numeric columns and colored status cells.
 * columns: [{ key, label, align, numeric, status }]. rows: array of objects.
 */
function DataTable({
  columns = [],
  rows = [],
  indexed = true,
  ...rest
}) {
  const th = {
    textAlign: 'left',
    padding: '11px 14px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--fs-small)',
    fontWeight: 700,
    color: 'var(--ink-800)',
    background: 'var(--teal-100)',
    whiteSpace: 'nowrap'
  };
  const td = {
    padding: '11px 14px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--fs-small)',
    color: 'var(--text-body)',
    borderBottom: '1px solid var(--line-200)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      overflowX: 'auto',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-card)'
    }
  }, rest), /*#__PURE__*/React.createElement("table", {
    style: {
      borderCollapse: 'collapse',
      width: '100%',
      minWidth: '640px'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, indexed && /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      width: '36px',
      textAlign: 'right'
    }
  }, "#"), columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      ...th,
      textAlign: c.align || (c.numeric ? 'right' : 'left')
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri,
    style: {
      background: ri % 2 ? 'var(--line-100)' : 'var(--white)'
    }
  }, indexed && /*#__PURE__*/React.createElement("td", {
    style: {
      ...td,
      textAlign: 'right',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-data)'
    }
  }, ri + 1), columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      ...td,
      textAlign: c.align || (c.numeric ? 'right' : 'left'),
      fontFamily: c.numeric ? 'var(--font-data)' : 'var(--font-sans)',
      fontWeight: c.numeric ? 700 : 400
    }
  }, c.status ? /*#__PURE__*/React.createElement(__ds_scope.StatusBadge, {
    status: row[c.key],
    variant: "text"
  }) : row[c.key])))))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/StatusLegend.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatusLegend — the map's "Estado" legend box. Lists the project statuses with
 * colored dots. Floating variant adds the white rounded card + shadow.
 */
function StatusLegend({
  title = 'Estado',
  items = ['op', 'con', 'plan'],
  floating = true,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      fontFamily: 'var(--font-sans)',
      background: floating ? 'var(--white)' : 'transparent',
      border: floating ? '1px solid var(--border-card)' : 'none',
      borderRadius: 'var(--radius-md)',
      boxShadow: floating ? 'var(--shadow-card)' : 'none',
      padding: floating ? '12px 16px' : 0,
      display: 'inline-flex',
      flexDirection: 'column',
      gap: '9px'
    }
  }, rest), title && /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 'var(--fs-small)',
      color: 'var(--text-heading)'
    }
  }, title), items.map(k => /*#__PURE__*/React.createElement(__ds_scope.StatusBadge, {
    key: k,
    status: k,
    variant: "dot"
  })));
}
Object.assign(__ds_scope, { StatusLegend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatusLegend.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — primary action control for the TEJ site & observatory.
 * Variants: primary (teal fill), secondary (teal outline), ghost (text),
 * accent (warm peach). Sizes sm | md | lg. Optional trailing chevron for
 * the "Acceso sección" style links from the site wireframe.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  chevron = false,
  iconLeft = null,
  disabled = false,
  as = 'button',
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 14px',
      font: 'var(--fs-small)',
      radius: 'var(--radius-md)'
    },
    md: {
      padding: '11px 20px',
      font: 'var(--fs-body)',
      radius: 'var(--radius-md)'
    },
    lg: {
      padding: '15px 28px',
      font: 'var(--fs-h3)',
      radius: 'var(--radius-lg)'
    }
  };
  const variants = {
    primary: {
      background: 'var(--teal-300)',
      color: 'var(--white)',
      border: '1px solid var(--teal-300)',
      boxShadow: 'var(--shadow-sm)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--brand-ink)',
      border: '1.5px solid var(--teal-300)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--brand-ink)',
      border: '1px solid transparent'
    },
    accent: {
      background: 'var(--peach-300)',
      color: 'var(--ink-900)',
      border: '1px solid var(--peach-300)',
      boxShadow: 'var(--shadow-sm)'
    }
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    fontSize: s.font,
    lineHeight: 1,
    padding: s.padding,
    borderRadius: s.radius,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'filter .15s ease, transform .05s ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...v
  };
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: style,
    disabled: as === 'button' ? disabled : undefined,
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'translateY(1px)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'translateY(0)';
    },
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.filter = 'brightness(0.94)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.filter = 'none';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  }, rest), iconLeft, /*#__PURE__*/React.createElement("span", null, children), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M9 6l6 6-6 6",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SearchField — rounded search input matching the site's "Buscar" control.
 * Pill-shaped with a leading magnifier glyph and optional inline button.
 */
function SearchField({
  placeholder = 'Buscar',
  value,
  onChange,
  onSubmit,
  buttonLabel = null,
  width = '100%',
  ...rest
}) {
  return /*#__PURE__*/React.createElement("form", _extends({
    onSubmit: e => {
      e.preventDefault();
      onSubmit && onSubmit();
    },
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      width,
      background: 'var(--white)',
      border: '1.5px solid var(--line-300)',
      borderRadius: 'var(--radius-pill)',
      padding: '9px 9px 9px 16px',
      boxShadow: 'var(--shadow-sm)'
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    style: {
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7",
    stroke: "var(--ink-500)",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M20 20l-3.2-3.2",
    stroke: "var(--ink-500)",
    strokeWidth: "2",
    strokeLinecap: "round"
  })), /*#__PURE__*/React.createElement("input", {
    type: "search",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange && onChange(e.target.value),
    style: {
      flex: '1 1 auto',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-body)',
      minWidth: 0
    }
  }), buttonLabel && /*#__PURE__*/React.createElement("button", {
    type: "submit",
    style: {
      border: 'none',
      cursor: 'pointer',
      background: 'var(--teal-300)',
      color: 'var(--white)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 'var(--fs-small)',
      padding: '8px 18px',
      borderRadius: 'var(--radius-pill)'
    }
  }, buttonLabel));
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/LangToggle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * LangToggle — ES / EN language switch. The source used a small flag button;
 * this is a text toggle for editability. Controlled via value/onChange.
 */
function LangToggle({
  value = 'ES',
  onChange,
  onLight = true,
  ...rest
}) {
  const options = ['ES', 'EN'];
  const base = onLight ? 'var(--ink-500)' : 'rgba(255,255,255,0.7)';
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "group",
    "aria-label": "Idioma",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
      border: `1px solid ${onLight ? 'var(--line-300)' : 'rgba(255,255,255,0.5)'}`,
      borderRadius: 'var(--radius-pill)',
      padding: '3px',
      fontFamily: 'var(--font-sans)'
    }
  }, rest), options.map(o => {
    const active = o === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o,
      type: "button",
      onClick: () => onChange && onChange(o),
      style: {
        border: 'none',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 'var(--fs-caption)',
        padding: '4px 11px',
        borderRadius: 'var(--radius-pill)',
        background: active ? 'var(--teal-300)' : 'transparent',
        color: active ? 'var(--white)' : base
      }
    }, o);
  }));
}
Object.assign(__ds_scope, { LangToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/LangToggle.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SiteHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DEFAULT_NAV = [{
  label: 'Quiénes somos',
  dropdown: true
}, {
  label: 'Secciones',
  dropdown: true
}, {
  label: 'Glosario'
}, {
  label: 'Observatorios',
  dropdown: true
}, {
  label: 'Noticias'
}, {
  label: 'Contacto'
}];

/**
 * SiteHeader — the TEJ website masthead. Top band carries the stacked brand
 * lockup, social links, search and language toggle; the nav bar below lists the
 * primary sections. Composes Logo, SocialLinks, SearchField and LangToggle.
 */
function SiteHeader({
  nav = DEFAULT_NAV,
  activeIndex = 0,
  lang = 'ES',
  onLangChange,
  onNavClick,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      fontFamily: 'var(--font-sans)',
      background: 'var(--white)',
      boxShadow: 'var(--shadow-sm)'
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--page-max)',
      margin: '0 auto',
      padding: '16px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '24px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Logo, {
    variant: "full"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '18px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SocialLinks, {
    showLabel: false,
    size: 17
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '240px'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SearchField, {
    placeholder: "Buscar"
  })), /*#__PURE__*/React.createElement(__ds_scope.LangToggle, {
    value: lang,
    onChange: onLangChange
  }))), /*#__PURE__*/React.createElement("nav", {
    style: {
      background: 'var(--teal-300)'
    }
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      maxWidth: 'var(--page-max)',
      margin: '0 auto',
      padding: '0 28px',
      listStyle: 'none',
      display: 'flex',
      gap: '4px',
      alignItems: 'stretch'
    }
  }, nav.map((item, i) => {
    const active = i === activeIndex;
    return /*#__PURE__*/React.createElement("li", {
      key: item.label
    }, /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => {
        e.preventDefault();
        onNavClick && onNavClick(i, item);
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '14px 16px',
        color: 'var(--white)',
        textDecoration: 'none',
        fontWeight: active ? 800 : 600,
        fontSize: 'var(--fs-small)',
        background: active ? 'rgba(255,255,255,0.16)' : 'transparent',
        boxShadow: active ? 'inset 0 -3px 0 var(--white)' : 'none'
      },
      onMouseEnter: e => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
      },
      onMouseLeave: e => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }
    }, item.label, item.dropdown && /*#__PURE__*/React.createElement("svg", {
      width: "11",
      height: "11",
      viewBox: "0 0 24 24",
      fill: "none",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M6 9l6 6 6-6",
      stroke: "currentColor",
      strokeWidth: "2.6",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))));
  }))));
}
Object.assign(__ds_scope, { SiteHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SiteHeader.jsx", error: String((e && e.message) || e) }); }

// components/sections/Hero.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Hero — the TEJ site's landing hero: brand title, a short impactful blurb, a
 * search field and up to three "Acceso sección" buttons, over the faint
 * Colombia-map watermark. Pass mapSrc to point at the watermark asset.
 */
function Hero({
  kicker = 'Observatorio de',
  title = 'Transición Energética Justa en Colombia',
  description = 'Descripción breve, impactante del sitio. Datos abiertos sobre la transición energética y los sistemas de almacenamiento del país.',
  showSearch = true,
  accesos = ['Acceso sección 1', 'Acceso sección 2', 'Acceso sección 3'],
  mapSrc = null,
  align = 'left',
  onAccesoClick,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--surface-alt)',
      padding: '56px 28px',
      fontFamily: 'var(--font-sans)'
    }
  }, rest), mapSrc && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 0,
      right: '-4%',
      bottom: 0,
      width: '46%',
      background: `url("${mapSrc}") center right/contain no-repeat`,
      opacity: 0.55,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 'var(--page-max)',
      margin: '0 auto',
      textAlign: align
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '640px',
      marginLeft: align === 'center' ? 'auto' : 0,
      marginRight: align === 'center' ? 'auto' : 0
    }
  }, kicker && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--brand-ink)',
      fontWeight: 800,
      fontSize: 'var(--fs-h3)',
      letterSpacing: '0.14em',
      textTransform: 'uppercase'
    }
  }, kicker), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-display)',
      fontWeight: 800,
      color: 'var(--text-heading)',
      letterSpacing: '-0.01em',
      margin: '8px 0 0',
      lineHeight: 1.08
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-h3)',
      color: 'var(--text-body)',
      margin: '18px 0 0',
      maxWidth: '540px',
      marginLeft: align === 'center' ? 'auto' : 0,
      marginRight: align === 'center' ? 'auto' : 0
    }
  }, description), showSearch && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '24px',
      maxWidth: '460px',
      marginLeft: align === 'center' ? 'auto' : 0,
      marginRight: align === 'center' ? 'auto' : 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SearchField, {
    placeholder: "Buscar",
    buttonLabel: "Buscar"
  })), accesos && accesos.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '26px',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      justifyContent: align === 'center' ? 'center' : 'flex-start'
    }
  }, accesos.map((a, i) => /*#__PURE__*/React.createElement(__ds_scope.Button, {
    key: i,
    variant: i === 0 ? 'primary' : 'secondary',
    chevron: true,
    onClick: () => onAccesoClick && onAccesoClick(i, a)
  }, a))), children)));
}
Object.assign(__ds_scope, { Hero });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/sections/Hero.jsx", error: String((e && e.message) || e) }); }

// components/sections/MapPanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * MapPanel — the framed map region from the observatory. Renders a floating
 * title card (top-left), an "Estado" legend (bottom-right) and an attribution
 * strip over whatever map you pass as children (e.g. a Leaflet container or a
 * static map image). Use `mapSrc` to render a simple static background instead.
 */
function MapPanel({
  title = 'Inventario de Sistemas BESS en Colombia',
  subtitle = 'Almacenamiento de energía por baterías — operadores y capacidades',
  legendItems = ['op', 'con', 'plan'],
  attribution = 'Leaflet | © OpenStreetMap contributors',
  mapSrc = null,
  height = 420,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      height,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border-card)',
      boxShadow: 'var(--shadow-card)',
      background: mapSrc ? `#e8eef0 url("${mapSrc}") center/cover no-repeat` : '#e8eef0',
      fontFamily: 'var(--font-sans)'
    }
  }, rest), children, title && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '16px',
      left: '16px',
      maxWidth: '62%',
      background: 'var(--white)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-card)',
      padding: '12px 16px',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 'var(--fs-h3)',
      color: 'var(--text-heading)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-muted)',
      marginTop: '2px'
    }
  }, subtitle)), legendItems && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: '30px',
      right: '16px',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.StatusLegend, {
    items: legendItems
  })), attribution && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      zIndex: 5,
      background: 'rgba(255,255,255,0.85)',
      color: 'var(--text-muted)',
      fontSize: '10px',
      padding: '2px 6px',
      borderTopLeftRadius: '4px'
    }
  }, attribution));
}
Object.assign(__ds_scope, { MapPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/sections/MapPanel.jsx", error: String((e && e.message) || e) }); }

// components/sections/SectionCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * SectionCard — an "Acceso sección" / "Observatorios" card: heading, short
 * description and a chevron CTA. Optional accent tab in a brand color.
 */
function SectionCard({
  title,
  description,
  cta = 'Conoce más',
  accent = 'var(--teal-300)',
  onClick,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("article", _extends({
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '6px',
      background: accent
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-h2)',
      fontWeight: 700,
      color: 'var(--text-heading)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-body)',
      color: 'var(--text-body)',
      margin: 0,
      flex: 1
    }
  }, description), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '6px'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    chevron: true,
    onClick: onClick,
    style: {
      padding: '4px 0'
    }
  }, cta))));
}
Object.assign(__ds_scope, { SectionCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/sections/SectionCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/observatorio-bess/ObservatorioDashboard.jsx
try { (() => {
/* ObservatorioDashboard — the BESS storage observatory, laid out under the TEJ
   site chrome. Composes design-system components + a real Leaflet map.
   Exposes window.ObservatorioDashboard. */
const NS = window.ObservatorioTEJDesignSystem_45c7be;
const {
  SiteHeader,
  Hero,
  StatCard,
  Panel,
  BarChart,
  DonutChart,
  LineChart,
  DataTable,
  MapPanel,
  SocialLinks,
  Logo
} = NS;
const DATA = window.BESS_DATA;
function useLeaflet(mapRef, selected, setSelected) {
  React.useEffect(() => {
    if (!window.L || !mapRef.current || mapRef.current._map) return;
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      attributionControl: false
    }).setView([4.6, -74.0], 5.4);
    mapRef.current._map = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);
    const markers = {};
    DATA.projects.forEach(p => {
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 9,
        color: '#fff',
        weight: 2,
        fillColor: DATA.statusColor[p.estado],
        fillOpacity: 1
      }).addTo(map);
      m.bindPopup(`<strong>${p.nombre}</strong><br>${p.operador} · ${p.municipio}<br>${p.mw} MW · ${p.cap} MWh`);
      m.on('click', () => setSelected(p.nombre));
      markers[p.nombre] = m;
    });
    mapRef.current._markers = markers;
    setTimeout(() => map.invalidateSize(), 200);
  }, []);
  React.useEffect(() => {
    const map = mapRef.current && mapRef.current._map;
    const markers = mapRef.current && mapRef.current._markers;
    if (!map || !markers || !selected) return;
    const p = DATA.projects.find(x => x.nombre === selected);
    if (p) {
      map.flyTo([p.lat, p.lng], 8, {
        duration: 0.8
      });
      markers[selected].openPopup();
    }
  }, [selected]);
}
function ObservatorioDashboard() {
  const [selected, setSelected] = React.useState(null);
  const mapRef = React.useRef(null);
  useLeaflet(mapRef, selected, setSelected);
  const wrap = {
    maxWidth: 'var(--page-max)',
    margin: '0 auto',
    padding: '0 28px'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-page)',
      minHeight: '100vh'
    }
  }, /*#__PURE__*/React.createElement(SiteHeader, {
    activeIndex: 3,
    nav: [{
      label: 'Quiénes somos',
      dropdown: true
    }, {
      label: 'Secciones',
      dropdown: true
    }, {
      label: 'Glosario'
    }, {
      label: 'Observatorios',
      dropdown: true
    }, {
      label: 'Noticias'
    }, {
      label: 'Contacto'
    }]
  }), /*#__PURE__*/React.createElement(Hero, {
    kicker: "Observatorio \xB7 Almacenamiento",
    title: "Sistemas de almacenamiento de energ\xEDa en Colombia",
    description: "Inventario de sistemas BESS (bater\xEDas): operadores, tecnolog\xEDas, potencias y capacidades instaladas, con seguimiento del estado de cada proyecto.",
    showSearch: false,
    accesos: ['Ver el mapa', 'Estadísticas', 'Metodología'],
    mapSrc: "../../assets/colombia-map-watermark.png"
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      ...wrap,
      padding: '28px 28px 64px',
      display: 'flex',
      flexDirection: 'column',
      gap: '22px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
      gap: '16px'
    }
  }, DATA.kpis.map((k, i) => /*#__PURE__*/React.createElement(StatCard, {
    key: i,
    label: k.label,
    value: k.value,
    variant: i < 3 ? 'solid' : 'outline'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1.9fr) minmax(0,1fr)',
      gap: '22px',
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement(MapPanel, {
    height: 460,
    title: "Inventario de Sistemas BESS en Colombia",
    subtitle: "Almacenamiento por bater\xEDas \u2014 operadores y capacidades",
    legendItems: ['op', 'con', 'susp']
  }, /*#__PURE__*/React.createElement("div", {
    ref: mapRef,
    style: {
      position: 'absolute',
      inset: 0
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '22px'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Tecnolog\xEDa"
  }, /*#__PURE__*/React.createElement(DonutChart, {
    data: [{
      label: 'Li-ion',
      value: 100
    }]
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "Estado de proyectos",
    align: "left"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }
  }, [['op', '3 en operación'], ['susp', '1 suspendido']].map(([s, t]) => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: DATA.statusColor[s]
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body)',
      color: 'var(--text-body)'
    }
  }, t))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
      gap: '22px'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Comparaci\xF3n MW vs MWh por proyecto"
  }, /*#__PURE__*/React.createElement(BarChart, {
    categories: DATA.projects.map(p => p.nombre),
    series: [{
      label: 'Potencia nominal [MW]',
      color: 'var(--series-1)',
      values: DATA.projects.map(p => parseFloat(p.mw.replace(',', '.')))
    }, {
      label: 'Capacidad máxima [MWh]',
      color: 'var(--series-2)',
      values: DATA.projects.map(p => parseFloat(p.cap.replace(',', '.')))
    }]
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "Potencia nominal [MW] vs FPO"
  }, /*#__PURE__*/React.createElement(LineChart, {
    yLabel: "Potencia nominal [MW]",
    points: [...DATA.projects].sort((a, b) => a.fpo - b.fpo).map(p => ({
      x: p.fpo,
      y: parseFloat(p.mw.replace(',', '.'))
    }))
  }))), /*#__PURE__*/React.createElement(Panel, {
    title: "Inventario de proyectos",
    subtitle: "Haz clic en una fila para ubicar el proyecto en el mapa",
    align: "left"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const idx = [...tr.parentNode.children].indexOf(tr);
      const p = DATA.projects[idx];
      if (p) setSelected(p.nombre);
    }
  }, /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'nombre',
      label: 'Nombre'
    }, {
      key: 'operador',
      label: 'Operador'
    }, {
      key: 'estado',
      label: 'Estado',
      status: true
    }, {
      key: 'fpo',
      label: 'FPO'
    }, {
      key: 'dpto',
      label: 'Departamento'
    }, {
      key: 'municipio',
      label: 'Municipio'
    }, {
      key: 'tec',
      label: 'Tecnología'
    }, {
      key: 'cap',
      label: 'Cap. [MWh]',
      numeric: true
    }, {
      key: 'mw',
      label: 'Pot. [MW]',
      numeric: true
    }],
    rows: DATA.projects
  })))), /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--teal-600)',
      color: '#fff',
      padding: '28px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "full",
    onLight: false
  }), /*#__PURE__*/React.createElement(SocialLinks, {
    onLight: false,
    showLabel: false
  }))));
}
window.ObservatorioDashboard = ObservatorioDashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/observatorio-bess/ObservatorioDashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/observatorio-bess/data.js
try { (() => {
/* Observatorio BESS — sample data (4 real projects from the source dashboard). */
window.BESS_DATA = {
  kpis: [{
    label: 'Potencia total instalada [MW]',
    value: '67,0'
  }, {
    label: 'Capacidad total [MWh]',
    value: '57,8'
  }, {
    label: 'Proyectos en operación',
    value: '3'
  }, {
    label: 'Proyectos registrados',
    value: '4'
  }],
  projects: [{
    nombre: 'Canadian solar',
    operador: 'Air-e',
    estado: 'susp',
    fpo: '2019',
    dpto: 'Atlántico',
    municipio: 'Barranquilla',
    tec: 'Li-ion',
    cap: '45',
    mw: '50',
    lat: 10.9685,
    lng: -74.7813
  }, {
    nombre: 'La Martina',
    operador: 'Erco',
    estado: 'op',
    fpo: '2025',
    dpto: 'Cundinamarca',
    municipio: 'Paratebueno',
    tec: 'Li-ion',
    cap: '6,9',
    mw: '9',
    lat: 4.3766,
    lng: -73.2064
  }, {
    nombre: 'BESS Termozipa',
    operador: 'Enel-Emgesa',
    estado: 'op',
    fpo: '2021',
    dpto: 'Cundinamarca',
    municipio: 'Tocancipá',
    tec: 'Li-ion',
    cap: '3,9',
    mw: '7',
    lat: 4.9066,
    lng: -73.9116
  }, {
    nombre: 'Celsia Solar Palmira 2',
    operador: 'Celsia',
    estado: 'op',
    fpo: '2024',
    dpto: 'Valle del Cauca',
    municipio: 'Palmira',
    tec: 'Li-ion',
    cap: '2',
    mw: '1',
    lat: 3.5394,
    lng: -76.3036
  }],
  statusColor: {
    op: '#2e9b4e',
    con: '#ef9f2e',
    plan: '#9aa0a6',
    susp: '#e2413a'
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/observatorio-bess/data.js", error: String((e && e.message) || e) }); }

// ui_kits/observatorio-ve/VEDashboard.jsx
try { (() => {
/* VEDashboard — energy storage in electric vehicles. Same chrome, tokens and
   components as the BESS observatory. Exposes window.VEDashboard. */
const VNS = window.ObservatorioTEJDesignSystem_45c7be;
const {
  SiteHeader,
  Hero,
  StatCard,
  Panel,
  DonutChart,
  BarChart,
  SocialLinks,
  Logo
} = VNS;
const VE = window.VE_DATA;
const YEARS = [{
  key: 2024,
  color: 'var(--purple-200)'
}, {
  key: 2025,
  color: 'var(--series-1)'
}, {
  key: 2026,
  color: 'var(--peach-300)'
}];
const GRAYS = ['#33383b', '#4a5155', '#5c6367', '#6b7276', '#7f868a', '#8b9296', '#a6adb1', '#bcc2c5', '#cdd2d4', '#e4e7e8'];
const fmtMil = n => n >= 1e6 ? (n / 1e6).toLocaleString('es-CO', {
  maximumFractionDigits: 1
}) + ' M' : n >= 1000 ? (n / 1000).toLocaleString('es-CO', {
  maximumFractionDigits: 1
}) + ' mil' : n.toLocaleString('es-CO');
function FilterSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      fontWeight: 700,
      letterSpacing: 'var(--ls-caps)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange(e.target.value),
    style: {
      appearance: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-heading)',
      background: 'var(--white) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%236b7276%27 stroke-width=%271.6%27 fill=%27none%27/%3E%3C/svg%3E") no-repeat right 12px center',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 36px 10px 12px',
      cursor: 'pointer'
    }
  }, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o))));
}
function StackedBars({
  rows
}) {
  const max = Math.max(...rows.map(r => r.total), 1);
  const step = max > 15000 ? 5000 : max > 4000 ? 1000 : 500;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({
    length: top / step + 1
  }, (_, i) => i * step);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '90px minmax(0,1fr)',
      rowGap: '8px',
      columnGap: '12px',
      alignItems: 'center'
    }
  }, rows.map(r => /*#__PURE__*/React.createElement(React.Fragment, {
    key: r.marca
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-small)',
      fontWeight: 600,
      color: 'var(--text-body)',
      textAlign: 'right',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, r.marca), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '20px',
      width: r.total / top * 100 + '%',
      borderRadius: '3px',
      overflow: 'hidden',
      transition: 'width .3s'
    }
  }, YEARS.map(y => /*#__PURE__*/React.createElement("div", {
    key: y.key,
    title: `${y.key}: ${r.years[y.key].toLocaleString('es-CO')}`,
    style: {
      flex: r.years[y.key],
      background: y.color
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-data)',
      fontSize: 'var(--fs-caption)',
      fontWeight: 700,
      color: 'var(--text-heading)',
      whiteSpace: 'nowrap'
    }
  }, fmtMil(r.total))))), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: '16px',
      borderTop: '1px solid var(--line-300)'
    }
  }, ticks.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      position: 'absolute',
      left: t / top * 100 + '%',
      top: '4px',
      transform: 'translateX(-50%)',
      fontSize: '11px',
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, fmtMil(t))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '18px',
      justifyContent: 'center',
      flexWrap: 'wrap',
      paddingTop: '6px'
    }
  }, YEARS.map(y => /*#__PURE__*/React.createElement("span", {
    key: y.key,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: 'var(--fs-small)',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: 2,
      background: y.color
    }
  }), y.key))));
}
function VEDashboard() {
  const [marca, setMarca] = React.useState('Todas');
  const [tipo, setTipo] = React.useState('Todas');
  const [linea, setLinea] = React.useState('Todas');
  const wrap = {
    maxWidth: 'var(--page-max)',
    margin: '0 auto',
    padding: '0 28px'
  };
  const lineas = marca === 'Todas' ? Object.values(VE.lineas).flat() : VE.lineas[marca] || [];
  React.useEffect(() => {
    setLinea('Todas');
  }, [marca]);
  const techSel = VE.tech.filter(t => tipo === 'Todas' || t.label === tipo);
  const techFactor = techSel.reduce((s, t) => s + t.pct, 0) / 100;
  const lineFactor = linea === 'Todas' ? 1 : 1 / (VE.lineas[marca] ? VE.lineas[marca].length : 2);
  const scale = n => Math.round(n * techFactor * lineFactor);
  const rows = VE.brands.filter(b => marca === 'Todas' || b.marca === marca).map(b => ({
    marca: b.marca,
    total: scale(b.total),
    years: {
      2024: scale(b.years[2024]),
      2025: scale(b.years[2025]),
      2026: scale(b.years[2026])
    }
  }));
  const totalVeh = marca === 'Todas' && linea === 'Todas' ? Math.round(VE.totalVehiculos * techFactor) : rows.reduce((s, r) => s + r.total, 0);
  const totalKwh = Math.round(VE.totalKwh * totalVeh / VE.totalVehiculos);
  const shareData = [...VE.brands.map((b, i) => ({
    label: b.marca,
    value: b.pct,
    color: marca === 'Todas' || marca === b.marca ? GRAYS[i] : 'var(--line-200)'
  })), {
    label: 'Otros',
    value: VE.otrosPct,
    color: marca === 'Todas' ? GRAYS[9] : 'var(--line-200)'
  }];
  const techColors = ['var(--teal-500)', 'var(--purple-200)', 'var(--peach-300)', 'var(--teal-200)'];
  const techData = VE.tech.map((t, i) => ({
    label: `${t.label} · ${t.pct.toLocaleString('es-CO')}%`,
    value: t.pct,
    color: tipo === 'Todas' || tipo === t.label ? techColors[i] : 'var(--line-200)'
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-page)',
      minHeight: '100vh'
    }
  }, /*#__PURE__*/React.createElement(SiteHeader, {
    activeIndex: 3,
    nav: [{
      label: 'Quiénes somos',
      dropdown: true
    }, {
      label: 'Secciones',
      dropdown: true
    }, {
      label: 'Glosario'
    }, {
      label: 'Observatorios',
      dropdown: true
    }, {
      label: 'Noticias'
    }, {
      label: 'Contacto'
    }]
  }), /*#__PURE__*/React.createElement(Hero, {
    kicker: "Observatorio \xB7 Movilidad el\xE9ctrica",
    title: "Almacenamiento de energ\xEDa en veh\xEDculos el\xE9ctricos",
    description: "Parque de veh\xEDculos el\xE9ctricos en Colombia: ventas por marca, tecnolog\xEDas de bater\xEDa, potencia acumulada y energ\xEDa almacenada en circulaci\xF3n.",
    showSearch: false,
    accesos: ['Estadísticas', 'Tecnologías', 'Metodología'],
    mapSrc: "../../assets/colombia-map-watermark.png"
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      ...wrap,
      padding: '28px 28px 64px',
      display: 'flex',
      flexDirection: 'column',
      gap: '22px'
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      padding: '16px 20px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      alignItems: 'end'
    }
  }, /*#__PURE__*/React.createElement(FilterSelect, {
    label: "Marca",
    value: marca,
    onChange: setMarca,
    options: ['Todas', ...VE.brands.map(b => b.marca)]
  }), /*#__PURE__*/React.createElement(FilterSelect, {
    label: "Tipo de bater\xEDa",
    value: tipo,
    onChange: setTipo,
    options: ['Todas', ...VE.tech.map(t => t.label)]
  }), /*#__PURE__*/React.createElement(FilterSelect, {
    label: "L\xEDnea",
    value: linea,
    onChange: setLinea,
    options: ['Todas', ...lineas]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px'
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Total veh\xEDculos circulando",
    value: fmtMil(totalVeh)
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Total kWh circulando",
    value: fmtMil(totalKwh)
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Tecnolog\xEDa predominante",
    value: "LFP",
    unit: "85,2 %",
    variant: "outline"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
      gap: '22px'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Veh\xEDculos el\xE9ctricos vendidos",
    subtitle: "Por marca y a\xF1o de registro"
  }, /*#__PURE__*/React.createElement(StackedBars, {
    rows: rows
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "Participaci\xF3n en el mercado",
    subtitle: "% del parque total por marca"
  }, /*#__PURE__*/React.createElement(DonutChart, {
    data: shareData,
    size: 210,
    thickness: 38,
    centerLabel: marca === 'Todas' ? '45,3 mil' : (VE.brands.find(b => b.marca === marca) || {}).pct + '%'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
      gap: '22px'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Tecnolog\xEDa de bater\xEDa",
    subtitle: "Participaci\xF3n por qu\xEDmica"
  }, /*#__PURE__*/React.createElement(DonutChart, {
    data: techData,
    size: 210,
    thickness: 38,
    centerLabel: tipo === 'Todas' ? '4' : tipo.split(' ')[0]
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "Potencia acumulada",
    subtitle: "Capacidad de bater\xEDa m\xEDnima (kWh) por tecnolog\xEDa"
  }, /*#__PURE__*/React.createElement(BarChart, {
    categories: VE.tech.map(t => t.label),
    legend: false,
    height: 260,
    formatValue: v => v.toLocaleString('es-CO'),
    series: [{
      label: 'kWh',
      color: 'var(--series-1)',
      values: VE.tech.map(t => tipo === 'Todas' || tipo === t.label ? t.potencia : 0)
    }]
  })))), /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--teal-600)',
      color: '#fff',
      padding: '28px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "full",
    onLight: false
  }), /*#__PURE__*/React.createElement(SocialLinks, {
    onLight: false,
    showLabel: false
  }))));
}
window.VEDashboard = VEDashboard;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/observatorio-ve/VEDashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/observatorio-ve/data.js
try { (() => {
/* Observatorio VE — data from the "Almacenamiento de energía en vehículos eléctricos" panel.
   Totals and shares are from the source; yearly splits per brand are illustrative. */
(function () {
  const TOTAL = 45300;
  const share = [['Byd', 43.6, [0.30, 0.45, 0.25]], ['Tesla', 17.1, [0.38, 0.42, 0.20]], ['Volvo', 6.6, [0.40, 0.40, 0.20]], ['Chery', 5.4, [0.20, 0.50, 0.30]], ['Chevrolet', 4.8, [0.45, 0.35, 0.20]], ['Kia', 4.6, [0.35, 0.40, 0.25]], ['Bmw', 3.6, [0.40, 0.40, 0.20]], ['DEEPAL', 3.4, [0.10, 0.55, 0.35]], ['Peugeot', 2.1, [0.35, 0.45, 0.20]]];
  const brands = share.map(([marca, pct, split]) => {
    const total = Math.round(TOTAL * pct / 100);
    const y = split.map(s => Math.round(total * s));
    return {
      marca,
      pct,
      total,
      years: {
        2024: y[0],
        2025: y[1],
        2026: total - y[0] - y[1]
      }
    };
  });
  window.VE_DATA = {
    totalVehiculos: TOTAL,
    totalKwh: 2.4e6,
    brands,
    otrosPct: 8.7,
    tech: [{
      label: 'LFP',
      pct: 85.2,
      potencia: 1261
    }, {
      label: 'Lithium-ion',
      pct: 10.8,
      potencia: 899
    }, {
      label: 'NMC Lithium-ion',
      pct: 3.3,
      potencia: 261
    }, {
      label: 'ULTIUM',
      pct: 0.7,
      potencia: 85
    }],
    lineas: {
      Byd: ['Dolphin', 'Seal', 'Yuan Plus', 'Song Plus'],
      Tesla: ['Model 3', 'Model Y'],
      Volvo: ['EX30', 'XC40'],
      Chery: ['Tiggo 7', 'eQ1'],
      Chevrolet: ['Bolt EUV', 'Equinox EV'],
      Kia: ['EV5', 'Niro EV'],
      Bmw: ['iX1', 'i4'],
      DEEPAL: ['S07', 'L07'],
      Peugeot: ['e-2008']
    }
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/observatorio-ve/data.js", error: String((e && e.message) || e) }); }

// ui_kits/sitio-tej/TejSite.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* TejSite — the Observatorio TEJ marketing site: home + a section landing,
   recreated from the source content wireframe. Exposes window.TejSite. */
const NS = window.ObservatorioTEJDesignSystem_45c7be;
const {
  SiteHeader,
  Hero,
  SectionCard,
  Panel,
  Button,
  Logo,
  SocialLinks
} = NS;
const SECCIONES = [{
  title: 'Índice del Trilema Energético',
  description: 'Índice del trilema energético eléctrico colombiano: seguridad, equidad y sostenibilidad.',
  accent: 'var(--teal-300)'
}, {
  title: 'Seguimiento normativo',
  description: 'Seguimiento a la política pública y la normatividad de la transición energética.',
  accent: 'var(--purple-200)'
}, {
  title: 'Matriz Eléctrica',
  description: 'Transición de la matriz eléctrica colombiana por fuente y tecnología.',
  accent: 'var(--peach-300)'
}, {
  title: 'Transición Económica Justa',
  description: 'Dimensión económica y social de la transición energética.',
  accent: 'var(--teal-500)'
}, {
  title: 'Almacenamiento de energía',
  description: 'Inventario de sistemas BESS: mapa, potencias y capacidades en Colombia.',
  accent: 'var(--status-op)'
}, {
  title: 'ABC de la TEJ',
  description: 'Conceptos clave y publicaciones sobre la transición energética justa.',
  accent: 'var(--purple-300)'
}];
function Wrap({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--page-max)',
      margin: '0 auto',
      padding: '0 28px',
      ...style
    }
  }, children);
}
function SiteFooter() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--teal-600)',
      color: '#fff',
      padding: '32px 0',
      marginTop: '8px'
    }
  }, /*#__PURE__*/React.createElement(Wrap, {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "full",
    onLight: false
  }), /*#__PURE__*/React.createElement(SocialLinks, {
    onLight: false
  })));
}
function Home({
  go
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Hero, {
    title: "Transici\xF3n Energ\xE9tica Justa en Colombia",
    description: "Descripci\xF3n breve, impactante del sitio. Datos abiertos y herramientas para seguir la transici\xF3n energ\xE9tica del pa\xEDs.",
    accesos: ['Acceso sección 1', 'Acceso sección 2', 'Acceso sección 3'],
    mapSrc: "../../assets/colombia-map-watermark.png",
    onAccesoClick: () => go('seccion')
  }), /*#__PURE__*/React.createElement(Wrap, {
    style: {
      padding: '48px 28px 40px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-h1)',
      color: 'var(--text-heading)',
      marginBottom: '6px'
    }
  }, "Secciones"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-body)',
      marginTop: 0,
      marginBottom: '26px',
      maxWidth: '620px'
    }
  }, "Explora las herramientas y observatorios de la Transici\xF3n Energ\xE9tica Justa."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px'
    }
  }, SECCIONES.map((s, i) => /*#__PURE__*/React.createElement(SectionCard, _extends({
    key: i
  }, s, {
    onClick: () => go('seccion')
  }))))), /*#__PURE__*/React.createElement(SiteFooter, null));
}
function Seccion({
  go
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--teal-300)',
      color: '#fff',
      padding: '56px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 0,
      right: '-2%',
      bottom: 0,
      width: '42%',
      background: 'url("../../assets/colombia-map-watermark.png") center right/contain no-repeat',
      opacity: 0.35,
      mixBlendMode: 'screen'
    }
  }), /*#__PURE__*/React.createElement(Wrap, {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      fontSize: 'var(--fs-small)',
      opacity: 0.9
    }
  }, "Secci\xF3n"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-display)',
      fontWeight: 800,
      letterSpacing: '-0.01em',
      margin: '8px 0 0',
      lineHeight: 1.08,
      maxWidth: '640px'
    }
  }, "\xCDndice del Trilema Energ\xE9tico El\xE9ctrico Colombiano"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-h3)',
      margin: '18px 0 0',
      maxWidth: '560px'
    }
  }, "Descripci\xF3n breve y clara de la secci\xF3n: qu\xE9 mide el \xEDndice, c\xF3mo se construye y por qu\xE9 importa para la transici\xF3n."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '26px',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    chevron: true
  }, "Conoce m\xE1s del trilema"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => go('home'),
    style: {
      color: '#fff',
      borderColor: '#fff'
    }
  }, "Secciones")))), /*#__PURE__*/React.createElement(Wrap, {
    style: {
      padding: '44px 28px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '22px'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Herramienta \xEDndice del Trilema Energ\xE9tico",
    align: "left"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-body)',
      margin: 0
    }
  }, "Visualiza el \xEDndice por a\xF1o y dimensi\xF3n. Compara escenarios y descarga los datos abiertos."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '16px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    chevron: true
  }, "Abrir herramienta"))), /*#__PURE__*/React.createElement(Panel, {
    title: "Publicaciones relacionadas",
    align: "left"
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: '18px',
      color: 'var(--text-body)',
      lineHeight: 1.9
    }
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Metodolog\xEDa del \xEDndice del trilema (2024)")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "Bolet\xEDn de seguimiento normativo")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, "ABC de la Transici\xF3n Energ\xE9tica Justa")))))), /*#__PURE__*/React.createElement(SiteFooter, null));
}
function TejSite() {
  const [screen, setScreen] = React.useState('home');
  const [lang, setLang] = React.useState('ES');
  const go = s => {
    setScreen(s);
    window.scrollTo(0, 0);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-page)',
      minHeight: '100vh'
    }
  }, /*#__PURE__*/React.createElement(SiteHeader, {
    activeIndex: screen === 'home' ? 0 : 1,
    lang: lang,
    onLangChange: setLang,
    onNavClick: i => go(i === 0 ? 'home' : 'seccion')
  }), screen === 'home' ? /*#__PURE__*/React.createElement(Home, {
    go: go
  }) : /*#__PURE__*/React.createElement(Seccion, {
    go: go
  }));
}
window.TejSite = TejSite;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sitio-tej/TejSite.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.SocialLinks = __ds_scope.SocialLinks;

__ds_ns.BarChart = __ds_scope.BarChart;

__ds_ns.DonutChart = __ds_scope.DonutChart;

__ds_ns.LineChart = __ds_scope.LineChart;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.STATUS = __ds_scope.STATUS;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.StatusLegend = __ds_scope.StatusLegend;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.LangToggle = __ds_scope.LangToggle;

__ds_ns.SiteHeader = __ds_scope.SiteHeader;

__ds_ns.Hero = __ds_scope.Hero;

__ds_ns.MapPanel = __ds_scope.MapPanel;

__ds_ns.SectionCard = __ds_scope.SectionCard;

})();
