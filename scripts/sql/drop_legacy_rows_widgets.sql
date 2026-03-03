-- Limpieza legacy filas/widgets (grid-only)
-- Ejecutar solo si ya migraste a layoutData en Pagina.

BEGIN;

DROP TABLE IF EXISTS "widgets" CASCADE;
DROP TABLE IF EXISTS "filas" CASCADE;

COMMIT;
