import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { api, formatDate, formatNumber, SIDE_LABELS, THEATER_LABELS, VICTOR_LABELS } from '../api/client';
import { Narrative } from '../components/Narrative';

export function BattleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: b, isLoading } = useQuery({
    queryKey: ['battle', id],
    queryFn: () => api.battle(id!),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-neutral-500">Cargando batalla…</p>;
  if (!b) return <p className="text-neutral-500">Batalla no encontrada.</p>;

  const totalCasualties = (b.alliedCasualties ?? 0) + (b.axisCasualties ?? 0) + (b.civilianCasualties ?? 0);

  return (
    <div>
      <Link to="/batallas" className="font-sans-ui text-sm text-khaki hover:underline">
        ← Todas las batallas
      </Link>
      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <h1 className="text-4xl font-bold text-parchment">{b.name}</h1>
        {b.victor && <span className="font-sans-ui text-sm text-khaki">{VICTOR_LABELS[b.victor]}</span>}
      </div>
      <p className="mt-2 font-sans-ui text-sm text-neutral-400">
        {formatDate(b.startDate)}
        {b.endDate ? ` — ${formatDate(b.endDate)}` : ''} · {b.locationName} · {THEATER_LABELS[b.theater]}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {b.description && <p className="text-lg leading-relaxed text-neutral-200">{b.description}</p>}
          {b.strategicImportance && (
            <blockquote className="border-l-4 border-khaki pl-4 text-neutral-400 italic">
              {b.strategicImportance}
            </blockquote>
          )}
          {b.narrative && <Narrative text={b.narrative} sourceUrl={b.narrativeSourceUrl} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <ForceCard
              title="Aliados"
              accent="border-allied/50"
              commander={b.alliedCommander}
              strength={b.alliedStrength}
              casualties={b.alliedCasualties}
            />
            <ForceCard
              title="Eje"
              accent="border-axis/50"
              commander={b.axisCommander}
              strength={b.axisStrength}
              casualties={b.axisCasualties}
            />
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 font-sans-ui text-sm">
            <p className="text-neutral-400">
              Bajas totales: <span className="font-semibold text-neutral-200">{formatNumber(totalCasualties)}</span>
              {b.civilianCasualties != null && b.civilianCasualties > 0 && (
                <span className="text-neutral-500"> (incluye {formatNumber(b.civilianCasualties)} civiles)</span>
              )}
            </p>
          </div>

          {b.participants.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-semibold text-parchment">Protagonistas</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {b.participants.map((p) => (
                  <li key={p.person.id}>
                    <Link
                      to={`/personas/${p.person.id}`}
                      className="block rounded border border-neutral-800 bg-neutral-900/50 px-4 py-3 hover:border-khaki/50"
                    >
                      <span className="font-semibold text-neutral-100">{p.person.fullName}</span>
                      <span className="block font-sans-ui text-xs text-neutral-500">
                        {p.role} · {SIDE_LABELS[p.person.side]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {b.campaigns.length > 0 && (
            <p className="font-sans-ui text-sm text-neutral-500">
              Parte de:{' '}
              {b.campaigns.map((c, i) => (
                <span key={c.campaign.id}>
                  {i > 0 && ', '}
                  <Link to="/campanas" className="text-khaki hover:underline">
                    {c.campaign.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>

        <div>
          <div className="overflow-hidden rounded-lg border border-neutral-800">
            <MapContainer
              center={[b.latitude, b.longitude]}
              zoom={5}
              style={{ height: 320, background: '#111' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <CircleMarker
                center={[b.latitude, b.longitude]}
                radius={10}
                pathOptions={{ color: '#b5a642', fillColor: '#b5a642', fillOpacity: 0.6 }}
              />
            </MapContainer>
          </div>
          <p className="mt-2 font-sans-ui text-xs text-neutral-500">
            {b.locationName} · {b.latitude.toFixed(3)}, {b.longitude.toFixed(3)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ForceCard({
  title,
  accent,
  commander,
  strength,
  casualties,
}: {
  title: string;
  accent: string;
  commander: string | null;
  strength: number | null;
  casualties: number | null;
}) {
  return (
    <div className={`rounded-lg border-t-4 ${accent} border border-neutral-800 bg-neutral-900/50 p-5`}>
      <h3 className="font-sans-ui text-sm font-bold uppercase tracking-wider text-neutral-300">{title}</h3>
      <dl className="mt-3 space-y-2 font-sans-ui text-sm">
        <div>
          <dt className="text-xs text-neutral-500">Mando</dt>
          <dd className="text-neutral-200">{commander ?? '—'}</dd>
        </div>
        <div className="flex gap-6">
          <div>
            <dt className="text-xs text-neutral-500">Efectivos</dt>
            <dd className="text-neutral-200">{formatNumber(strength)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Bajas</dt>
            <dd className="text-neutral-200">{formatNumber(casualties)}</dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
