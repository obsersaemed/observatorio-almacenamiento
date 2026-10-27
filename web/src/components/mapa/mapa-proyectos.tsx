"use client";

// Mapa de /mapa (spec 002, RF-01, RF-04, RF-07). MapLibre pinta el fondo (teselas basadas en
// OSM) y cada proyecto es un <button> propio encima, posicionado con map.project(). Así el
// mouse, el toque y el teclado abren la misma tarjeta (RNF-03). MapLibre se importa al montar
// para no pesar en la carga inicial (RNF-02).
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapaMaplibre } from "maplibre-gl";
import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { Unidades } from "@/lib/formato";
import { useMovimientoReducido } from "@/lib/movimiento";
import { posicionTarjeta } from "@/lib/posicion-tarjeta";
import type { ProyectoMapa } from "@/lib/proyectos-mapa";
import { colorDe, Leyenda } from "./leyenda";
import { TarjetaProyecto } from "./tarjeta-proyecto";

// OpenFreeMap: teselas vectoriales basadas en OSM, sin llave ni costo (RNF-08).
const ESTILO = "https://tiles.openfreemap.org/styles/positron";
// Respaldo si OpenFreeMap no responde: teselas ráster de OpenStreetMap.
const ESTILO_OSM = {
  version: 8 as const,
  sources: { osm: { type: "raster" as const, tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256 } },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};
const ATRIBUCION = "© colaboradores de OpenStreetMap";
// Textos de los controles de MapLibre en español (RNF-03).
const TEXTOS_MAPA = {
  "Map.Title": "Mapa de los proyectos de almacenamiento",
  "AttributionControl.ToggleAttribution": "Mostrar u ocultar la atribución",
  "AttributionControl.MapFeedback": "Comentarios sobre el mapa",
  "NavigationControl.ZoomIn": "Acercar",
  "NavigationControl.ZoomOut": "Alejar",
  "NavigationControl.ResetBearing": "Orientar al norte",
};
// Tras un toque, el navegador simula mouseenter/mouseleave: se ignoran por este tiempo (ms).
const SIN_MOUSE_TRAS_TOQUE = 800;
const esReciente = (momento: number) => Date.now() - momento < SIN_MOUSE_TRAS_TOQUE;
// Margen para pasar el mouse del punto a la tarjeta sin que se cierre (ms).
const MARGEN_SALIDA = 400;
// Encuadre inicial: los límites de Colombia continental e insular (los del validador).
const COLOMBIA = {
  bounds: [[-82, -4.3], [-66.8, 13.5]] as [[number, number], [number, number]],
  fitBoundsOptions: { padding: 24 },
};

/** La tarjeta fija es la del proyecto `seleccionado` (tabla, clic, toque o Enter en el punto);
 *  el mouse o el foco muestran otra mientras están sobre el punto o la tarjeta (RF-04,
 *  CA-04.4). Escape o «Cerrar» la cierran. */
