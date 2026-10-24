// Mapa de Colombia como fondo tenue de todas las páginas (ajuste de diseño del usuario,
// 2026-10-23). Imagen del usuario, de uso libre y sin créditos, recortada a su tamaño nativo
// (781 × 1040 px) en PNG de 64 colores (public/fondo-colombia.png, 100 KB). El 2026-10-24 se
// redujo un 30 % y se subió la calidad a pedido del usuario. Es solo decoración: no recibe clics, los lectores de
// pantalla lo ignoran y queda detrás del contenido.
export function FondoMapa() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-no-repeat bg-[position:right_4%_center] bg-[length:min(49vw,434px)_auto] print:hidden max-sm:bg-[position:center_70%]"
      style={{ backgroundImage: 'url("/fondo-colombia.png")', opacity: 0.12 }}
    />
  );
}
