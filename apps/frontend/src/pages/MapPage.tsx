import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api, formatDate, formatNumber, THEATER_LABELS, VICTOR_LABELS, type Theater } from '../api/client';
import { useMapTiles } from '../theme';

const THEATER_COLORS: Record<Theater, string> = {
  EUROPEAN: '#3b82c4',
  EASTERN_FRONT: '#c0503c',
  PACIFIC: '#2a9d8f',
  NORTH_AFRICAN: '#e9c46a',
  MEDITERRANEAN: '#8e7cc3',
  ATLANTIC: '#5f6b3c',
  OTHER: '#888888',
};

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const SPEEDS = [
  { label: '0.5×', ms: 900 },
  { label: '1×', ms: 450 },
  { label: '2×', ms: 200 },
  { label: '4×', ms: 90 },
];
const HIGHLIGHT_MONTHS = 2; // battles started within this window of the cursor "pulse"

// Month index helpers (months since year 0), all UTC.
const toMonthIndex = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
};
const monthLabel = (idx: number) => `${MONTHS_ES[idx % 12]} ${Math.floor(idx / 12)}`;

// Parse "?at=YYYY-MM" into a month index for a shareable, deep-linked map state.
function parseAtParam(at: string | null): number | null {
  if (!at) return null;
  const m = at.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (month < 0 || month > 11) return null;
  return year * 12 + month;
}

