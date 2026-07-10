import { useQuery } from '@tanstack/react-query';
import { api, formatNumber, THEATER_LABELS, type Victor } from '../api/client';

// Validated for dark surface (#171717): CVD ΔE 66.4, contrast ≥ 3:1
const ALLIED = '#3987e5';
const AXIS = '#e66767';
const NEUTRAL = '#898781';
const GRID = '#2c2c2a';
const INK_MUTED = '#898781';
const INK = '#c3c2b7';

export function StatsPage() {
  const overview = useQuery({ queryKey: ['statsOverview'], queryFn: api.statsOverview });
  const byTheater = useQuery({ queryKey: ['casualtiesByTheater'], queryFn: api.casualtiesByTheater });
  const byYear = useQuery({ queryKey: ['battlesByYear'], queryFn: api.battlesByYear });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-parchment">Estadísticas</h1>
        <p className="mt-1 text-neutral-400">El coste humano y la escala del conflicto, según los datos de la plataforma.</p>
      </div>

      {overview.data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-sans-ui">
          <StatTile label="Batallas documentadas" value={overview.data.counts.battles} />
          <StatTile label="Eventos históricos" value={overview.data.counts.events} />
          <StatTile label="Personajes" value={overview.data.counts.people} />
          <StatTile label="Campañas" value={overview.data.counts.campaigns} />
        </div>
      )}

      {overview.data && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3 font-sans-ui">
          <StatTile label="Bajas aliadas (batallas registradas)" value={overview.data.casualties.allied} accent={ALLIED} />
          <StatTile label="Bajas del Eje (batallas registradas)" value={overview.data.casualties.axis} accent={AXIS} />
          <StatTile label="Bajas civiles (batallas registradas)" value={overview.data.casualties.civilian} accent={NEUTRAL} />
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
          <h2 className="font-sans-ui text-base font-semibold text-neutral-200">Bajas militares por teatro</h2>
          <div className="mt-1 flex gap-4 font-sans-ui text-xs" style={{ color: INK }}>
            <LegendSwatch color={ALLIED} label="Aliados" />
            <LegendSwatch color={AXIS} label="Eje" />
          </div>
          {byTheater.data && <TheaterChart data={byTheater.data} />}
        </section>

        <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
          <h2 className="font-sans-ui text-base font-semibold text-neutral-200">Batallas por año y vencedor</h2>
          <div className="mt-1 flex gap-4 font-sans-ui text-xs" style={{ color: INK }}>
            <LegendSwatch color={ALLIED} label="Victoria aliada" />
            <LegendSwatch color={AXIS} label="Victoria del Eje" />
            <LegendSwatch color={NEUTRAL} label="Otro resultado" />
          </div>
          {byYear.data && <YearChart data={byYear.data} />}
        </section>
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
      <p className="text-xs uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-neutral-100">
        {accent && <span className="mr-2 inline-block h-3 w-3 rounded-sm align-baseline" style={{ background: accent }} />}
        {formatNumber(value)}
      </p>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function TheaterChart({ data }: { data: { theater: keyof typeof THEATER_LABELS; allied: number; axis: number }[] }) {
  const rows = [...data].sort((a, b) => b.allied + b.axis - (a.allied + a.axis));
  const max = Math.max(...rows.flatMap((r) => [r.allied, r.axis]));
  const W = 520;
  const labelW = 130;
  const barH = 12;
  const groupGap = 22;
  const groupH = barH * 2 + 2 + groupGap;
  const H = rows.length * groupH;
  const plotW = W - labelW - 70;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full font-sans-ui" role="img" aria-label="Bajas por teatro de operaciones">
      {rows.map((r, i) => {
        const y = i * groupH;
        const wA = Math.max(2, (r.allied / max) * plotW);
        const wX = Math.max(2, (r.axis / max) * plotW);
        return (
          <g key={r.theater}>
            <text x={labelW - 8} y={y + barH + 4} textAnchor="end" fontSize={11} fill={INK}>
              {THEATER_LABELS[r.theater]}
            </text>
            <rect x={labelW} y={y} width={wA} height={barH} rx={3} fill={ALLIED}>
              <title>{`${THEATER_LABELS[r.theater]} · Aliados: ${formatNumber(r.allied)}`}</title>
            </rect>
            <text x={labelW + wA + 6} y={y + barH - 2} fontSize={10} fill={INK_MUTED}>
              {formatNumber(r.allied)}
            </text>
            <rect x={labelW} y={y + barH + 2} width={wX} height={barH} rx={3} fill={AXIS}>
              <title>{`${THEATER_LABELS[r.theater]} · Eje: ${formatNumber(r.axis)}`}</title>
            </rect>
            <text x={labelW + wX + 6} y={y + barH * 2} fontSize={10} fill={INK_MUTED}>
              {formatNumber(r.axis)}
            </text>
          </g>
        );
      })}
      <line x1={labelW} y1={0} x2={labelW} y2={H - groupGap + 4} stroke={GRID} strokeWidth={1} />
    </svg>
  );
}

