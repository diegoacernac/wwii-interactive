# WWII Interactive

Plataforma web interactiva sobre la Segunda Guerra Mundial: cronología, mapa de batallas, campañas, biografías y estadísticas.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Data fetching | TanStack Query |
| Mapas | Leaflet (react-leaflet) con tiles CARTO dark |
| Gráficos | SVG hecho a mano |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL 14 (extensión `unaccent` para búsqueda sin acentos) |

## Requisitos

- Node.js ≥ 20
- PostgreSQL ≥ 14 corriendo en local (`brew services start postgresql@14`)

## Setup

```bash
createdb wwii_platform
psql -d wwii_platform -c "CREATE EXTENSION IF NOT EXISTS unaccent;"

npm install

# Configurar apps/backend/.env (ver .env con DATABASE_URL y PORT)

npm run db:migrate   # migraciones Prisma
npm run db:seed      # 23 batallas curadas, 46 eventos, 18 personajes, 6 campañas

npm run dev          # backend :3001 + frontend :5173
```

Abrir http://localhost:5173.

### Importar batallas desde Wikidata (opcional)

Enriquece el mapa y la cronología con ~390 batallas adicionales tomadas del
endpoint SPARQL público de Wikidata (nombre, fecha, coordenadas, ubicación;
teatro inferido por geografía):

```bash
cd apps/backend && npm run import:wikidata
# o vía API: curl -X POST http://localhost:3001/api/v1/admin/import/wikidata
```

Es **idempotente** (upsert por `external_source_id` = Q-ID de Wikidata) y
**preserva las batallas curadas**: cualquier batalla de Wikidata cuyo nombre
coincida con una curada (`source = 'curated'`) se omite, de modo que las 23
entradas hechas a mano —ricas en comandantes, efectivos y bajas por bando— nunca
se duplican ni se sobrescriben.

### Enriquecer con relatos largos de Wikipedia (opcional)

Rellena el campo `narrative` de batallas y personas con el extracto de
introducción (varios párrafos) del artículo de **Wikipedia en español**, para que
las páginas de detalle muestren un relato completo y no solo el resumen corto:

```bash
cd apps/backend && npm run enrich:narratives
# solo las que aún no tienen relato:
npm run enrich:narratives -- --only-missing
```

Resuelve el artículo por Q-ID de Wikidata (para las importadas) o por búsqueda de
nombre (curadas y personas), descarga los extractos en lotes y guarda también la
URL de origen para la atribución CC BY-SA. Solo usa artículos en español; las
batallas sin artículo ES conservan su descripción corta.

## Estructura

```
apps/
├── backend/          # API Express (/api/v1)
│   ├── prisma/       # schema.prisma, migraciones, seed.ts
│   └── src/
│       ├── routes/   # events, battles, people, campaigns, map, statistics, search
│       └── lib/      # prisma client, paginación
└── frontend/         # SPA Vite + React
    └── src/
        ├── api/      # cliente tipado
        ├── pages/    # Timeline, Mapa, Batallas, Campañas, Personajes, Estadísticas
        └── components/
```

## API

- `GET /api/v1/events?category=&from=&to=&minSignificance=`
- `GET /api/v1/battles?theater=&victor=` · `GET /api/v1/battles/:id`
- `GET /api/v1/people?side=&q=` · `GET /api/v1/people/:id`
- `GET /api/v1/campaigns` · `GET /api/v1/campaigns/:id`
- `GET /api/v1/map/battles` — GeoJSON FeatureCollection
- `GET /api/v1/statistics/overview | casualties-by-theater | battles-by-year | events-by-category`
- `GET /api/v1/search?q=` — búsqueda global insensible a acentos
- `POST /api/v1/admin/import/wikidata` — importa batallas desde Wikidata (idempotente)

## Mapa temporal

El mapa (`/mapa`) incluye una animación temporal: un cursor de mes recorre
1937–1945 mostrando las batallas de forma acumulativa, con las recién iniciadas
resaltadas con un anillo claro. Controles de play/pausa, velocidad (0.5×–4×) y
scrubber manual. El estado es enlazable: `/mapa?at=1941-12` abre el mapa en
diciembre de 1941.

## Decisiones vs. el documento de arquitectura original

- **Lat/lng como `Float`** en lugar de PostGIS: suficiente para pines en Leaflet; PostGIS se añade solo si se necesitan queries espaciales reales.
- **Postgres FTS/ILIKE + unaccent** en lugar de Elasticsearch.
- **TanStack Query** en lugar de Redux Toolkit (la app es ~100% lectura).
- **Sin Redis/Kubernetes** en el MVP; el contenido es esencialmente estático.
- `warsample_id` renombrado a `external_source_id` (fuente prevista: Wikidata/DBpedia SPARQL, no WarSampo, que solo cubre las guerras finlandesas).
