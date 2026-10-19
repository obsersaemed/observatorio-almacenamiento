/* Observatorio VE — Almacenamiento de energia en vehiculos electricos.
   Diseno: ui_kits/observatorio-ve del Observatorio TEJ Design System.
   Datos: window.OBS_VE_DATOS (datos.js, generado por src/dashboard_datos.py).
   Todos los indicadores se calculan aqui a partir de las filas por linea, de modo que
   los filtros recalculan cifras reales en lugar de escalar totales. */
(function () {
  const h = React.createElement;
  const DS = window.ObservatorioTEJDesignSystem_45c7be;
  const { SiteHeader, Hero, StatCard, Panel, DonutChart, SocialLinks, Logo } = DS;
  const DATOS = window.OBS_VE_DATOS;
  const FILAS = DATOS.filas;

  const ANIOS = [
    { clave: '2024', color: 'var(--purple-200)' },
    { clave: '2025', color: 'var(--series-1)' },
    { clave: '2026', color: 'var(--peach-300)' },
  ];
  // Grises del diseno para la participacion por marca, de mayor a menor.
  const GRISES = ['#33383b', '#4a5155', '#5c6367', '#6b7276', '#7f868a', '#8b9296', '#a6adb1', '#bcc2c5', '#cdd2d4', '#e4e7e8'];
  // Color fijo por quimica (sigue a la tecnologia, no a su posicion en el ranking).
  const COLOR_TEC = { 'LFP': 'var(--teal-500)', 'Lithium-ion': 'var(--purple-200)', 'NMC Lithium-ion': 'var(--peach-300)', 'ULTIUM': 'var(--teal-200)' };
  const ATENUADO = 'var(--line-200)';
  const MARCAS_VISIBLES = 9; // el resto se agrupa en "Otras"
  const TODAS = 'Todas';

  // ---------- formato es-CO ----------
  const num = (n, dec = 0) => n.toLocaleString('es-CO', { maximumFractionDigits: dec, minimumFractionDigits: 0 });
  const pct = (n) => n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
  const corto = (n) => n >= 1e6 ? num(n / 1e6, 1) + ' M' : n >= 1000 ? num(n / 1000, 1) + ' mil' : num(n);
  const fechaLarga = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  // ---------- agregaciones ----------
  const suma = (filas, f) => filas.reduce((s, r) => s + f(r), 0);
  function agrupar(filas, clave, valor) {
    const m = new Map();
    filas.forEach((r) => m.set(r[clave], (m.get(r[clave]) || 0) + valor(r)));
    return [...m.entries()].map(([k, v]) => ({ clave: k, valor: v })).sort((a, b) => b.valor - a.valor);
  }
  const unicos = (filas, clave) => [...new Set(filas.map((r) => r[clave]))].sort((a, b) => a.localeCompare(b, 'es'));

  function filtrar({ marca, tipo, linea }, omitir = {}) {
    return FILAS.filter((r) =>
      (omitir.marca || marca === TODAS || r.marca === marca) &&
      (omitir.tipo || tipo === TODAS || r.tipo === tipo) &&
      (omitir.linea || linea === TODAS || r.linea === linea));
  }

  // ---------- componentes locales ----------
  function Selector({ etiqueta, valor, opciones, onCambio }) {
    return h('label', { style: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 } },
      h('span', { style: { fontSize: 'var(--fs-caption)', fontWeight: 700, letterSpacing: 'var(--ls-caps)', textTransform: 'uppercase', color: 'var(--text-muted)' } }, etiqueta),
      h('select', {
        value: valor, onChange: (e) => onCambio(e.target.value),
        style: {
          appearance: 'none', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-heading)',
          background: 'var(--white) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%236b7276%27 stroke-width=%271.6%27 fill=%27none%27/%3E%3C/svg%3E") no-repeat right 12px center',
          border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '10px 36px 10px 12px', cursor: 'pointer', minWidth: 0,
        },
      }, opciones.map((o) => h('option', { key: o, value: o }, o))));
  }

  function Leyenda({ items }) {
    return h('div', { style: { display: 'flex', gap: '18px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '6px' } },
      items.map((it) => h('span', { key: it.etiqueta, style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-small)', color: 'var(--text-body)' } },
        h('span', { style: { width: 12, height: 12, borderRadius: 2, background: it.color } }), it.etiqueta)));
  }

  function Eje({ tope, paso, formato }) {
    const marcas = [];
    for (let t = 0; t <= tope + 1e-9; t += paso) marcas.push(t);
    return h('div', { style: { position: 'relative', height: '16px', borderTop: '1px solid var(--line-300)' } },
      marcas.map((t) => h('span', { key: t, style: { position: 'absolute', left: (t / tope * 100) + '%', top: '4px', transform: 'translateX(-50%)', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' } }, formato(t))));
  }

  function pasoBonito(max) {
    const crudo = max / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(crudo || 1)));
    const n = crudo / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }

  /* Barras horizontales. filas: [{ etiqueta, total, partes: [{ valor, color, titulo }] }] */
  function BarrasHorizontales({ filas, formato = corto, anchoEtiqueta = 90 }) {
    const max = Math.max(1, ...filas.map((f) => f.total));
    const paso = pasoBonito(max);
    const tope = Math.ceil(max / paso) * paso;
    return h('div', { style: { display: 'grid', gridTemplateColumns: `${anchoEtiqueta}px minmax(0,1fr)`, rowGap: '8px', columnGap: '12px', alignItems: 'center' } },
      filas.map((f) => h(React.Fragment, { key: f.etiqueta },
        h('span', { title: f.etiqueta, style: { fontSize: 'var(--fs-small)', fontWeight: 600, color: f.atenuada ? 'var(--text-muted)' : 'var(--text-body)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, f.etiqueta),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 } },
          h('div', { style: { display: 'flex', gap: '2px', height: '20px', width: (f.total / tope * 100) + '%', minWidth: f.total > 0 ? '2px' : 0, borderRadius: '3px', overflow: 'hidden', transition: 'width .3s' } },
            f.partes.filter((p) => p.valor > 0).map((p, i) => h('div', { key: i, title: p.titulo, style: { flex: p.valor, background: p.color } }))),
          h('span', { style: { fontFamily: 'var(--font-data)', fontSize: 'var(--fs-caption)', fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap' } }, formato(f.total))))),
      h('span'), h(Eje, { tope, paso, formato }));
  }

  // ---------- pagina ----------
  function ObservatorioVE() {
    const [marca, setMarca] = React.useState(TODAS);
    const [tipo, setTipo] = React.useState(TODAS);
    const [linea, setLinea] = React.useState(TODAS);
    const filtros = { marca, tipo, linea };

    // Las opciones de cada selector dependen de los otros filtros, para no ofrecer combinaciones vacias.
    const opcionesLinea = unicos(filtrar(filtros, { linea: true }), 'linea');
    React.useEffect(() => { if (linea !== TODAS && !opcionesLinea.includes(linea)) setLinea(TODAS); }, [marca, tipo]);
    const cambiarLinea = (l) => {
      setLinea(l);
      if (l !== TODAS) {
        const r = FILAS.find((x) => x.linea === l);
        if (r) { setMarca(r.marca); setTipo(r.tipo); }
      }
    };

    const sel = filtrar(filtros);
    const totalVeh = suma(sel, (r) => r.total);
    const totalKwh = suma(sel, (r) => r.kwh);
    const porTec = agrupar(sel, 'tipo', (r) => r.total);
    const predominante = porTec[0];

    // Ventas por marca (respeta todos los filtros).
    const porMarca = agrupar(sel, 'marca', (r) => r.total);
    const visibles = porMarca.slice(0, MARCAS_VISIBLES).map((m) => m.clave);
    const filaMarca = (etiqueta, filas) => {
      const partes = ANIOS.map((a) => {
        const v = suma(filas, (r) => r.anios[a.clave]);
        return { valor: v, color: a.color, titulo: `${a.clave}: ${num(v)} vehículos` };
      });
      return { etiqueta, total: suma(partes, (p) => p.valor), partes };
    };
    const barrasMarca = visibles.map((m) => filaMarca(m, sel.filter((r) => r.marca === m)));
    const restoMarcas = porMarca.slice(MARCAS_VISIBLES);
    if (restoMarcas.length) {
      const otras = filaMarca(`Otras (${restoMarcas.length})`, sel.filter((r) => !visibles.includes(r.marca)));
      otras.atenuada = true;
      barrasMarca.push(otras);
    }

    // Participacion por marca: base sin el filtro de marca, para ver el peso de la seleccionada.
    const baseMarca = filtrar(filtros, { marca: true, linea: true });
    const totBaseMarca = suma(baseMarca, (r) => r.total) || 1;
    const partMarca = agrupar(baseMarca, 'marca', (r) => r.total);
    const top = partMarca.slice(0, MARCAS_VISIBLES);
    const otrasPart = suma(partMarca.slice(MARCAS_VISIBLES), (m) => m.valor);
    const donaMarca = top.map((m, i) => ({
      label: `${m.clave} · ${pct(m.valor / totBaseMarca * 100)}`, value: m.valor,
      color: marca === TODAS || marca === m.clave ? GRISES[i] : ATENUADO,
    }));
    if (otrasPart > 0) donaMarca.push({ label: `Otras · ${pct(otrasPart / totBaseMarca * 100)}`, value: otrasPart, color: marca === TODAS || !top.some((m) => m.clave === marca) ? GRISES[9] : ATENUADO });
    const centroMarca = marca === TODAS ? corto(totBaseMarca) : pct(suma(baseMarca.filter((r) => r.marca === marca), (r) => r.total) / totBaseMarca * 100);

    // Tecnologia: base sin el filtro de tipo, para comparar quimicas entre si.
    const baseTec = filtrar(filtros, { tipo: true });
    const vehTec = agrupar(baseTec, 'tipo', (r) => r.total);
    const totBaseTec = suma(vehTec, (t) => t.valor) || 1;
    const donaTec = vehTec.map((t) => ({
      label: `${t.clave} · ${pct(t.valor / totBaseTec * 100)}`, value: t.valor,
      color: tipo === TODAS || tipo === t.clave ? COLOR_TEC[t.clave] || 'var(--series-2)' : ATENUADO,
    }));
    const kwhTec = agrupar(baseTec, 'tipo', (r) => r.kwh);
    const barrasKwh = kwhTec.map((t) => ({
      etiqueta: t.clave, total: t.valor, atenuada: tipo !== TODAS && tipo !== t.clave,
      partes: [{ valor: t.valor, color: tipo === TODAS || tipo === t.clave ? COLOR_TEC[t.clave] || 'var(--series-2)' : ATENUADO, titulo: `${t.clave}: ${num(t.valor)} kWh` }],
    }));

    const hayFiltro = marca !== TODAS || tipo !== TODAS || linea !== TODAS;
    const limpiar = () => { setMarca(TODAS); setTipo(TODAS); setLinea(TODAS); };
    const ir = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const envoltura = { maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 28px' };
    const fila2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: '22px' };
    const vacio = h('p', { style: { textAlign: 'center', color: 'var(--text-muted)', margin: '24px 0' } }, 'No hay vehículos con esta combinación de filtros.');

    return h('div', { style: { background: 'var(--surface-page)', minHeight: '100vh' } },
      h(SiteHeader, { activeIndex: 3, nav: [
        { label: 'Quiénes somos', dropdown: true }, { label: 'Secciones', dropdown: true },
        { label: 'Glosario' }, { label: 'Observatorios', dropdown: true }, { label: 'Noticias' }, { label: 'Contacto' },
      ] }),
      h(Hero, {
        kicker: 'Observatorio · Movilidad eléctrica',
        title: 'Almacenamiento de energía en vehículos eléctricos',
        description: 'Vehículos eléctricos registrados en Colombia entre 2024 y 2026: ventas por marca, tecnologías de batería y energía almacenada en circulación.',
        showSearch: false,
        accesos: ['Estadísticas', 'Tecnologías', 'Metodología'],
        onAccesoClick: (i) => ir(['estadisticas', 'tecnologias', 'metodologia'][i]),
        mapSrc: 'ds/assets/colombia-map-watermark.png',
      }),
      h('main', { style: { ...envoltura, padding: '28px 28px 64px', display: 'flex', flexDirection: 'column', gap: '22px' } },
        h('section', { 'aria-label': 'Filtros', style: { background: 'var(--surface-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' } },
          h(Selector, { etiqueta: 'Marca', valor: marca, onCambio: setMarca, opciones: [TODAS, ...unicos(filtrar(filtros, { marca: true, linea: true }), 'marca')] }),
          h(Selector, { etiqueta: 'Tipo de batería', valor: tipo, onCambio: setTipo, opciones: [TODAS, ...unicos(filtrar(filtros, { tipo: true, linea: true }), 'tipo')] }),
          h(Selector, { etiqueta: 'Línea', valor: linea, onCambio: cambiarLinea, opciones: [TODAS, ...opcionesLinea] }),
          hayFiltro && h('button', { onClick: limpiar, style: { justifySelf: 'start', background: 'none', border: 'none', padding: '10px 0', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--text-link)', cursor: 'pointer', textDecoration: 'underline' } }, 'Quitar filtros')),

        h('div', { id: 'estadisticas', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', scrollMarginTop: '16px' } },
          h(StatCard, { label: 'Vehículos eléctricos registrados', value: corto(totalVeh), unit: '2024–2026' }),
          h(StatCard, { label: 'Energía almacenada en circulación', value: corto(totalKwh), unit: 'kWh' }),
          h(StatCard, { label: 'Tecnología predominante', value: predominante ? predominante.clave : '—', unit: predominante ? pct(predominante.valor / (totalVeh || 1) * 100) : null, variant: 'outline' })),

        h('div', { style: fila2 },
          h(Panel, { title: 'Vehículos eléctricos vendidos', subtitle: 'Por marca y año de registro' },
            barrasMarca.length ? [h(BarrasHorizontales, { key: 'b', filas: barrasMarca }), h(Leyenda, { key: 'l', items: ANIOS.map((a) => ({ etiqueta: a.clave === '2026' ? '2026 (parcial)' : a.clave, color: a.color })) })] : vacio),
          h(Panel, { title: 'Participación en el mercado', subtitle: '% de vehículos registrados por marca' },
            donaMarca.length ? h(DonutChart, { data: donaMarca, size: 210, thickness: 38, centerLabel: centroMarca }) : vacio)),

        h('div', { id: 'tecnologias', style: { ...fila2, scrollMarginTop: '16px' } },
          h(Panel, { title: 'Tecnología de batería', subtitle: '% de vehículos registrados por química' },
            donaTec.length ? h(DonutChart, { data: donaTec, size: 210, thickness: 38, centerLabel: tipo === TODAS ? String(donaTec.length) : tipo.split(' ')[0] }) : vacio),
          h(Panel, { title: 'Energía almacenada por tecnología', subtitle: 'kWh en circulación (vehículos × capacidad promedio de batería)' },
            barrasKwh.length ? h(BarrasHorizontales, { filas: barrasKwh, anchoEtiqueta: 120 }) : vacio)),

        // Panel reemplaza su propio estilo si recibe `style`, por eso el ancla va en un contenedor aparte.
        h('div', { id: 'metodologia', style: { scrollMarginTop: '16px' } }, h(Panel, { title: 'Metodología', align: 'left' },
          h('ul', { style: { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--fs-small)', color: 'var(--text-body)' } },
            h('li', null, `Fuente: ${DATOS.fuente}. ${FILAS.length} líneas de ${unicos(FILAS, 'marca').length} marcas. Corte: ${fechaLarga(DATOS.corte)}.`),
            h('li', null, '2026 es un año parcial: incluye los registros hasta la fecha de corte.'),
            h('li', null, 'Energía almacenada = vehículos registrados × capacidad promedio de la batería de cada línea (promedio entre la versión de menor y mayor capacidad).'),
            h('li', null, 'Las cifras corresponden a las líneas incluidas en la base, no al parque automotor eléctrico total del país.'))))),
      h('footer', { style: { background: 'var(--teal-600)', color: '#fff', padding: '28px 0' } },
        h('div', { style: { ...envoltura, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' } },
          h(Logo, { variant: 'full', onLight: false }),
          h(SocialLinks, { onLight: false, showLabel: false }))));
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(ObservatorioVE));
})();
