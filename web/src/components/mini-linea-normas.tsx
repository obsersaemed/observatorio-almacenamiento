// Imagen de la tarjeta «Normativa» del inicio (spec 007, RF-12): una línea de tiempo pequeña con
// 5 puntos, el último en acento (la norma más reciente). Es decorativa.
const PUNTOS = [12, 46, 80, 114, 148];

export function MiniLineaNormas({ className = "h-auto w-full max-w-56" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 40" aria-hidden="true" className={className}>
      <line x1="12" y1="20" x2="148" y2="20" stroke="var(--brand-ink)" strokeWidth={3} strokeLinecap="round" />
      {PUNTOS.map((cx, i) => {
        const ultimo = i === PUNTOS.length - 1;
        return (
          <circle
            key={cx}
            cx={cx}
            cy={20}
            r={ultimo ? 9 : 7}
            fill={ultimo ? "var(--accent)" : "var(--brand-ink)"}
            stroke="var(--card)"
            strokeWidth={2}
          />
        );
      })}
    </svg>
  );
}
