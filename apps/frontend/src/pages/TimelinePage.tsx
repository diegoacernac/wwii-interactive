import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, CATEGORY_LABELS, formatDate, type EventCategory } from '../api/client';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  MILITARY: 'bg-axis/20 text-red-300 border-axis/40',
  POLITICAL: 'bg-allied/20 text-blue-300 border-allied/40',
  ECONOMIC: 'bg-khaki/20 text-yellow-200 border-khaki/40',
  CULTURAL: 'bg-olive/30 text-green-200 border-olive/60',
};

const YEARS = [1939, 1940, 1941, 1942, 1943, 1944, 1945];

export function TimelinePage() {
  const [category, setCategory] = useState<EventCategory | ''>('');
  const [minSig, setMinSig] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['events', category, minSig],
    queryFn: () => api.events(`${category ? `&category=${category}` : ''}&minSignificance=${minSig}`),
  });

  const events = data?.data ?? [];
  const byYear = YEARS.map((year) => ({
    year,
    events: events.filter((e) => new Date(e.eventDate).getUTCFullYear() === year),
  })).filter((g) => g.events.length > 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-parchment">Cronología de la guerra</h1>
        <p className="mt-1 text-neutral-400">
          Los acontecimientos que definieron el conflicto más grande de la historia, 1939–1945.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 font-sans-ui text-sm">
        <div className="flex gap-1">
          <FilterButton active={category === ''} onClick={() => setCategory('')}>
            Todos
          </FilterButton>
          {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((c) => (
            <FilterButton key={c} active={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABELS[c]}
            </FilterButton>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-neutral-400">
          Relevancia mínima
          <input
            type="range"
            min={1}
            max={5}
            value={minSig}
            onChange={(e) => setMinSig(Number(e.target.value))}
            className="accent-khaki"
          />
          <span className="w-4 text-center text-khaki font-semibold">{minSig}</span>
        </label>
      </div>

      {isLoading && <p className="text-neutral-500">Cargando cronología…</p>}

      <div className="space-y-12">
        {byYear.map(({ year, events }) => (
          <section key={year}>
            <h2 className="mb-6 text-5xl font-bold text-neutral-800 select-none">{year}</h2>
            <ol className="relative border-l-2 border-neutral-800 space-y-6 pl-6 ml-2">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span
                    className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-neutral-950 ${
                      e.significanceLevel >= 5 ? 'bg-khaki' : e.significanceLevel >= 4 ? 'bg-olive' : 'bg-neutral-600'
                    }`}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <time className="font-sans-ui text-xs uppercase tracking-wider text-neutral-500">
                      {formatDate(e.eventDate)}
                    </time>
                    <span
                      className={`rounded border px-1.5 py-0.5 font-sans-ui text-[10px] uppercase tracking-wider ${CATEGORY_COLORS[e.category]}`}
                    >
                      {CATEGORY_LABELS[e.category]}
                    </span>
                    {e.region && <span className="font-sans-ui text-xs text-neutral-600">{e.region}</span>}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-neutral-100">{e.title}</h3>
                  {e.description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-400">{e.description}</p>}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {!isLoading && events.length === 0 && (
        <p className="text-neutral-500">No hay eventos que cumplan los filtros seleccionados.</p>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1.5 transition-colors ${
        active ? 'bg-khaki text-neutral-950 font-semibold' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
      }`}
    >
      {children}
    </button>
  );
}
