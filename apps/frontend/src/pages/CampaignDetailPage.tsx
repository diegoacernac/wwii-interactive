import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { api, formatDate, formatNumber, THEATER_LABELS, VICTOR_LABELS, type Battle } from '../api/client';
import { useMapTiles } from '../theme';

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tiles = useMapTiles();
  const mapRef = useRef<LeafletMap | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: c, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.campaign(id!),
    enabled: !!id,
  });

  const battles = (c?.battles ?? []).map((b) => b.battle);

  const focus = (b: Battle) => {
    setActiveId(b.id);
    mapRef.current?.flyTo([b.latitude, b.longitude], 5, { duration: 1.4 });
  };

  if (isLoading) return <p className="text-ink-mute">Cargando campaña…</p>;
  if (!c) return <p className="text-ink-mute">Campaña no encontrada.</p>;

  return (
    <div>
      <Link to="/campanas" viewTransition className="font-sans-ui text-sm text-khaki hover:underline">
        ← Todas las campañas
      </Link>
      <h1 className="mt-3 text-4xl font-bold text-heading">{c.name}</h1>
      <p className="mt-2 font-sans-ui text-sm text-ink-dim">
        {formatDate(c.startDate)} — {formatDate(c.endDate)} · {THEATER_LABELS[c.theater]}
      </p>
      {c.description && <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink">{c.description}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Mapa fijo */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-line">
            <MapContainer
              ref={mapRef}
              center={battles[0] ? [battles[0].latitude, battles[0].longitude] : [48, 15]}
              zoom={4}
              style={{ height: '70vh', background: tiles.background }}
              scrollWheelZoom
            >
              <TileLayer key={tiles.key} attribution="&copy; OpenStreetMap &copy; CARTO" url={tiles.url} />
              {battles.map((b) => {
                const active = b.id === activeId;
                return (
                  <CircleMarker
                    key={b.id}
                    center={[b.latitude, b.longitude]}
                    radius={active ? 12 : 6}
                    pathOptions={{
                      color: active ? '#b5a642' : '#8a8a8a',
                      fillColor: active ? '#b5a642' : '#8a8a8a',
                      fillOpacity: active ? 0.85 : 0.4,
                      weight: active ? 3 : 1,
                    }}
                    eventHandlers={{ click: () => focus(b) }}
                  />
                );
              })}
            </MapContainer>
          </div>
          <p className="mt-2 font-sans-ui text-xs text-ink-mute">
            El mapa sigue tu lectura. Haz scroll o toca un punto para volar a cada batalla.
          </p>
        </div>

        {/* Pasos de batalla */}
        <ol className="space-y-6">
          {battles.map((b, i) => (
            <BattleStep key={b.id} battle={b} order={i + 1} active={b.id === activeId} onEnter={() => focus(b)} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function BattleStep({
  battle: b,
  order,
  active,
  onEnter,
}: {
  battle: Battle;
  order: number;
  active: boolean;
  onEnter: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) onEnter();
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <li
      ref={ref}
      className={`rounded-lg border p-6 transition-colors duration-300 ${
        active ? 'border-khaki bg-surface' : 'border-line bg-surface/60'
      }`}
    >
      <div className="flex items-baseline gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-sans-ui text-sm font-bold ${
            active ? 'bg-khaki text-bg' : 'bg-surface-2 text-ink-mute'
          }`}
        >
          {order}
        </span>
        <h2 className="text-xl font-semibold text-ink">{b.name}</h2>
      </div>
      <p className="mt-2 font-sans-ui text-xs text-ink-mute">
        {formatDate(b.startDate)}
        {b.endDate ? ` — ${formatDate(b.endDate)}` : ''} · {b.locationName}
        {b.victor ? ` · ${VICTOR_LABELS[b.victor]}` : ''}
      </p>
      {b.description && <p className="mt-3 leading-relaxed text-ink-dim">{b.description}</p>}
      <div className="mt-4 flex items-center justify-between font-sans-ui text-xs text-ink-mute">
        <span>
          Bajas: {formatNumber((b.alliedCasualties ?? 0) + (b.axisCasualties ?? 0) + (b.civilianCasualties ?? 0))}
        </span>
        <Link to={`/batallas/${b.id}`} viewTransition className="text-khaki hover:underline">
          Ver batalla →
        </Link>
      </div>
    </li>
  );
}