export function MapaProyectos({
  proyectos,
  seleccionado,
  onSeleccionar,
  unidades = "MW",
}: {
  proyectos: ProyectoMapa[];
  seleccionado: string | null;
  onSeleccionar: (nombre: string | null) => void;
  /** 008: la tarjeta muestra kW/kWh en «Detrás del medidor». */
  unidades?: Unidades;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const marco = useRef<HTMLDivElement>(null);
  const [mapa, setMapa] = useState<MapaMaplibre | null>(null);
  const [, redibujar] = useReducer((n: number) => n + 1, 0);
  const [encima, setEncima] = useState<string | null>(null);
  const [falloFondo, setFalloFondo] = useState(false);
  const desdeElMapa = useRef<string | null>(null);
  const tarjeta = useRef<HTMLDivElement>(null);
  const ultimoToque = useRef(0);
  const salida = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const enfocarTarjeta = useRef(false);
  const reducido = useMovimientoReducido();

  useEffect(() => {
    let cancelado = false;
    let creado: MapaMaplibre | null = null;
    import("maplibre-gl").then((modulo) => {
      if (cancelado || !contenedor.current) return;
      const maplibre = modulo.default ?? modulo;
      const m = new maplibre.Map({
        container: contenedor.current,
        style: ESTILO,
        ...COLOMBIA,
        attributionControl: { compact: true, customAttribution: ATRIBUCION },
        locale: TEXTOS_MAPA,
      });
      creado = m;
      // Botones «Acercar» y «Alejar» (spec 007, RF-17); sin brújula porque el mapa no rota.
      m.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      let cambiado = false;
      m.on("error", () => {
        if (!cambiado && !m.loaded?.()) {
          cambiado = true;
          setFalloFondo(true);
          m.setStyle?.(ESTILO_OSM);
        }
      });
      m.on("move", redibujar);
      m.on("load", () => !cancelado && setMapa(m));
    });
    return () => {
      cancelado = true;
      creado?.remove();
    };
  }, []);

  // Selección desde la tabla (RF-07): centrar en el proyecto. Un clic en el punto no mueve el mapa.
  useEffect(() => {
    const p = proyectos.find((x) => x.nombre === seleccionado);
    if (!mapa || !p?.ubicado || desdeElMapa.current === seleccionado) return;
    const destino = { center: [p.longitud!, p.latitud!] as [number, number], zoom: 8 };
    if (reducido) mapa.jumpTo(destino);
    else mapa.flyTo(destino);
  }, [mapa, seleccionado, proyectos, reducido]);

  // Al abrir con Enter, el foco pasa a la tarjeta para llegar a «Proponer corrección» (CA-04.4).
  useEffect(() => {
    if (!enfocarTarjeta.current) return;
    enfocarTarjeta.current = false;
    tarjeta.current?.querySelector<HTMLElement>("[role='dialog']")?.focus();
  }, [seleccionado]);
  useEffect(() => () => clearTimeout(salida.current), []);

  // La tarjeta vive fuera del marco que recorta el mapa (CA-04.2, CA-04.4). En escritorio se
  // coloca sobre el punto, completa dentro del marco; en móvil va debajo del mapa, en el flujo.
  useLayoutEffect(() => {
    const t = tarjeta.current;
    const m = marco.current;
    if (!t || !m) return;
    const estilo = t.style;
    estilo.left = estilo.top = estilo.maxHeight = estilo.overflowY = "";
    const p = proyectos.find((x) => x.nombre === (encima ?? seleccionado));
    if (!mapa || !p?.ubicado || !window.matchMedia?.("(min-width: 640px)").matches) return;
    const { x, y } = mapa.project([p.longitud!, p.latitud!]);
    const r = posicionTarjeta({ x, y }, { ancho: t.offsetWidth, alto: t.offsetHeight }, { ancho: m.clientWidth, alto: m.clientHeight });
    estilo.left = `${r.left}px`;
    estilo.top = `${r.top}px`;
    if (r.maxHeight) {
      estilo.maxHeight = `${r.maxHeight}px`;
      estilo.overflowY = "auto";
    }
  });

  const esMouseDeToque = () => esReciente(ultimoToque.current);
  const mostrar = (nombre: string) => {
    clearTimeout(salida.current);
    setEncima(nombre);
  };
  const ocultarPronto = () => {
    clearTimeout(salida.current);
    salida.current = setTimeout(() => setEncima(null), MARGEN_SALIDA);
  };
  const dentroDeLaTarjeta = (el: EventTarget | null) => el instanceof Node && Boolean(tarjeta.current?.contains(el));

  const cerrar = () => {
    clearTimeout(salida.current);
    setEncima(null);
    desdeElMapa.current = null;
    onSeleccionar(null);
  };
  // Escape cierra la tarjeta esté donde esté el foco, también si se abrió con el mouse (RF-04).
  const hayTarjeta = Boolean(encima ?? seleccionado);
  useEffect(() => {
    if (!hayTarjeta) return;
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  });

  const ubicados = mapa ? proyectos.filter((p) => p.ubicado) : [];
  const posicion = (p: ProyectoMapa) => mapa!.project([p.longitud!, p.latitud!]);
  const activo = proyectos.find((p) => p.nombre === (encima ?? seleccionado));
  const sinUbicacion = proyectos.find((p) => p.nombre === seleccionado && !p.ubicado);

  return (
    <div className="relative grid gap-2">
      <div
        ref={marco}
        className="relative h-[60vh] min-h-80 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-[var(--surface-alt)]"
      >
        {/* size-full y no absolute: el CSS de MapLibre le pone position: relative al contenedor. */}
        <div ref={contenedor} className="size-full" />
        <div className="pointer-events-none absolute inset-0">
          {ubicados.map((p) => {
            const pos = posicion(p);
            return (
              <button
                key={p.nombre}
                type="button"
                aria-label={`${p.nombre} · ${p.estado}`}
                aria-expanded={activo?.nombre === p.nombre}
                onTouchStart={() => (ultimoToque.current = Date.now())}
                onMouseEnter={() => !esMouseDeToque() && mostrar(p.nombre)}
                onMouseLeave={() => !esMouseDeToque() && ocultarPronto()}
                onFocus={() => mostrar(p.nombre)}
                onBlur={(e) => !dentroDeLaTarjeta(e.relatedTarget) && setEncima(null)}
                onClick={(e) => {
                  desdeElMapa.current = p.nombre;
                  // detail 0: clic desde el teclado (Enter o espacio).
                  if (e.detail === 0) enfocarTarjeta.current = true;
                  onSeleccionar(p.nombre);
                }}
                className="pointer-events-auto absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow-[var(--shadow-card)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-heading)]"
                style={{ left: pos.x, top: pos.y, backgroundColor: colorDe(p.estado) }}
              />
            );
          })}
        </div>
        {falloFondo && (
          <p className="absolute top-2 left-2 rounded-[var(--radius-md)] bg-card px-2 py-1 text-xs">
            El mapa base alterno está en uso; la tabla tiene todos los proyectos.
          </p>
        )}
      </div>
      {activo?.ubicado && (
        <div
          ref={tarjeta}
          onMouseEnter={() => !esMouseDeToque() && clearTimeout(salida.current)}
          onMouseLeave={() => !esMouseDeToque() && ocultarPronto()}
          onBlur={(e) => !dentroDeLaTarjeta(e.relatedTarget) && setEncima(null)}
          className="z-10 sm:absolute sm:top-0 sm:left-0"
        >
          <TarjetaProyecto proyecto={activo} onCerrar={cerrar} unidades={unidades} />
        </div>
      )}
      <Leyenda />
      {sinUbicacion && (
        <p role="status" className="text-sm">
          {sinUbicacion.nombre} no tiene ubicación en el mapa; sus datos están en la tabla.
        </p>
      )}
    </div>
  );
}
