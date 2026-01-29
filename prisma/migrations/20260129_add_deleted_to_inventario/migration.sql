-- AddColumn deleted to inventario table for soft delete functionality
ALTER TABLE "inventario" ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex for soft delete filtering
CREATE INDEX "idx_inventario_deleted" ON "inventario"("deleted");
