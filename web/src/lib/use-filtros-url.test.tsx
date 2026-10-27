// 008 · CA-03.2: un enlace con ?segmento= abre ese segmento también cuando la página llega
// renderizada del servidor (sin URL) y se hidrata después dentro de un <Suspense>, como /mapa.
import { act, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { useSegmentoUrl } from "./use-filtros-url";

function Boton() {
  const { segmento } = useSegmentoUrl();
  return <p data-prueba="boton">{segmento.id}</p>;
}

function Vista() {
  const { segmento } = useSegmentoUrl();
  return <p data-prueba="vista">{segmento.id}</p>;
}

function Pagina() {
  return (
    <div>
      <Boton />
      <Suspense fallback={<p>Cargando…</p>}>
        <Vista />
      </Suspense>
    </div>
  );
}

afterEach(() => window.history.replaceState(null, "", "/"));

describe("useSegmentoUrl al hidratar", () => {
  test("el botón y la vista dentro de Suspense leen el segmento del enlace", async () => {
    // Servidor: sin URL (getServerSnapshot = ""), por eso el HTML dice «gran-escala».
    const html = renderToString(<Pagina />);
    const contenedor = document.createElement("div");
    contenedor.innerHTML = html;
    document.body.appendChild(contenedor);
    window.history.replaceState(null, "", "/mapa?segmento=detras-del-medidor");

    await act(async () => {
      hydrateRoot(contenedor, <Pagina />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(contenedor.querySelector('[data-prueba="boton"]')?.textContent).toBe("detras-del-medidor");
    expect(contenedor.querySelector('[data-prueba="vista"]')?.textContent).toBe("detras-del-medidor");
    contenedor.remove();
  });
});
