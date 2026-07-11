const BASE = '/api/v1';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export type Theater =
  | 'EUROPEAN'
  | 'EASTERN_FRONT'
  | 'PACIFIC'
  | 'NORTH_AFRICAN'
  | 'MEDITERRANEAN'
  | 'ATLANTIC'
  | 'OTHER';
export type Side = 'ALLIED' | 'AXIS' | 'NEUTRAL';
export type Victor = 'ALLIED' | 'AXIS' | 'STALEMATE' | 'INCONCLUSIVE';
export type EventCategory = 'POLITICAL' | 'MILITARY' | 'CULTURAL' | 'ECONOMIC';

export interface WWIIEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  category: EventCategory;
  significanceLevel: number;
  region: string | null;
}

export interface Battle {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  locationName: string;
  latitude: number;
  longitude: number;
  description: string | null;
  theater: Theater;
  alliedCommander: string | null;
  axisCommander: string | null;
  alliedStrength: number | null;
  axisStrength: number | null;
  alliedCasualties: number | null;
  axisCasualties: number | null;
  civilianCasualties: number | null;
  victor: Victor | null;
  strategicImportance: string | null;
  narrative: string | null;
  narrativeSourceUrl: string | null;
  imageUrl: string | null;
  source: string;
}

export interface BattleDetail extends Battle {
  campaigns: { campaign: { id: string; name: string; theater: Theater } }[];
  participants: { role: string; person: { id: string; fullName: string; side: Side; rank: string | null } }[];
}

export interface Person {
  id: string;
  fullName: string;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  nationality: string;
  role: string;
  side: Side;
  biography: string | null;
  narrative: string | null;
  narrativeSourceUrl: string | null;
  photoUrl: string | null;
  rank: string | null;
  notablePositions: string[];
  keyAchievements: string[];
}

export interface PersonDetail extends Person {
  battles: { role: string; battle: { id: string; name: string; startDate: string; theater: Theater; victor: Victor | null } }[];
}

export interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  theater: Theater;
  objective: string | null;
  outcome: string | null;
  _count?: { battles: number };
}

export interface CampaignDetail extends Campaign {
  battles: { battleOrder: number | null; battle: Battle }[];
}

export interface BattleGeoJSON {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: {
      id: string;
      name: string;
      startDate: string;
      endDate: string | null;
      theater: Theater;
      victor: Victor | null;
      locationName: string;
      totalCasualties: number;
    };
  }[];
}

export interface StatsOverview {
  counts: { battles: number; events: number; people: number; campaigns: number };
  casualties: { allied: number; axis: number; civilian: number };
}

export interface TheaterCasualties {
  theater: Theater;
  battles: number;
  allied: number;
  axis: number;
  civilian: number;
}

export interface SearchResults {
  events: Pick<WWIIEvent, 'id' | 'title' | 'eventDate' | 'category'>[];
  battles: Pick<Battle, 'id' | 'name' | 'startDate' | 'theater'>[];
  people: Pick<Person, 'id' | 'fullName' | 'role' | 'side' | 'nationality'>[];
}

export interface GraphNode {
  id: string;
  fullName: string;
  side: Side;
  role: string;
  photoUrl: string | null;
}

export interface GraphLink {
  source: string;
  target: string;
  battles: string[];
  opposing: boolean;
}

export interface PeopleGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const api = {
  events: (params = '') => get<Paginated<WWIIEvent>>(`/events?pageSize=200${params}`),
  battles: (params = '') => get<Paginated<Battle>>(`/battles?pageSize=100${params}`),
  battle: (id: string) => get<BattleDetail>(`/battles/${id}`),
  people: (params = '') => get<Paginated<Person>>(`/people?pageSize=100${params}`),
  person: (id: string) => get<PersonDetail>(`/people/${id}`),
  peopleGraph: () => get<PeopleGraph>('/people/graph'),
  campaigns: () => get<Paginated<Campaign>>('/campaigns'),
  campaign: (id: string) => get<CampaignDetail>(`/campaigns/${id}`),
  mapBattles: () => get<BattleGeoJSON>('/map/battles'),
  statsOverview: () => get<StatsOverview>('/statistics/overview'),
  casualtiesByTheater: () => get<TheaterCasualties[]>('/statistics/casualties-by-theater'),
  battlesByYear: () => get<{ year: number; victor: Victor | null; count: number }[]>('/statistics/battles-by-year'),
  search: (q: string) => get<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
};

export const THEATER_LABELS: Record<Theater, string> = {
  EUROPEAN: 'Europa Occidental',
  EASTERN_FRONT: 'Frente Oriental',
  PACIFIC: 'Pacífico',
  NORTH_AFRICAN: 'Norte de África',
  MEDITERRANEAN: 'Mediterráneo',
  ATLANTIC: 'Atlántico',
  OTHER: 'Otros',
};

export const VICTOR_LABELS: Record<Victor, string> = {
  ALLIED: 'Victoria aliada',
  AXIS: 'Victoria del Eje',
  STALEMATE: 'Empate',
  INCONCLUSIVE: 'Indeciso',
};

export const SIDE_LABELS: Record<Side, string> = {
  ALLIED: 'Aliados',
  AXIS: 'Eje',
  NEUTRAL: 'Neutral',
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  POLITICAL: 'Político',
  MILITARY: 'Militar',
  CULTURAL: 'Cultural',
  ECONOMIC: 'Económico',
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('es-ES');
}