export function MapPage() {
  const tiles = useMapTiles();
  const [searchParams] = useSearchParams();
  const [theater, setTheater] = useState<Theater | ''>('');
  const [playing, setPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(SPEEDS[1].ms);
  const [cursor, setCursor] = useState<number | null>(null); // month index; null until data loads
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['mapBattles'], queryFn: api.mapBattles });

  // Full month range across the dataset.
  const range = useMemo(() => {
    const idxs = (data?.features ?? []).map((f) => toMonthIndex(f.properties.startDate));
    if (idxs.length === 0) return null;
    return { min: Math.min(...idxs), max: Math.max(...idxs) };
  }, [data]);

  // Initialise the cursor once data arrives: honour a "?at=YYYY-MM" deep link
  // (clamped to range), otherwise start at the end so the map shows everything.
  useEffect(() => {
    if (!range || cursor !== null) return;
    const fromParam = parseAtParam(searchParams.get('at'));
    if (fromParam != null) {
      setCursor(Math.max(range.min, Math.min(range.max, fromParam)));
    } else {
      setCursor(range.max);
    }
  }, [range, cursor, searchParams]);

  // Animation loop.
  useEffect(() => {
    if (!playing || !range) return;
    timer.current = setInterval(() => {
      setCursor((c) => {
        const next = (c ?? range.min) + 1;
        if (next >= range.max) {
          setPlaying(false);
          return range.max;
        }
        return next;
      });
    }, speedMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, speedMs, range]);

  const play = () => {
    if (!range) return;
    // If we're at the end, restart from the beginning.
    setCursor((c) => (c != null && c >= range.max ? range.min : c));
    setPlaying(true);
  };

  const theatersPresent = useMemo(
    () => [...new Set((data?.features ?? []).map((f) => f.properties.theater))].sort(),
    [data]
  );

  const visible = useMemo(() => {
    let f = data?.features ?? [];
    if (theater) f = f.filter((x) => x.properties.theater === theater);
    if (cursor != null) f = f.filter((x) => toMonthIndex(x.properties.startDate) <= cursor);
    return f;
  }, [data, theater, cursor]);

  const atEnd = range != null && cursor != null && cursor >= range.max;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">Mapa de batallas</h1>
          <p className="mt-1 text-ink-dim">
            {visible.length} batallas
            {cursor != null && !atEnd ? ` hasta ${monthLabel(cursor)}` : ''} · el tamaño refleja las bajas.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3 font-sans-ui text-sm">
          <select
            value={theater}
            onChange={(e) => setTheater(e.target.value as Theater | '')}
            className="rounded border border-line bg-surface px-3 py-1.5"
          >
            <option value="">Todos los teatros</option>
            {theatersPresent.map((t) => (
              <option key={t} value={t}>
                {THEATER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="anim-in overflow-hidden rounded-lg border border-line">
        <MapContainer center={[30, 20]} zoom={3} style={{ height: '62vh', background: tiles.background }} scrollWheelZoom>
          <TileLayer
            key={tiles.key}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url={tiles.url}
          />
          {visible.map((f) => {
            const p = f.properties;
            const radius = Math.max(5, Math.min(26, Math.sqrt(p.totalCasualties / 8000) + 5));
            const monthsSinceStart = cursor != null ? cursor - toMonthIndex(p.startDate) : Infinity;
            const isRecent = !atEnd && monthsSinceStart >= 0 && monthsSinceStart <= HIGHLIGHT_MONTHS;
            return (
              <CircleMarker
                key={p.id}
                center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
                radius={isRecent ? radius + 3 : radius}
                pathOptions={{
                  color: isRecent ? (tiles.key === 'dark' ? '#f2ead9' : '#2b2416') : THEATER_COLORS[p.theater],
                  fillColor: THEATER_COLORS[p.theater],
                  fillOpacity: isRecent ? 0.85 : atEnd ? 0.5 : 0.32,
                  weight: isRecent ? 2.5 : 1,
                }}
              >
                <Popup>
                  <div className="font-sans-ui">
                    <p className="font-bold text-base mb-1">{p.name}</p>
                    <p className="text-xs">
                      {formatDate(p.startDate)}
                      {p.endDate ? ` — ${formatDate(p.endDate)}` : ''}
                    </p>
                    <p className="text-xs">{p.locationName}</p>
                    <p className="text-xs">
                      {THEATER_LABELS[p.theater]}
                      {p.victor ? ` · ${VICTOR_LABELS[p.victor]}` : ''}
                    </p>
                    {p.totalCasualties > 0 && <p className="text-xs">Bajas: {formatNumber(p.totalCasualties)}</p>}
                    <Link to={`/batallas/${p.id}`} className="text-xs font-semibold underline">
                      Ver detalle →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Temporal animation controls */}
      {range && cursor != null && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3 font-sans-ui">
          <button
            onClick={() => (playing ? setPlaying(false) : play())}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-khaki text-bg transition-colors hover:bg-khaki/80"
            aria-label={playing ? 'Pausar' : 'Reproducir'}
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" rx="1" />
                <rect x="9" y="2" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2.5v11a.5.5 0 0 0 .77.42l8.5-5.5a.5.5 0 0 0 0-.84l-8.5-5.5A.5.5 0 0 0 4 2.5Z" />
              </svg>
            )}
          </button>

          <div className="w-32 shrink-0">
            <div className="text-lg font-bold text-heading tabular-nums">{monthLabel(cursor)}</div>
            <div className="text-xs text-ink-mute">{visible.length} batallas visibles</div>
          </div>

          <input
            type="range"
            min={range.min}
            max={range.max}
            value={cursor}
            onChange={(e) => {
              setPlaying(false);
              setCursor(Number(e.target.value));
            }}
            className="min-w-[200px] flex-1 accent-khaki"
          />

          <div className="flex shrink-0 gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s.label}
                onClick={() => setSpeedMs(s.ms)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  speedMs === s.ms ? 'bg-olive text-white' : 'bg-surface-2 text-ink-dim hover:bg-surface-2'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setPlaying(false);
              setCursor(range.max);
            }}
            className="shrink-0 rounded px-3 py-1.5 text-xs text-ink-dim hover:bg-surface-2 hover:text-ink"
          >
            Ver todo
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 font-sans-ui text-xs text-ink-dim">
        {theatersPresent.map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: THEATER_COLORS[t] }} />
            {THEATER_LABELS[t]}
          </span>
        ))}
      </div>
      {isLoading && <p className="mt-4 text-ink-mute">Cargando mapa…</p>}
    </div>
  );
}
