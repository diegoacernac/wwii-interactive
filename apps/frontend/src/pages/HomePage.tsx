import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatNumber } from '../api/client';
import { useCountUp } from '../hooks/useCountUp';
import { Reveal } from '../components/Reveal';

const HERO_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Allied_Invasion_Force.jpg/1280px-Allied_Invasion_Force.jpg';

const ENTRIES = [
  { to: '/cronologia', title: 'Cronología', desc: 'Los acontecimientos clave de 1939 a 1945, año por año.' },
  { to: '/mapa', title: 'Mapa temporal', desc: 'Ve la guerra extenderse por el mundo mes a mes.' },
  { to: '/batallas', title: 'Batallas', desc: '410 enfrentamientos con relatos, fuerzas y bajas.' },
  { to: '/campanas', title: 'Campañas', desc: 'Las grandes operaciones, batalla a batalla en el mapa.' },
  { to: '/personas', title: 'Personajes', desc: 'Líderes y comandantes que dirigieron el conflicto.' },
  { to: '/relaciones', title: 'Relaciones', desc: 'Quién combatió junto a quién, en un grafo interactivo.' },
];

export function HomePage() {
  const { data } = useQuery({ queryKey: ['statsOverview'], queryFn: api.statsOverview });

  return (
    <div className="-mt-8">
      {/* Hero a sangre completa */}
      <section className="relative -mx-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/40" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/80 to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
          <p className="anim-in font-sans-ui text-sm uppercase tracking-[0.3em] text-khaki">1939 — 1945</p>
          <h1 className="anim-in mt-3 max-w-3xl text-5xl font-bold leading-tight text-heading sm:text-6xl">
            La Segunda Guerra Mundial, contada con datos
          </h1>
          <p className="anim-in mt-5 max-w-2xl text-lg leading-relaxed text-ink-dim">
            Una plataforma interactiva para explorar el conflicto más grande de la historia: su cronología, sus
            batallas en el mapa, sus protagonistas y el coste humano que dejó.
          </p>
          <div className="anim-in mt-8 flex flex-wrap gap-3 font-sans-ui text-sm">
            <Link
              to="/mapa"
              viewTransition
              className="rounded bg-khaki px-5 py-2.5 font-semibold text-bg transition-transform hover:-translate-y-0.5"
            >
              Explorar el mapa →
            </Link>
            <Link
              to="/cronologia"
              viewTransition
              className="rounded border border-line bg-surface/70 px-5 py-2.5 font-semibold text-ink backdrop-blur transition-colors hover:border-khaki"
            >
              Ver la cronología
            </Link>
          </div>
        </div>
      </section>

      {/* Contadores */}
      {data && (
        <div className="mx-auto -mt-10 grid max-w-5xl grid-cols-2 gap-4 px-4 font-sans-ui sm:grid-cols-4">
          <HeroStat value={data.counts.battles} label="Batallas" />
          <HeroStat value={data.counts.events} label="Eventos" />
          <HeroStat value={data.counts.people} label="Personajes" />
          <HeroStat value={data.counts.campaigns} label="Campañas" />
        </div>
      )}

      {/* Accesos */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENTRIES.map((e, i) => (
            <Reveal as="article" key={e.to} delay={Math.min(i, 6) * 60}>
              <Link
                to={e.to}
                viewTransition
                className="card-lift group flex h-full flex-col rounded-lg border border-line bg-surface p-6 hover:border-khaki/50"
              >
                <h2 className="text-xl font-semibold text-ink group-hover:text-heading">{e.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">{e.desc}</p>
                <span className="mt-4 font-sans-ui text-sm text-khaki">Entrar →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  const shown = useCountUp(value);
  return (
    <div className="rounded-lg border border-line bg-surface/90 p-5 text-center shadow-lg backdrop-blur">
      <div className="text-4xl font-bold text-heading tabular-nums">{formatNumber(shown)}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-ink-mute">{label}</div>
    </div>
  );
}
