-- AlterTable
ALTER TABLE "cuenta_usuario" ADD COLUMN "numero_bloqueos" INTEGER NOT NULL DEFAULT 0;

-- Comentario: Agrega contador histórico de bloqueos para escalada progresiva de penalizaciones
