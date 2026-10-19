/* VEDashboard — energy storage in electric vehicles. Same chrome, tokens and
   components as the BESS observatory. Exposes window.VEDashboard. */
const VNS = window.ObservatorioTEJDesignSystem_45c7be;
const { SiteHeader, Hero, StatCard, Panel, DonutChart, BarChart, SocialLinks, Logo } = VNS;
const VE = window.VE_DATA;
const YEARS = [
  { key: 2024, color: 'var(--purple-200)' },
  { key: 2025, color: 'var(--series-1)' },
  { key: 2026, color: 'var(--peach-300)' },
];
const GRAYS = ['#33383b', '#4a5155', '#5c6367', '#6b7276', '#7f868a', '#8b9296', '#a6adb1', '#bcc2c5', '#cdd2d4', '#e4e7e8'];
const fmtMil = (n) => n >= 1e6 ? (n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M'
  : n >= 1000 ? (n / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' mil' : n.toLocaleString('es-CO');

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
      <span style={{ fontSize: 'var(--fs-caption)', fontWeight: 700, letterSpacing: 'var(--ls-caps)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        appearance: 'none', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', color: 'var(--text-heading)',
        background: 'var(--white) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%236b7276%27 stroke-width=%271.6%27 fill=%27none%27/%3E%3C/svg%3E") no-repeat right 12px center',
        border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '10px 36px 10px 12px', cursor: 'pointer',
      }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function StackedBars({ rows }) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  const step = max > 15000 ? 5000 : max > 4000 ? 1000 : 500;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '90px minmax(0,1fr)', rowGap: '8px', columnGap: '12px', alignItems: 'center' }}>
        {rows.map((r) => (
          <React.Fragment key={r.marca}>
            <span style={{ fontSize: 'var(--fs-small)', fontWeight: 600, color: 'var(--text-body)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.marca}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ display: 'flex', height: '20px', width: (r.total / top * 100) + '%', borderRadius: '3px', overflow: 'hidden', transition: 'width .3s' }}>
                {YEARS.map((y) => <div key={y.key} title={`${y.key}: ${r.years[y.key].toLocaleString('es-CO')}`} style={{ flex: r.years[y.key], background: y.color }} />)}
              </div>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--fs-caption)', fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>{fmtMil(r.total)}</span>
            </div>
          </React.Fragment>
        ))}
        <span></span>
        <div style={{ position: 'relative', height: '16px', borderTop: '1px solid var(--line-300)' }}>
          {ticks.map((t) => <span key={t} style={{ position: 'absolute', left: (t / top * 100) + '%', top: '4px', transform: 'translateX(-50%)', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtMil(t)}</span>)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '18px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '6px' }}>
        {YEARS.map((y) => (
          <span key={y.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-small)', color: 'var(--text-body)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: y.color }}></span>{y.key}
          </span>
        ))}
      </div>
    </div>
  );
}

