import { NavLink, Outlet } from 'react-router-dom';
import { GlobalSearch } from './GlobalSearch';
import { useTheme } from '../theme';

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
      <header className="sticky top-0 z-[1100] border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-4">
          <NavLink to="/" className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-wide text-heading">WWII</span>
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
                    isActive ? 'bg-olive text-white' : 'text-ink-dim hover:text-ink hover:bg-surface-2'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-ink-mute font-sans-ui">
        Plataforma interactiva de la Segunda Guerra Mundial · 1939–1945 · Datos históricos con fines educativos
      </footer>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-dim transition-colors hover:border-khaki/60 hover:text-khaki"
    >
      {theme === 'dark' ? (
        // Sol
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
      ) : (
        // Luna
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
