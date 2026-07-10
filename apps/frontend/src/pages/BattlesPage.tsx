import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatDate, formatNumber, THEATER_LABELS, VICTOR_LABELS, type Theater, type Victor } from '../api/client';

const VICTOR_BADGE: Record<Victor, string> = {
  ALLIED: 'bg-allied/20 text-blue-300',
  AXIS: 'bg-axis/20 text-red-300',
  STALEMATE: 'bg-neutral-700 text-neutral-300',
  INCONCLUSIVE: 'bg-neutral-800 text-neutral-400',
};

export function BattlesPage() {
  const [theater, setTheater] = useState<Theater | ''>('');
  const { data, isLoading } = useQuery({
    queryKey: ['battles', theater],
    queryFn: () => api.battles(theater ? `&theater=${theater}` : ''),
  });

  const battles = data?.data ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-parchment">Batallas</h1>
          <p className="mt-1 text-neutral-400">{data?.meta.total ?? '…'} enfrentamientos documentados.</p>
        </div>
        <select
          value={theater}
          onChange={(e) => setTheater(e.target.value as Theater | '')}
          className="ml-auto rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 font-sans-ui text-sm"
        >
          <option value="">Todos los teatros</option>
          {(Object.keys(THEATER_LABELS) as Theater[]).map((t) => (
            <option key={t} value={t}>
              {THEATER_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-neutral-500">Cargando batallas…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {battles.map((b) => (
          <Link
            key={b.id}
            to={`/batallas/${b.id}`}
            className="group rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 transition-colors hover:border-khaki/50 hover:bg-neutral-900"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-neutral-100 group-hover:text-parchment">{b.name}</h2>
              {b.victor && (
                <span className={`shrink-0 rounded px-2 py-0.5 font-sans-ui text-[10px] uppercase tracking-wide ${VICTOR_BADGE[b.victor]}`}>
                  {VICTOR_LABELS[b.victor]}
                </span>
              )}
            </div>
            <p className="mt-1 font-sans-ui text-xs text-neutral-500">
              {formatDate(b.startDate)}
              {b.endDate ? ` — ${formatDate(b.endDate)}` : ''}
            </p>
            <p className="font-sans-ui text-xs text-neutral-500">
              {b.locationName} · {THEATER_LABELS[b.theater]}
            </p>
            {b.description && <p className="mt-3 text-sm leading-relaxed text-neutral-400 line-clamp-3">{b.description}</p>}
            <p className="mt-3 font-sans-ui text-xs text-neutral-600">
              Bajas: {formatNumber((b.alliedCasualties ?? 0) + (b.axisCasualties ?? 0) + (b.civilianCasualties ?? 0))}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
