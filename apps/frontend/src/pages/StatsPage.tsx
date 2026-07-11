import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, formatNumber, THEATER_LABELS, type Victor } from '../api/client';
import { useTheme } from '../theme';

// Paletas validadas con el validador CVD: dark sobre #171717 (ΔE 66.4),
// light sobre #fdfbf5 (ΔE 82.3); contraste ≥ 3:1 en ambos.
const PALETTES = {
  dark: { allied: '#3987e5', axis: '#e66767', neutral: '#898781', grid: '#2c2c2a', ink: '#c3c2b7', mute: '#898781', axisLine: '#383835' },
  light: { allied: '#2a78d6', axis: '#c0392b', neutral: '#857c69', grid: '#ddd5c2', ink: '#4e473a', mute: '#857c69', axisLine: '#c8bfa9' },
} as const;

function usePalette() {
  const { theme } = useTheme();
  return PALETTES[theme];
}

export function StatsPage() {
  const overview = useQuery({ queryKey: ['statsOverview'], queryFn: api.statsOverview });
  const byTheater = useQuery({ queryKey: ['casualtiesByTheater'], queryFn: api.casualtiesByTheater });
  const byYear = useQuery({ queryKey: ['battlesByYear'], queryFn: api.battlesByYear });
  const { allied: ALLIED, axis: AXIS, neutral: NEUTRAL, ink: INK } = usePalette();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-heading">Estadísticas</h1>
        <p className="mt-1 text-ink-dim">El coste humano y la escala del conflicto, según los datos de la plataforma.</p>
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
        <section className="rounded-lg border border-line bg-surface p-6">
          <h2 className="font-sans-ui text-base font-semibold text-ink">Bajas militares por teatro</h2>
          <div className="mt-1 flex gap-4 font-sans-ui text-xs" style={{ color: INK }}>
            <LegendSwatch color={ALLIED} label="Aliados" />
            <LegendSwatch color={AXIS} label="Eje" />
          </div>
          {byTheater.data && <TheaterChart data={byTheater.data} />}
        </section>

        <section className="rounded-lg border border-line bg-surface p-6">
          <h2 className="font-sans-ui text-base font-semibold text-ink">Batallas por año y vencedor</h2>
          <div className="mt-1 flex gap-4 font-sans-ui text-xs" style={{ color: INK }}>
            <LegendSwatch color={ALLIED} label="Victoria aliada" />
            <LegendSwatch color={AXIS} label="Victoria del Eje" />
            <LegendSwatch color={NEUTRAL} label="Otro / sin dato" />
          </div>
          {byYear.data && <YearChart data={byYear.data} />}
        </section>
      </div>
    </div>
  );
}

// Cuenta desde 0 hasta el valor con easing, una sola vez al montar.
function useCountUp(target: number, durationMs = 1100): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, durationMs]);
  return value;
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const shown = useCountUp(value);
  return (
    <div className="anim-in card-lift rounded-lg border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-wider text-ink-mute">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink tabular-nums">
        {accent && <span className="mr-2 inline-block h-3 w-3 rounded-sm align-baseline" style={{ background: accent }} />}
        {formatNumber(shown)}
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
  const { allied: ALLIED, axis: AXIS, grid: GRID, ink: INK, mute: INK_MUTED } = usePalette();
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
  const { allied: ALLIED, axis: AXIS, neutral: NEUTRAL, grid: GRID, ink: INK, mute: INK_MUTED, axisLine: AXIS_LINE } = usePalette();
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

  // ~4 gridlines con paso "bonito" (1, 2, 5 × 10^k), sea max 6 o 600.
  const rawStep = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rawStep) ?? pow * 10;
  const ticks: number[] = [];
  for (let n = step; n <= max; n += step) ticks.push(n);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full font-sans-ui" role="img" aria-label="Batallas por año según el vencedor">
      {ticks.map((n) => (
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
          { v: s.other, c: NEUTRAL, l: 'Otro o sin dato' },
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
      <line x1={padL} y1={H - padB} x2={W} y2={H - padB} stroke={AXIS_LINE} strokeWidth={1} />
    </svg>
  );
}
