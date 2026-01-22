-- CreateEnum
CREATE TYPE "tipo_item" AS ENUM ('PRODUCTO', 'PAQUETE');

-- CreateEnum
CREATE TYPE "tipo_operacion" AS ENUM ('VENTA', 'CAMBIO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "estado_reserva" AS ENUM ('ACTIVA', 'CONSOLIDADA', 'LIBERADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "tipo_movimiento" AS ENUM ('VENTA_SALIDA', 'CAMBIO_SALIDA', 'CAMBIO_ENTRADA', 'AJUSTE_OPERATIVO', 'AJUSTE_CONTABLE', 'RESERVA', 'LIBERACION', 'ABANDONO_ENTRADA', 'ABANDONO_SALIDA');

-- CreateEnum
CREATE TYPE "tipo_actor" AS ENUM ('EMPLEADO', 'CLIENTE', 'SISTEMA');

-- CreateTable
CREATE TABLE "inventario" (
    "id" UUID NOT NULL,
    "tipo_item" "tipo_item" NOT NULL,
    "item_id" UUID NOT NULL,
    "ubicacion" VARCHAR(50),
    "cantidad_disponible" INTEGER NOT NULL DEFAULT 0,
    "cantidad_reservada" INTEGER NOT NULL DEFAULT 0,
    "cantidad_abandono" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" UUID NOT NULL,
    "inventario_id" UUID NOT NULL,
    "tipo_operacion" "tipo_operacion" NOT NULL,
    "operacion_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "estado" "estado_reserva" NOT NULL DEFAULT 'ACTIVA',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "fecha_resolucion" TIMESTAMP(3),
    "actor_tipo" "tipo_actor" NOT NULL,
    "actor_id" UUID NOT NULL,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento_inventario" (
    "id" UUID NOT NULL,
    "inventario_id" UUID NOT NULL,
    "tipo_movimiento" "tipo_movimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "cantidad_anterior" INTEGER NOT NULL,
    "cantidad_posterior" INTEGER NOT NULL,
    "tipo_operacion_origen" "tipo_operacion",
    "operacion_origen_id" UUID,
    "empleado_id" UUID,
    "intencion" VARCHAR(200),
    "notas" TEXT,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "idx_inventario_item" ON "inventario"("tipo_item", "item_id");

-- CreateIndex
CREATE INDEX "idx_inventario_ubicacion" ON "inventario"("ubicacion");

-- CreateIndex
CREATE INDEX "idx_reserva_inventario" ON "reserva"("inventario_id");

-- CreateIndex
CREATE INDEX "idx_reserva_estado" ON "reserva"("estado");

-- CreateIndex
CREATE INDEX "idx_reserva_expiracion" ON "reserva"("fecha_expiracion", "estado");

-- CreateIndex
CREATE INDEX "idx_reserva_operacion" ON "reserva"("operacion_id");

-- CreateIndex
CREATE INDEX "idx_movimiento_inventario" ON "movimiento_inventario"("inventario_id");

-- CreateIndex
CREATE INDEX "idx_movimiento_fecha" ON "movimiento_inventario"("fecha_movimiento");

-- CreateIndex
CREATE INDEX "idx_movimiento_tipo" ON "movimiento_inventario"("tipo_movimiento");

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraints
ALTER TABLE "inventario" ADD CONSTRAINT "chk_cantidad_disponible_positiva" CHECK ("cantidad_disponible" >= 0);
ALTER TABLE "inventario" ADD CONSTRAINT "chk_cantidad_reservada_positiva" CHECK ("cantidad_reservada" >= 0);