function VEDashboard() {
  const [marca, setMarca] = React.useState('Todas');
  const [tipo, setTipo] = React.useState('Todas');
  const [linea, setLinea] = React.useState('Todas');
  const wrap = { maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 28px' };

  const lineas = marca === 'Todas' ? Object.values(VE.lineas).flat() : (VE.lineas[marca] || []);
  React.useEffect(() => { setLinea('Todas'); }, [marca]);

  const techSel = VE.tech.filter((t) => tipo === 'Todas' || t.label === tipo);
  const techFactor = techSel.reduce((s, t) => s + t.pct, 0) / 100;
  const lineFactor = linea === 'Todas' ? 1 : 1 / (VE.lineas[marca] ? VE.lineas[marca].length : 2);
  const scale = (n) => Math.round(n * techFactor * lineFactor);
  const rows = VE.brands.filter((b) => marca === 'Todas' || b.marca === marca).map((b) => ({
    marca: b.marca, total: scale(b.total), years: { 2024: scale(b.years[2024]), 2025: scale(b.years[2025]), 2026: scale(b.years[2026]) },
  }));
  const totalVeh = marca === 'Todas' && linea === 'Todas' ? Math.round(VE.totalVehiculos * techFactor) : rows.reduce((s, r) => s + r.total, 0);
  const totalKwh = Math.round(VE.totalKwh * totalVeh / VE.totalVehiculos);

  const shareData = [...VE.brands.map((b, i) => ({ label: b.marca, value: b.pct, color: marca === 'Todas' || marca === b.marca ? GRAYS[i] : 'var(--line-200)' })),
    { label: 'Otros', value: VE.otrosPct, color: marca === 'Todas' ? GRAYS[9] : 'var(--line-200)' }];
  const techColors = ['var(--teal-500)', 'var(--purple-200)', 'var(--peach-300)', 'var(--teal-200)'];
  const techData = VE.tech.map((t, i) => ({ label: `${t.label} · ${t.pct.toLocaleString('es-CO')}%`, value: t.pct, color: tipo === 'Todas' || tipo === t.label ? techColors[i] : 'var(--line-200)' }));

  return (
    <div style={{ background: 'var(--surface-page)', minHeight: '100vh' }}>
      <SiteHeader activeIndex={3} nav={[
        { label: 'Quiénes somos', dropdown: true }, { label: 'Secciones', dropdown: true },
        { label: 'Glosario' }, { label: 'Observatorios', dropdown: true }, { label: 'Noticias' }, { label: 'Contacto' },
      ]} />
      <Hero
        kicker="Observatorio · Movilidad eléctrica"
        title="Almacenamiento de energía en vehículos eléctricos"
        description="Parque de vehículos eléctricos en Colombia: ventas por marca, tecnologías de batería, potencia acumulada y energía almacenada en circulación."
        showSearch={false}
        accesos={['Estadísticas', 'Tecnologías', 'Metodología']}
        mapSrc="../../assets/colombia-map-watermark.png"
      />
      <main style={{ ...wrap, padding: '28px 28px 64px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <section style={{ background: 'var(--surface-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <FilterSelect label="Marca" value={marca} onChange={setMarca} options={['Todas', ...VE.brands.map((b) => b.marca)]} />
          <FilterSelect label="Tipo de batería" value={tipo} onChange={setTipo} options={['Todas', ...VE.tech.map((t) => t.label)]} />
          <FilterSelect label="Línea" value={linea} onChange={setLinea} options={['Todas', ...lineas]} />
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <StatCard label="Total vehículos circulando" value={fmtMil(totalVeh)} />
          <StatCard label="Total kWh circulando" value={fmtMil(totalKwh)} />
          <StatCard label="Tecnología predominante" value="LFP" unit="85,2 %" variant="outline" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: '22px' }}>
          <Panel title="Vehículos eléctricos vendidos" subtitle="Por marca y año de registro">
            <StackedBars rows={rows} />
          </Panel>
          <Panel title="Participación en el mercado" subtitle="% del parque total por marca">
            <DonutChart data={shareData} size={210} thickness={38} centerLabel={marca === 'Todas' ? '45,3 mil' : (VE.brands.find((b) => b.marca === marca) || {}).pct + '%'} />
          </Panel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: '22px' }}>
          <Panel title="Tecnología de batería" subtitle="Participación por química">
            <DonutChart data={techData} size={210} thickness={38} centerLabel={tipo === 'Todas' ? '4' : tipo.split(' ')[0]} />
          </Panel>
          <Panel title="Potencia acumulada" subtitle="Capacidad de batería mínima (kWh) por tecnología">
            <BarChart categories={VE.tech.map((t) => t.label)} legend={false} height={260}
              formatValue={(v) => v.toLocaleString('es-CO')}
              series={[{ label: 'kWh', color: 'var(--series-1)', values: VE.tech.map((t) => tipo === 'Todas' || tipo === t.label ? t.potencia : 0) }]} />
          </Panel>
        </div>
      </main>
      <footer style={{ background: 'var(--teal-600)', color: '#fff', padding: '28px 0' }}>
        <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Logo variant="full" onLight={false} />
          <SocialLinks onLight={false} showLabel={false} />
        </div>
      </footer>
    </div>
  );
}

window.VEDashboard = VEDashboard;
