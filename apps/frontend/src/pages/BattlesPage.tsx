import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatDate, formatNumber, THEATER_LABELS, VICTOR_LABELS, type Theater, type Victor } from '../api/client';

const VICTOR_BADGE: Record<Victor, string> = {
  ALLIED: 'bg-allied/20 text-allied',
  AXIS: 'bg-axis/20 text-axis',
  STALEMATE: 'bg-ink-mute/25 text-ink-dim',
  INCONCLUSIVE: 'bg-surface-2 text-ink-dim',
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
          <h1 className="text-3xl font-bold text-heading">Batallas</h1>
          <p className="mt-1 text-ink-dim">{data?.meta.total ?? '…'} enfrentamientos documentados.</p>
        </div>
        <select
          value={theater}
          onChange={(e) => setTheater(e.target.value as Theater | '')}
          className="ml-auto rounded border border-line bg-surface px-3 py-1.5 font-sans-ui text-sm"
        >
          <option value="">Todos los teatros</option>
          {(Object.keys(THEATER_LABELS) as Theater[]).map((t) => (
            <option key={t} value={t}>
              {THEATER_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-ink-mute">Cargando batallas…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {battles.map((b, i) => (
          <Link
            key={b.id}
            to={`/batallas/${b.id}`}
            style={{ '--stagger': `${Math.min(i, 12) * 45}ms` } as React.CSSProperties}
            className="group anim-in card-lift overflow-hidden rounded-lg border border-line bg-surface hover:border-khaki/50"
          >
            {b.imageUrl && (
              <div className="h-36 overflow-hidden border-b border-line">
                <img src={b.imageUrl} alt="" loading="lazy" className="photo-historic h-full w-full object-cover" />
              </div>
            )}
            <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-ink group-hover:text-heading">{b.name}</h2>
              {b.victor && (
                <span className={`shrink-0 rounded px-2 py-0.5 font-sans-ui text-[10px] uppercase tracking-wide ${VICTOR_BADGE[b.victor]}`}>
                  {VICTOR_LABELS[b.victor]}
                </span>
              )}
            </div>
            <p className="mt-1 font-sans-ui text-xs text-ink-mute">
              {formatDate(b.startDate)}
              {b.endDate ? ` — ${formatDate(b.endDate)}` : ''}
            </p>
            <p className="font-sans-ui text-xs text-ink-mute">
              {b.locationName} · {THEATER_LABELS[b.theater]}
            </p>
            {b.description && <p className="mt-3 text-sm leading-relaxed text-ink-dim line-clamp-3">{b.description}</p>}
            <p className="mt-3 font-sans-ui text-xs text-ink-mute">
              Bajas: {formatNumber((b.alliedCasualties ?? 0) + (b.axisCasualties ?? 0) + (b.civilianCasualties ?? 0))}
            </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
