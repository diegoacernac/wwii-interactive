-- AlterTable
ALTER TABLE "battles" ADD COLUMN     "narrative" TEXT,
ADD COLUMN     "narrative_source_url" VARCHAR(500);

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "narrative" TEXT,
ADD COLUMN     "narrative_source_url" VARCHAR(500);
