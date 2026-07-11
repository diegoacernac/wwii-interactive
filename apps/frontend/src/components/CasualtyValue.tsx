// "Modo conmemorativo": traduce una cifra de bajas a equivalencias tangibles
// para dimensionar la pérdida humana. Se muestran al pasar el cursor.

interface Reference {
  singular: string;
  plural: string;
  size: number;
}

// Referencias aproximadas de población hacia 1940, para dar escala humana.
const REFERENCES: Reference[] = [
  { singular: 'la población de Lima en 1940', plural: 'veces la población de Lima en 1940', size: 645_000 },
  { singular: 'la población de Ámsterdam en 1940', plural: 'veces la población de Ámsterdam en 1940', size: 800_000 },
  { singular: 'un estadio lleno (Estadio Nacional)', plural: 'estadios llenos (Estadio Nacional)', size: 45_000 },
  { singular: 'una división de infantería', plural: 'divisiones de infantería', size: 15_000 },
];

function equivalences(value: number): string[] {
  if (value <= 0) return [];
  return REFERENCES.map((r) => {
    const ratio = value / r.size;
    if (ratio < 0.5) return null;
    if (ratio < 1.5) return `≈ ${r.singular}`;
    return `≈ ${Math.round(ratio).toLocaleString('es-ES')} ${r.plural}`;
  }).filter((x): x is string => x !== null);
}

export function CasualtyValue({ value, display }: { value: number; display: string }) {
  const eqs = equivalences(value);
  return (
    <span className="group/eq relative cursor-help border-b border-dotted border-ink-mute/50">
      {display}
      {eqs.length > 0 && (
        <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 rounded-lg border border-line bg-surface p-3 text-left font-sans-ui text-xs font-normal text-ink-dim opacity-0 shadow-2xl transition-opacity duration-200 group-hover/eq:opacity-100">
          <span className="mb-1 block font-semibold uppercase tracking-wider text-khaki">Para dimensionarlo</span>
          {eqs.map((e) => (
            <span key={e} className="block leading-relaxed">
              {e}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
