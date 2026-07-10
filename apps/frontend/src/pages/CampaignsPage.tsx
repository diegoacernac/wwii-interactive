import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatDate, THEATER_LABELS } from '../api/client';

export function CampaignsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['campaigns'], queryFn: api.campaigns });
  const campaigns = data?.data ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-parchment">Campañas</h1>
        <p className="mt-1 text-neutral-400">Las grandes operaciones estratégicas que estructuraron el conflicto.</p>
      </div>

      {isLoading && <p className="text-neutral-500">Cargando campañas…</p>}

      <div className="space-y-6">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} id={c.id} />
        ))}
      </div>
    </div>
  );
}

function CampaignCard({ id }: { id: string }) {
  const { data: c } = useQuery({ queryKey: ['campaign', id], queryFn: () => api.campaign(id) });
  if (!c) return <div className="h-40 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/30" />;

  return (
    <article className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-2xl font-semibold text-neutral-100">{c.name}</h2>
        <span className="font-sans-ui text-xs uppercase tracking-wider text-khaki">{THEATER_LABELS[c.theater]}</span>
      </div>
      <p className="mt-1 font-sans-ui text-sm text-neutral-500">
        {formatDate(c.startDate)} — {formatDate(c.endDate)}
      </p>
      {c.description && <p className="mt-3 max-w-4xl leading-relaxed text-neutral-300">{c.description}</p>}
      <div className="mt-4 grid gap-3 font-sans-ui text-sm sm:grid-cols-2">
        {c.objective && (
          <p className="text-neutral-400">
            <span className="font-semibold text-neutral-300">Objetivo: </span>
            {c.objective}
          </p>
        )}
        {c.outcome && (
          <p className="text-neutral-400">
            <span className="font-semibold text-neutral-300">Resultado: </span>
            {c.outcome}
          </p>
        )}
      </div>
      {c.battles.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {c.battles.map((cb) => (
            <Link
              key={cb.battle.id}
              to={`/batallas/${cb.battle.id}`}
              className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 font-sans-ui text-xs text-neutral-300 hover:border-khaki hover:text-khaki"
            >
              {cb.battleOrder != null ? `${cb.battleOrder}. ` : ''}
              {cb.battle.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
