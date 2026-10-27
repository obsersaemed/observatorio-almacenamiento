// Ícono de la tarjeta «Vehículos» del inicio (spec 007, RF-12): un vehículo eléctrico enchufado,
// de trazo, en el gris oscuro con el rayo y el cable en acento. Es decorativo.
export function IconoVehiculo({ className = "h-full w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      stroke="var(--brand-ink)"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Carrocería y cabina */}
      <path d="M10 52 V42 L22 38 L34 24 H66 L80 38 L92 40 V52" />
      <path d="M38 28 L30 38 H76 L66 28 Z" />
      <path d="M10 52 H20 M40 52 H62 M82 52 H92" />
      {/* Ruedas */}
      <circle cx="30" cy="54" r="8" />
      <circle cx="72" cy="54" r="8" />
      {/* Rayo de la batería */}
      <path d="M53 40 L48 46 H54 L49 52" stroke="var(--accent)" />
      {/* Cable y cargador */}
      <path d="M92 46 C102 46 104 60 110 60 V40" stroke="var(--accent)" />
      <rect x="104" y="26" width="12" height="14" rx="2" />
      <path d="M108 26 V21 M112 26 V21" />
    </svg>
  );
}
