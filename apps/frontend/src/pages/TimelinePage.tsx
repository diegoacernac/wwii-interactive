import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, CATEGORY_LABELS, formatDate, type EventCategory } from '../api/client';
import { Reveal } from '../components/Reveal';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  MILITARY: 'bg-axis/20 text-axis border-axis/40',
  POLITICAL: 'bg-allied/20 text-allied border-allied/40',
  ECONOMIC: 'bg-khaki/20 text-khaki border-khaki/40',
  CULTURAL: 'bg-olive/30 text-olive border-olive/60',
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
        <h1 className="text-3xl font-bold text-heading">Cronología de la guerra</h1>
        <p className="mt-1 text-ink-dim">
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
        <label className="ml-auto flex items-center gap-2 text-ink-dim">
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

      {isLoading && <p className="text-ink-mute">Cargando cronología…</p>}

      <div className="space-y-12">
        {byYear.map(({ year, events }) => (
          <section key={year}>
            <Reveal>
              <h2 className="mb-6 text-5xl font-bold text-ghost select-none">{year}</h2>
            </Reveal>
            <ol className="relative border-l-2 border-line space-y-6 pl-6 ml-2">
              {events.map((e) => (
                <Reveal as="li" key={e.id} className="relative">
                  <span
                    className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-bg ${
                      e.significanceLevel >= 5 ? 'bg-khaki pulse-dot' : e.significanceLevel >= 4 ? 'bg-olive' : 'bg-ink-mute'
                    }`}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <time className="font-sans-ui text-xs uppercase tracking-wider text-ink-mute">
                      {formatDate(e.eventDate)}
                    </time>
                    <span
                      className={`rounded border px-1.5 py-0.5 font-sans-ui text-[10px] uppercase tracking-wider ${CATEGORY_COLORS[e.category]}`}
                    >
                      {CATEGORY_LABELS[e.category]}
                    </span>
                    {e.region && <span className="font-sans-ui text-xs text-ink-mute">{e.region}</span>}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-ink">{e.title}</h3>
                  {e.description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-dim">{e.description}</p>}
                </Reveal>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {!isLoading && events.length === 0 && (
        <p className="text-ink-mute">No hay eventos que cumplan los filtros seleccionados.</p>
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
        active ? 'bg-khaki text-bg font-semibold' : 'bg-surface text-ink-dim hover:bg-surface-2'
      }`}
    >
      {children}
    </button>
  );
}
