/* TejSite — the Observatorio TEJ marketing site: home + a section landing,
   recreated from the source content wireframe. Exposes window.TejSite. */
const NS = window.ObservatorioTEJDesignSystem_45c7be;
const { SiteHeader, Hero, SectionCard, Panel, Button, Logo, SocialLinks } = NS;

const SECCIONES = [
  { title: 'Índice del Trilema Energético', description: 'Índice del trilema energético eléctrico colombiano: seguridad, equidad y sostenibilidad.', accent: 'var(--teal-300)' },
  { title: 'Seguimiento normativo', description: 'Seguimiento a la política pública y la normatividad de la transición energética.', accent: 'var(--purple-200)' },
  { title: 'Matriz Eléctrica', description: 'Transición de la matriz eléctrica colombiana por fuente y tecnología.', accent: 'var(--peach-300)' },
  { title: 'Transición Económica Justa', description: 'Dimensión económica y social de la transición energética.', accent: 'var(--teal-500)' },
  { title: 'Almacenamiento de energía', description: 'Inventario de sistemas BESS: mapa, potencias y capacidades en Colombia.', accent: 'var(--status-op)' },
  { title: 'ABC de la TEJ', description: 'Conceptos clave y publicaciones sobre la transición energética justa.', accent: 'var(--purple-300)' },
];

function Wrap({ children, style }) {
  return <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 28px', ...style }}>{children}</div>;
}

function SiteFooter() {
  return (
    <footer style={{ background: 'var(--teal-600)', color: '#fff', padding: '32px 0', marginTop: '8px' }}>
      <Wrap style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <Logo variant="full" onLight={false} />
        <SocialLinks onLight={false} />
      </Wrap>
    </footer>
  );
}

function Home({ go }) {
  return (
    <React.Fragment>
      <Hero
        title="Transición Energética Justa en Colombia"
        description="Descripción breve, impactante del sitio. Datos abiertos y herramientas para seguir la transición energética del país."
        accesos={['Acceso sección 1', 'Acceso sección 2', 'Acceso sección 3']}
        mapSrc="../../assets/colombia-map-watermark.png"
        onAccesoClick={() => go('seccion')}
      />
      <Wrap style={{ padding: '48px 28px 40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h1)', color: 'var(--text-heading)', marginBottom: '6px' }}>Secciones</h2>
        <p style={{ color: 'var(--text-body)', marginTop: 0, marginBottom: '26px', maxWidth: '620px' }}>Explora las herramientas y observatorios de la Transición Energética Justa.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {SECCIONES.map((s, i) => <SectionCard key={i} {...s} onClick={() => go('seccion')} />)}
        </div>
      </Wrap>
      <SiteFooter />
    </React.Fragment>
  );
}

function Seccion({ go }) {
  return (
    <React.Fragment>
      <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--teal-300)', color: '#fff', padding: '56px 28px' }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: 0, right: '-2%', bottom: 0, width: '42%', background: 'url("../../assets/colombia-map-watermark.png") center right/contain no-repeat', opacity: 0.35, mixBlendMode: 'screen' }} />
        <Wrap style={{ position: 'relative' }}>
          <div style={{ fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 'var(--fs-small)', opacity: 0.9 }}>Sección</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-display)', fontWeight: 800, letterSpacing: '-0.01em', margin: '8px 0 0', lineHeight: 1.08, maxWidth: '640px' }}>Índice del Trilema Energético Eléctrico Colombiano</h1>
          <p style={{ fontSize: 'var(--fs-h3)', margin: '18px 0 0', maxWidth: '560px' }}>Descripción breve y clara de la sección: qué mide el índice, cómo se construye y por qué importa para la transición.</p>
          <div style={{ marginTop: '26px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="accent" chevron>Conoce más del trilema</Button>
            <Button variant="secondary" onClick={() => go('home')} style={{ color: '#fff', borderColor: '#fff' }}>Secciones</Button>
          </div>
        </Wrap>
      </section>
      <Wrap style={{ padding: '44px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px' }}>
          <Panel title="Herramienta índice del Trilema Energético" align="left">
            <p style={{ color: 'var(--text-body)', margin: 0 }}>Visualiza el índice por año y dimensión. Compara escenarios y descarga los datos abiertos.</p>
            <div style={{ marginTop: '16px' }}><Button variant="primary" chevron>Abrir herramienta</Button></div>
          </Panel>
          <Panel title="Publicaciones relacionadas" align="left">
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-body)', lineHeight: 1.9 }}>
              <li><a href="#">Metodología del índice del trilema (2024)</a></li>
              <li><a href="#">Boletín de seguimiento normativo</a></li>
              <li><a href="#">ABC de la Transición Energética Justa</a></li>
            </ul>
          </Panel>
        </div>
      </Wrap>
      <SiteFooter />
    </React.Fragment>
  );
}

function TejSite() {
  const [screen, setScreen] = React.useState('home');
  const [lang, setLang] = React.useState('ES');
  const go = (s) => { setScreen(s); window.scrollTo(0, 0); };
  return (
    <div style={{ background: 'var(--surface-page)', minHeight: '100vh' }}>
      <SiteHeader activeIndex={screen === 'home' ? 0 : 1} lang={lang} onLangChange={setLang} onNavClick={(i) => go(i === 0 ? 'home' : 'seccion')} />
      {screen === 'home' ? <Home go={go} /> : <Seccion go={go} />}
    </div>
  );
}

window.TejSite = TejSite;
