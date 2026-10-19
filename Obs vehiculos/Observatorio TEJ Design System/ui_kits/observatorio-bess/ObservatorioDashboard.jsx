/* ObservatorioDashboard — the BESS storage observatory, laid out under the TEJ
   site chrome. Composes design-system components + a real Leaflet map.
   Exposes window.ObservatorioDashboard. */
const NS = window.ObservatorioTEJDesignSystem_45c7be;
const { SiteHeader, Hero, StatCard, Panel, BarChart, DonutChart, LineChart, DataTable, MapPanel, SocialLinks, Logo } = NS;
const DATA = window.BESS_DATA;

function useLeaflet(mapRef, selected, setSelected) {
  React.useEffect(() => {
    if (!window.L || !mapRef.current || mapRef.current._map) return;
    const map = L.map(mapRef.current, { scrollWheelZoom: false, attributionControl: false })
      .setView([4.6, -74.0], 5.4);
    mapRef.current._map = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    const markers = {};
    DATA.projects.forEach((p) => {
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 9, color: '#fff', weight: 2, fillColor: DATA.statusColor[p.estado], fillOpacity: 1,
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
    const p = DATA.projects.find((x) => x.nombre === selected);
    if (p) { map.flyTo([p.lat, p.lng], 8, { duration: 0.8 }); markers[selected].openPopup(); }
  }, [selected]);
}

function ObservatorioDashboard() {
  const [selected, setSelected] = React.useState(null);
  const mapRef = React.useRef(null);
  useLeaflet(mapRef, selected, setSelected);

  const wrap = { maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 28px' };

  return (
    <div style={{ background: 'var(--surface-page)', minHeight: '100vh' }}>
      <SiteHeader activeIndex={3} nav={[
        { label: 'Quiénes somos', dropdown: true }, { label: 'Secciones', dropdown: true },
        { label: 'Glosario' }, { label: 'Observatorios', dropdown: true }, { label: 'Noticias' }, { label: 'Contacto' },
      ]} />

      <Hero
        kicker="Observatorio · Almacenamiento"
        title="Sistemas de almacenamiento de energía en Colombia"
        description="Inventario de sistemas BESS (baterías): operadores, tecnologías, potencias y capacidades instaladas, con seguimiento del estado de cada proyecto."
        showSearch={false}
        accesos={['Ver el mapa', 'Estadísticas', 'Metodología']}
        mapSrc="../../assets/colombia-map-watermark.png"
      />

      <main style={{ ...wrap, padding: '28px 28px 64px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '16px' }}>
          {DATA.kpis.map((k, i) => <StatCard key={i} label={k.label} value={k.value} variant={i < 3 ? 'solid' : 'outline'} />)}
        </div>

        {/* Map + technology */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.9fr) minmax(0,1fr)', gap: '22px', alignItems: 'stretch' }}>
          <MapPanel height={460} title="Inventario de Sistemas BESS en Colombia"
            subtitle="Almacenamiento por baterías — operadores y capacidades"
            legendItems={['op', 'con', 'susp']}>
            <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
          </MapPanel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <Panel title="Tecnología"><DonutChart data={[{ label: 'Li-ion', value: 100 }]} /></Panel>
            <Panel title="Estado de proyectos" align="left">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[['op', '3 en operación'], ['susp', '1 suspendido']].map(([s, t]) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: DATA.statusColor[s] }} />
                    <span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-body)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '22px' }}>
          <Panel title="Comparación MW vs MWh por proyecto">
            <BarChart categories={DATA.projects.map((p) => p.nombre)}
              series={[
                { label: 'Potencia nominal [MW]', color: 'var(--series-1)', values: DATA.projects.map((p) => parseFloat(p.mw.replace(',', '.'))) },
                { label: 'Capacidad máxima [MWh]', color: 'var(--series-2)', values: DATA.projects.map((p) => parseFloat(p.cap.replace(',', '.'))) },
              ]} />
          </Panel>
          <Panel title="Potencia nominal [MW] vs FPO">
            <LineChart yLabel="Potencia nominal [MW]"
              points={[...DATA.projects].sort((a, b) => a.fpo - b.fpo).map((p) => ({ x: p.fpo, y: parseFloat(p.mw.replace(',', '.')) }))} />
          </Panel>
        </div>

        {/* Table */}
        <Panel title="Inventario de proyectos" subtitle="Haz clic en una fila para ubicar el proyecto en el mapa" align="left">
          <div onClick={(e) => {
            const tr = e.target.closest('tr'); if (!tr) return;
            const idx = [...tr.parentNode.children].indexOf(tr);
            const p = DATA.projects[idx]; if (p) setSelected(p.nombre);
          }}>
            <DataTable columns={[
              { key: 'nombre', label: 'Nombre' }, { key: 'operador', label: 'Operador' },
              { key: 'estado', label: 'Estado', status: true }, { key: 'fpo', label: 'FPO' },
              { key: 'dpto', label: 'Departamento' }, { key: 'municipio', label: 'Municipio' },
              { key: 'tec', label: 'Tecnología' }, { key: 'cap', label: 'Cap. [MWh]', numeric: true },
              { key: 'mw', label: 'Pot. [MW]', numeric: true },
            ]} rows={DATA.projects} />
          </div>
        </Panel>
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

window.ObservatorioDashboard = ObservatorioDashboard;
