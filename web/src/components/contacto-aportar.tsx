// /aportar: correo del observatorio a primera vista y formulario de registro de proyectos en Excel,
// que se diligencia y se envía al mismo correo (pedido del usuario, 2026-10-27).
import { Download, Mail } from "lucide-react";
import { TEXTOS } from "@/lib/textos";

const { correo, formulario } = TEXTOS.aportar;
const ASUNTO = encodeURIComponent("Formulario de registro de proyectos SAEB");

export function ContactoAportar() {
  return (
    <section aria-label="Contacto y formulario de registro" className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="flex gap-3 rounded-[var(--radius-lg)] border border-border bg-[var(--surface-alt)] p-4">
        <Mail aria-hidden className="mt-0.5 size-5 shrink-0 text-[var(--text-heading)]" />
        <p>
          Cualquier comunicación o contacto con el observatorio lo puedes hacer por medio del correo{" "}
          <a href={`mailto:${correo}`} className="font-semibold text-[var(--text-link)] underline [overflow-wrap:anywhere]">
            {correo}
          </a>
          .
        </p>
      </div>
      <div className="flex gap-3 rounded-[var(--radius-lg)] border border-border bg-[var(--surface-alt)] p-4">
        <Download aria-hidden className="mt-0.5 size-5 shrink-0 text-[var(--text-heading)]" />
        <div className="grid gap-1">
          <p>
            <a href={formulario} download className="font-semibold text-[var(--text-link)] underline">
              Descargar formulario de registro de proyectos
            </a>{" "}
            (Excel)
          </p>
          <p className="text-sm">
            Diligéncialo y envíalo a{" "}
            <a
              href={`mailto:${correo}?subject=${ASUNTO}`}
              aria-label={`Enviar el formulario diligenciado a ${correo}`}
              className="font-semibold text-[var(--text-link)] underline [overflow-wrap:anywhere]"
            >
              {correo}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
