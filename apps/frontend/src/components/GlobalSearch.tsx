import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatDate, SIDE_LABELS, THEATER_LABELS } from '../api/client';

export function GlobalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { data } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.search(debounced),
    enabled: debounced.length >= 2,
  });

  const hasResults = data && (data.events.length || data.battles.length || data.people.length);

  return (
    <div className="relative font-sans-ui" ref={ref}>
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar batallas, personas, eventos…"
        className="w-64 rounded border border-line bg-surface px-3 py-1.5 text-sm placeholder-ink-mute focus:border-khaki focus:outline-none"
      />
      {open && debounced.length >= 2 && (
        <div className="absolute right-0 z-[1200] mt-2 w-96 max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-surface shadow-2xl">
          {!hasResults && <p className="p-4 text-sm text-ink-mute">Sin resultados para «{debounced}»</p>}
          {data && data.battles.length > 0 && (
            <Section title="Batallas">
              {data.battles.map((b) => (
                <ResultLink key={b.id} to={`/batallas/${b.id}`} onClick={() => setOpen(false)}>
                  <span className="text-ink">{b.name}</span>
                  <span className="text-xs text-ink-mute">
                    {formatDate(b.startDate)} · {THEATER_LABELS[b.theater]}
                  </span>
                </ResultLink>
              ))}
            </Section>
          )}
          {data && data.people.length > 0 && (
            <Section title="Personajes">
              {data.people.map((p) => (
                <ResultLink key={p.id} to={`/personas/${p.id}`} onClick={() => setOpen(false)}>
                  <span className="text-ink">{p.fullName}</span>
                  <span className="text-xs text-ink-mute">
                    {p.role} · {SIDE_LABELS[p.side]}
                  </span>
                </ResultLink>
              ))}
            </Section>
          )}
          {data && data.events.length > 0 && (
            <Section title="Eventos">
              {data.events.map((e) => (
                <ResultLink key={e.id} to="/" onClick={() => setOpen(false)}>
                  <span className="text-ink">{e.title}</span>
                  <span className="text-xs text-ink-mute">{formatDate(e.eventDate)}</span>
                </ResultLink>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line last:border-0">
      <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-khaki">{title}</p>
      {children}
    </div>
  );
}

function ResultLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="flex flex-col gap-0.5 px-4 py-2 hover:bg-surface-2">
      {children}
    </Link>
  );
}
