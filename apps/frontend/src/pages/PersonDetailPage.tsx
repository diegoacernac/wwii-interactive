import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatDate, SIDE_LABELS, THEATER_LABELS, VICTOR_LABELS } from '../api/client';
import { Narrative } from '../components/Narrative';

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: p, isLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: () => api.person(id!),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-neutral-500">Cargando biografía…</p>;
  if (!p) return <p className="text-neutral-500">Personaje no encontrado.</p>;

  return (
    <div className="max-w-4xl">
      <Link to="/personas" className="font-sans-ui text-sm text-khaki hover:underline">
        ← Todos los personajes
      </Link>
      <h1 className="mt-3 text-4xl font-bold text-parchment">{p.fullName}</h1>
      <p className="mt-2 font-sans-ui text-sm text-neutral-400">
        {p.rank ? `${p.rank} · ` : ''}
        {p.role} · {p.nationality} · {SIDE_LABELS[p.side]}
      </p>
      <p className="font-sans-ui text-sm text-neutral-500">
        {formatDate(p.birthDate)} — {formatDate(p.deathDate)}
        {p.birthPlace ? ` · ${p.birthPlace}` : ''}
      </p>

      {p.biography && <p className="mt-6 text-lg leading-relaxed text-neutral-200">{p.biography}</p>}

      {p.narrative && (
        <div className="mt-6">
          <Narrative text={p.narrative} sourceUrl={p.narrativeSourceUrl} />
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {p.notablePositions.length > 0 && (
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
            <h2 className="font-sans-ui text-sm font-bold uppercase tracking-wider text-khaki">Cargos destacados</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-300">
              {p.notablePositions.map((pos) => (
                <li key={pos}>{pos}</li>
              ))}
            </ul>
          </section>
        )}
        {p.keyAchievements.length > 0 && (
          <section className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
            <h2 className="font-sans-ui text-sm font-bold uppercase tracking-wider text-khaki">Hitos</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-300">
              {p.keyAchievements.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {p.battles.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-parchment">Batallas</h2>
          <ul className="space-y-2">
            {p.battles.map((bp) => (
              <li key={bp.battle.id}>
                <Link
                  to={`/batallas/${bp.battle.id}`}
                  className="flex flex-wrap items-baseline gap-x-3 rounded border border-neutral-800 bg-neutral-900/50 px-4 py-3 hover:border-khaki/50"
                >
                  <span className="font-semibold text-neutral-100">{bp.battle.name}</span>
                  <span className="font-sans-ui text-xs text-neutral-500">
                    {formatDate(bp.battle.startDate)} · {THEATER_LABELS[bp.battle.theater]}
                    {bp.battle.victor ? ` · ${VICTOR_LABELS[bp.battle.victor]}` : ''}
                  </span>
                  <span className="ml-auto font-sans-ui text-xs text-khaki">{bp.role}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
