import { Fragment, useMemo } from 'react';
import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';

type LatLng = [number, number];

export interface Offensive {
  id: string;
  label: string;
  from: LatLng;
  to: LatLng;
  color: string;
  year: number; // aparece cuando el cursor del mapa llega a este año
  curve?: number; // desviación lateral del arco (grados); signo = lado
}

// Grandes ofensivas curadas (aproximadas) para dar movimiento al mapa.
export const OFFENSIVES: Offensive[] = [
  { id: 'poland', label: 'Invasión de Polonia', from: [52.5, 13.4], to: [52.23, 21.0], color: '#c0503c', year: 1939, curve: 1.5 },
  { id: 'france', label: 'Caída de Francia', from: [50.7, 7.1], to: [48.85, 2.35], color: '#c0503c', year: 1940, curve: 1.2 },
  { id: 'barbarossa', label: 'Operación Barbarroja', from: [52.2, 21.0], to: [55.75, 37.62], color: '#c0503c', year: 1941, curve: -3 },
  { id: 'africa', label: 'Avance del Afrika Korps', from: [32.9, 13.2], to: [30.83, 28.95], color: '#e9c46a', year: 1941, curve: 2 },
  { id: 'torch', label: 'Operación Torch', from: [36.0, -5.6], to: [36.75, 3.05], color: '#3b82c4', year: 1942, curve: 2 },
  { id: 'uranus', label: 'Contraofensiva de Stalingrado', from: [51.5, 46.0], to: [48.7, 44.5], color: '#3b82c4', year: 1942, curve: -1.5 },
  { id: 'husky', label: 'Invasión de Sicilia', from: [34.3, 12.6], to: [37.08, 14.24], color: '#3b82c4', year: 1943, curve: 1.5 },
  { id: 'bagration', label: 'Operación Bagratión', from: [53.9, 27.56], to: [52.23, 21.0], color: '#3b82c4', year: 1944, curve: -2 },
  { id: 'overlord', label: 'Desembarco de Normandía', from: [50.4, -1.0], to: [49.34, -0.6], color: '#3b82c4', year: 1944, curve: 1 },
  { id: 'berlin', label: 'Ofensiva final sobre Berlín', from: [52.23, 21.0], to: [52.52, 13.4], color: '#3b82c4', year: 1945, curve: -2 },
];

// Puntos de un arco cuadrático entre from y to, con el control desplazado
// perpendicularmente para curvar la flecha.
function arcPoints(from: LatLng, to: LatLng, curve: number, n = 24): LatLng[] {
  const [y0, x0] = from;
  const [y1, x1] = to;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * curve;
  const cy = my + (dx / len) * curve;
  const pts: LatLng[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    pts.push([y, x]);
  }
  return pts;
}

function arrowHead(points: LatLng[], color: string, label: string) {
  const a = points[points.length - 2];
  const b = points[points.length - 1];
  const angle = (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
  const icon = L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div style="transform: rotate(${-angle}deg); color:${color}; filter: drop-shadow(0 1px 1px rgba(0,0,0,.5))">
      <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 8 L13 8 M9 4 L14 8 L9 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>`,
  });
  return <Marker position={b} icon={icon} title={label} interactive={false} />;
}

export function FrontArrows({ upToYear, visible }: { upToYear: number; visible: boolean }) {
  const shown = useMemo(() => OFFENSIVES.filter((o) => o.year <= upToYear), [upToYear]);
  if (!visible) return null;
  return (
    <>
      {shown.map((o) => {
        const pts = arcPoints(o.from, o.to, o.curve ?? 1.5);
        return (
          <Fragment key={o.id}>
            <Polyline
              positions={pts}
              pathOptions={{ color: o.color, weight: 3, opacity: 0.9, className: 'front-arrow' }}
            />
            {arrowHead(pts, o.color, o.label)}
          </Fragment>
        );
      })}
    </>
  );
}
