-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('POLITICAL', 'MILITARY', 'CULTURAL', 'ECONOMIC');

-- CreateEnum
CREATE TYPE "Theater" AS ENUM ('EUROPEAN', 'EASTERN_FRONT', 'PACIFIC', 'NORTH_AFRICAN', 'MEDITERRANEAN', 'ATLANTIC', 'OTHER');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('ALLIED', 'AXIS', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "Victor" AS ENUM ('ALLIED', 'AXIS', 'STALEMATE', 'INCONCLUSIVE');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "event_date" DATE NOT NULL,
    "category" "EventCategory" NOT NULL,
    "significance_level" SMALLINT NOT NULL,
    "region" VARCHAR(100),
    "external_source_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "location_name" VARCHAR(200) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "theater" "Theater" NOT NULL,
    "allied_commander" VARCHAR(200),
    "axis_commander" VARCHAR(200),
    "allied_strength" INTEGER,
    "axis_strength" INTEGER,
    "allied_casualties" INTEGER,
    "axis_casualties" INTEGER,
    "civilian_casualties" INTEGER,
    "victor" "Victor",
    "strategic_importance" TEXT,
    "external_source_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "description" TEXT,
    "theater" "Theater" NOT NULL,
    "objective" VARCHAR(500),
    "outcome" VARCHAR(200),
    "external_source_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_battles" (
    "campaign_id" UUID NOT NULL,
    "battle_id" UUID NOT NULL,
    "battle_order" INTEGER,

    CONSTRAINT "campaign_battles_pkey" PRIMARY KEY ("campaign_id","battle_id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(300) NOT NULL,
    "birth_date" DATE,
    "death_date" DATE,
    "birth_place" VARCHAR(200),
    "nationality" VARCHAR(100) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "side" "Side" NOT NULL,
    "biography" TEXT,
    "photo_url" VARCHAR(500),
    "rank" VARCHAR(100),
    "notable_positions" TEXT[],
    "key_achievements" TEXT[],
    "external_source_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_participants" (
    "battle_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "role" VARCHAR(100) NOT NULL,

    CONSTRAINT "battle_participants_pkey" PRIMARY KEY ("battle_id","person_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_external_source_id_key" ON "events"("external_source_id");

-- CreateIndex
CREATE INDEX "events_event_date_idx" ON "events"("event_date");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE UNIQUE INDEX "battles_external_source_id_key" ON "battles"("external_source_id");

-- CreateIndex
CREATE INDEX "battles_start_date_idx" ON "battles"("start_date");

-- CreateIndex
CREATE INDEX "battles_theater_idx" ON "battles"("theater");

-- CreateIndex
CREATE INDEX "battles_victor_idx" ON "battles"("victor");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_external_source_id_key" ON "campaigns"("external_source_id");

-- CreateIndex
CREATE INDEX "campaigns_theater_idx" ON "campaigns"("theater");

-- CreateIndex
CREATE UNIQUE INDEX "people_external_source_id_key" ON "people"("external_source_id");

-- CreateIndex
CREATE INDEX "people_full_name_idx" ON "people"("full_name");

-- CreateIndex
CREATE INDEX "people_side_idx" ON "people"("side");

-- AddForeignKey
ALTER TABLE "campaign_battles" ADD CONSTRAINT "campaign_battles_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_battles" ADD CONSTRAINT "campaign_battles_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
