// Mapa de Colombia como fondo tenue de todas las páginas (ajuste de diseño del usuario,
// 2026-10-23). Imagen del usuario, de uso libre y sin créditos, optimizada a PNG de 8 colores
// (public/fondo-colombia.png, 47 KB). Es solo decoración: no recibe clics, los lectores de
// pantalla lo ignoran y queda detrás del contenido.
export function FondoMapa() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-no-repeat bg-[position:right_4%_center] bg-[length:min(70vw,620px)_auto] print:hidden max-sm:bg-[position:center_70%]"
      style={{ backgroundImage: 'url("/fondo-colombia.png")', opacity: 0.12 }}
    />
  );
}
