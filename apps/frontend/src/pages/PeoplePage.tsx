import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, SIDE_LABELS, type Side } from '../api/client';

const SIDE_BADGE: Record<Side, string> = {
  ALLIED: 'bg-allied/20 text-blue-300',
  AXIS: 'bg-axis/20 text-red-300',
  NEUTRAL: 'bg-neutral-700 text-neutral-300',
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
          <h1 className="text-3xl font-bold text-parchment">Personajes</h1>
          <p className="mt-1 text-neutral-400">Líderes políticos y militares que dirigieron la guerra.</p>
        </div>
        <div className="ml-auto flex gap-1 font-sans-ui text-sm">
          {(['', 'ALLIED', 'AXIS'] as const).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setSide(s)}
              className={`rounded px-3 py-1.5 transition-colors ${
                side === s ? 'bg-khaki text-neutral-950 font-semibold' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {s === '' ? 'Todos' : SIDE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-neutral-500">Cargando personajes…</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <Link
            key={p.id}
            to={`/personas/${p.id}`}
            className="group rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 transition-colors hover:border-khaki/50 hover:bg-neutral-900"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-neutral-100 group-hover:text-parchment">{p.fullName}</h2>
              <span className={`shrink-0 rounded px-2 py-0.5 font-sans-ui text-[10px] uppercase tracking-wide ${SIDE_BADGE[p.side]}`}>
                {SIDE_LABELS[p.side]}
              </span>
            </div>
            <p className="mt-1 font-sans-ui text-xs text-neutral-500">
              {p.rank ? `${p.rank} · ` : ''}
              {p.role} · {p.nationality}
            </p>
            {p.biography && <p className="mt-3 text-sm leading-relaxed text-neutral-400 line-clamp-3">{p.biography}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
