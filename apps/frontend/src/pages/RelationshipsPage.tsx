import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
} from 'd3-force';
import { api, type GraphLink, type GraphNode } from '../api/client';
import { useTheme } from '../theme';

interface SimNode extends GraphNode, SimulationNodeDatum {}
interface SimLink extends Omit<GraphLink, 'source' | 'target'> {
  source: SimNode;
  target: SimNode;
}

const SIDE_COLOR = { ALLIED: '#3987e5', AXIS: '#e66767', NEUTRAL: '#9a9a9a' } as const;

export function RelationshipsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['peopleGraph'], queryFn: api.peopleGraph });
  const [tick, setTick] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);

  const W = 900;
  const H = 620;

  // Build simulation nodes/links once per dataset.
  const { nodes, links } = useMemo(() => {
    if (!data) return { nodes: [] as SimNode[], links: [] as SimLink[] };
    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = data.links.map((l) => ({
      ...l,
      source: byId.get(l.source)!,
      target: byId.get(l.target)!,
    }));
    return { nodes, links };
  }, [data]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const M = 46; // margen para que nodo + etiqueta quepan
    const sim = forceSimulation<SimNode>(nodes)
      .force('link', forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(105).strength(0.35))
      .force('charge', forceManyBody().strength(-240))
      .force('center', forceCenter(W / 2, H / 2))
      .force('collide', forceCollide(40))
      .on('tick', () => {
        for (const n of nodes) {
          n.x = Math.max(M, Math.min(W - M, n.x ?? W / 2));
          n.y = Math.max(M, Math.min(H - M - 12, n.y ?? H / 2));
        }
        setTick((t) => t + 1);
      });
    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [nodes, links]);

  const linkColor = theme === 'dark' ? '#3a3a38' : '#cbc3ae';
  const linkOpposing = theme === 'dark' ? '#5a4a4a' : '#c9b2a8';
  const textColor = theme === 'dark' ? '#e5e5e5' : '#2b2416';

  const neighbors = useMemo(() => {
    if (!hover) return null;
    const set = new Set<string>([hover]);
    links.forEach((l) => {
      if (l.source.id === hover) set.add(l.target.id);
      if (l.target.id === hover) set.add(l.source.id);
    });
    return set;
  }, [hover, links]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-heading">Relaciones</h1>
        <p className="mt-1 text-ink-dim">
          Cada nodo es un personaje; una línea los une cuando coincidieron en la misma batalla. Pasa el cursor para
          resaltar sus conexiones y haz clic para ver su biografía.
        </p>
        <div className="mt-3 flex gap-4 font-sans-ui text-xs text-ink-dim">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: SIDE_COLOR.ALLIED }} /> Aliados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: SIDE_COLOR.AXIS }} /> Eje
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 560 }} data-tick={tick}>
          {links.map((l, i) => {
            const dim = neighbors && !(neighbors.has(l.source.id) && neighbors.has(l.target.id));
            return (
              <line
                key={i}
                x1={l.source.x}
                y1={l.source.y}
                x2={l.target.x}
                y2={l.target.y}
                stroke={l.opposing ? linkOpposing : linkColor}
                strokeWidth={Math.min(4, 1 + l.battles.length)}
                strokeDasharray={l.opposing ? '5 4' : undefined}
                opacity={dim ? 0.12 : 0.8}
              >
                <title>{`${l.source.fullName} — ${l.target.fullName}: ${l.battles.join(', ')}`}</title>
              </line>
            );
          })}
          {nodes.map((n) => {
            const dim = neighbors && !neighbors.has(n.id);
            const r = 22;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x ?? 0}, ${n.y ?? 0})`}
                className="cursor-pointer"
                opacity={dim ? 0.25 : 1}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => navigate(`/personas/${n.id}`)}
              >
                <circle r={r + 3} fill={SIDE_COLOR[n.side]} />
                {n.photoUrl ? (
                  <>
                    <defs>
                      <clipPath id={`clip-${n.id}`}>
                        <circle r={r} />
                      </clipPath>
                    </defs>
                    <image
                      href={n.photoUrl}
                      x={-r}
                      y={-r}
                      width={r * 2}
                      height={r * 2}
                      clipPath={`url(#clip-${n.id})`}
                      preserveAspectRatio="xMidYMin slice"
                    />
                  </>
                ) : (
                  <circle r={r} fill={theme === 'dark' ? '#232323' : '#ebe5d6'} />
                )}
                <text
                  y={r + 16}
                  textAnchor="middle"
                  fontSize={12}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fill={textColor}
                  style={{ pointerEvents: 'none' }}
                >
                  {n.fullName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-3 font-sans-ui text-xs text-ink-mute">
        {nodes.length} personajes conectados por {links.length} batallas compartidas. Las líneas punteadas unen bandos
        opuestos.
      </p>
    </div>
  );
}
