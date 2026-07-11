# ---------- build stage ----------
FROM node:20-slim AS build
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install workspace dependencies (root + both apps).
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm install

# Copy the rest and build both apps.
COPY . .
RUN npx prisma generate --schema apps/backend/prisma/schema.prisma
RUN npm run build --workspace=frontend
RUN npm run build --workspace=backend

# ---------- runtime stage ----------
FROM node:20-slim AS runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
# Backend: compiled output + sources needed for data scripts (tsx) + prisma + config.
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/src ./apps/backend/src
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/apps/backend/tsconfig.json ./apps/backend/tsconfig.json
# Frontend: static build served by the backend (resolved via FRONTEND_DIST).
COPY --from=build /app/apps/frontend/dist ./apps/frontend/dist

WORKDIR /app/apps/backend
ENV FRONTEND_DIST=/app/apps/frontend/dist
EXPOSE 3001

# Apply pending migrations (incl. the unaccent extension) then start the server.
CMD ["sh", "-c", "npm run migrate:deploy && node dist/server.js"]
