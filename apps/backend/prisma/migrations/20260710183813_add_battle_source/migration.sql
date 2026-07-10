-- AlterTable
ALTER TABLE "battles" ADD COLUMN     "source" VARCHAR(50) NOT NULL DEFAULT 'curated',
ADD COLUMN     "source_url" VARCHAR(500);

-- CreateIndex
CREATE INDEX "battles_source_idx" ON "battles"("source");
