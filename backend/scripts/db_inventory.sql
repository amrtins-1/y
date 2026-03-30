-- Database inventory script (PostgreSQL)
-- Run with: psql -d <database> -f backend/scripts/db_inventory.sql

-- 1) Tables by size and row estimate
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS estimated_rows,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 2) Column inventory (quick data dictionary seed)
SELECT
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'app'
ORDER BY table_name, ordinal_position;

-- 3) Primary keys
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'app'
ORDER BY tc.table_name, kcu.ordinal_position;

-- 4) Foreign keys
SELECT
  tc.table_name AS fk_table,
  kcu.column_name AS fk_column,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'app'
ORDER BY fk_table, fk_column;

-- 5) Existing indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'app'
ORDER BY tablename, indexname;

-- 6) Potentially large/high-churn tables quick check
SELECT 'auth_session' AS table_name, count(*) AS total_rows FROM app.auth_session
UNION ALL
SELECT 'market_quote', count(*) FROM app.market_quote
UNION ALL
SELECT 'news_article', count(*) FROM app.news_article
UNION ALL
SELECT 'video_item', count(*) FROM app.video_item;

