import { NavLink, Outlet } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';

const links = [
  { to: '/', label: 'Cronología' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/batallas', label: 'Batallas' },
  { to: '/campanas', label: 'Campañas' },
  { to: '/personas', label: 'Personajes' },
  { to: '/estadisticas', label: 'Estadísticas' },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-[1100] border-b border-neutral-800 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-4">
          <NavLink to="/" className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-wide text-parchment">WWII</span>
            <span className="text-sm text-khaki font-sans-ui uppercase tracking-widest">Interactive</span>
          </NavLink>
          <nav className="flex flex-wrap gap-1 font-sans-ui text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded transition-colors ${
                    isActive ? 'bg-olive text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            <GlobalSearch />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500 font-sans-ui">
        Plataforma interactiva de la Segunda Guerra Mundial · 1939–1945 · Datos históricos con fines educativos
      </footer>
    </div>
  );
}
