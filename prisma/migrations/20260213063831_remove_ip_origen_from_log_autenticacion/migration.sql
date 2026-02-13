-- AlterTable: Remove ip_origen column from LogAutenticacion
-- This field was removed for privacy concerns (tracking IP addresses in audit logs)

-- Drop index first (depends on column)
DROP INDEX IF EXISTS "idx_log_auth_ip";

-- Drop column
ALTER TABLE "log_autenticacion" DROP COLUMN IF EXISTS "ip_origen";
