import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, SIDE_LABELS, type Side } from '../api/client';

const SIDE_BADGE: Record<Side, string> = {
  ALLIED: 'bg-allied/20 text-allied',
  AXIS: 'bg-axis/20 text-axis',
  NEUTRAL: 'bg-ink-mute/25 text-ink-dim',
};

export function PeoplePage() {
  const [side, setSide] = useState<Side | ''>('');
  const { data, isLoading } = useQuery({
    queryKey: ['people', side],
    queryFn: () => api.people(side ? `&side=${side}` : ''),
  });

  const people = data?.data ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading">Personajes</h1>
          <p className="mt-1 text-ink-dim">Líderes políticos y militares que dirigieron la guerra.</p>
        </div>
        <div className="ml-auto flex gap-1 font-sans-ui text-sm">
          {(['', 'ALLIED', 'AXIS'] as const).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setSide(s)}
              className={`rounded px-3 py-1.5 transition-colors ${
                side === s ? 'bg-khaki text-bg font-semibold' : 'bg-surface text-ink-dim hover:bg-surface-2'
              }`}
            >
              {s === '' ? 'Todos' : SIDE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-ink-mute">Cargando personajes…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p, i) => (
          <Link
            key={p.id}
            to={`/personas/${p.id}`}
            style={{ '--stagger': `${Math.min(i, 12) * 45}ms` } as React.CSSProperties}
            className="group anim-in card-lift rounded-lg border border-line bg-surface p-5 hover:border-khaki/50"
          >
            <div className="flex items-start gap-4">
              {p.photoUrl ? (
                <img
                  src={p.photoUrl}
                  alt={p.fullName}
                  loading="lazy"
                  className="photo-historic h-16 w-16 shrink-0 rounded-full border border-line object-cover object-top"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-xl font-bold text-ink-mute">
                  {p.fullName.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold leading-snug text-ink group-hover:text-heading">{p.fullName}</h2>
                  <span className={`shrink-0 rounded px-2 py-0.5 font-sans-ui text-[10px] uppercase tracking-wide ${SIDE_BADGE[p.side]}`}>
                    {SIDE_LABELS[p.side]}
                  </span>
                </div>
                <p className="mt-1 font-sans-ui text-xs text-ink-mute">
                  {p.rank ? `${p.rank} · ` : ''}
                  {p.role} · {p.nationality}
                </p>
              </div>
            </div>
            {p.biography && <p className="mt-3 text-sm leading-relaxed text-ink-dim line-clamp-3">{p.biography}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