function YearChart({ data }: { data: { year: number; victor: Victor | null; count: number }[] }) {
  const years = [...new Set(data.map((d) => d.year))].sort();
  const stacks = years.map((year) => {
    const rows = data.filter((d) => d.year === year);
    const get = (v: Victor) => rows.find((r) => r.victor === v)?.count ?? 0;
    const other = rows.filter((r) => r.victor !== 'ALLIED' && r.victor !== 'AXIS').reduce((s, r) => s + r.count, 0);
    return { year, allied: get('ALLIED'), axis: get('AXIS'), other };
  });
  const max = Math.max(...stacks.map((s) => s.allied + s.axis + s.other));
  const W = 520;
  const H = 250;
  const padB = 24;
  const padL = 28;
  const plotH = H - padB - 20;
  const band = (W - padL) / stacks.length;
  const barW = Math.min(40, band * 0.55);
  const scale = (n: number) => (n / max) * plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full font-sans-ui" role="img" aria-label="Batallas por año según el vencedor">
      {[...Array(max + 1).keys()].filter((n) => n > 0 && n % 2 === 0).map((n) => (
        <g key={n}>
          <line x1={padL} y1={H - padB - scale(n)} x2={W} y2={H - padB - scale(n)} stroke={GRID} strokeWidth={1} />
          <text x={padL - 6} y={H - padB - scale(n) + 3} textAnchor="end" fontSize={10} fill={INK_MUTED}>
            {n}
          </text>
        </g>
      ))}
      {stacks.map((s, i) => {
        const x = padL + i * band + (band - barW) / 2;
        const total = s.allied + s.axis + s.other;
        let y = H - padB;
        const segs = [
          { v: s.allied, c: ALLIED, l: 'Victoria aliada' },
          { v: s.axis, c: AXIS, l: 'Victoria del Eje' },
          { v: s.other, c: NEUTRAL, l: 'Otro resultado' },
        ].filter((seg) => seg.v > 0);
        return (
          <g key={s.year}>
            {segs.map((seg, j) => {
              const h = Math.max(2, scale(seg.v) - 2);
              y -= scale(seg.v);
              const isTop = j === segs.length - 1;
              return (
                <rect key={seg.l} x={x} y={y} width={barW} height={h} rx={isTop ? 3 : 0} fill={seg.c}>
                  <title>{`${s.year} · ${seg.l}: ${seg.v}`}</title>
                </rect>
              );
            })}
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={10} fill={INK_MUTED}>
              {total}
            </text>
            <text x={x + barW / 2} y={H - padB + 14} textAnchor="middle" fontSize={11} fill={INK}>
              {s.year}
            </text>
          </g>
        );
      })}
      <line x1={padL} y1={H - padB} x2={W} y2={H - padB} stroke="#383835" strokeWidth={1} />
    </svg>
  );
}
