-- Logical domain map helper (documentation query)
-- This does not modify data.

WITH mapped AS (
  SELECT 'identity' AS domain, 'app_user' AS table_name
  UNION ALL SELECT 'identity', 'auth_session'
  UNION ALL SELECT 'identity', 'user_address'
  UNION ALL SELECT 'crm', 'contact_message'
  UNION ALL SELECT 'crm', 'consultancy_request'
  UNION ALL SELECT 'crm', 'newsletter_subscriber'
  UNION ALL SELECT 'commerce', 'membership_plan'
  UNION ALL SELECT 'commerce', 'user_subscription'
  UNION ALL SELECT 'commerce', 'donation'
  UNION ALL SELECT 'commerce', 'product_catalog'
  UNION ALL SELECT 'commerce', 'service_catalog'
  UNION ALL SELECT 'content', 'news_article'
  UNION ALL SELECT 'content', 'video_item'
  UNION ALL SELECT 'market', 'market_asset'
  UNION ALL SELECT 'market', 'market_quote'
  UNION ALL SELECT 'market', 'user_market_watchlist'
)
SELECT
  m.domain,
  m.table_name,
  COALESCE(s.n_live_tup, 0) AS estimated_rows,
  COALESCE(pg_size_pretty(pg_total_relation_size(format('app.%I', m.table_name)::regclass)), '0 bytes') AS size
FROM mapped m
LEFT JOIN pg_stat_user_tables s
  ON s.schemaname = 'app'
 AND s.relname = m.table_name
ORDER BY m.domain, m.table_name;

