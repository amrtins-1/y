-- Index recommendations for current model (PostgreSQL)
-- Apply selectively in production window.

CREATE INDEX IF NOT EXISTS idx_auth_session_user_expires_revoked
  ON app.auth_session (user_id, expires_at, revoked_at);

CREATE INDEX IF NOT EXISTS idx_contact_message_created_status
  ON app.contact_message (created_at, status);

CREATE INDEX IF NOT EXISTS idx_consultancy_request_created_status
  ON app.consultancy_request (created_at, status);

CREATE INDEX IF NOT EXISTS idx_consultancy_request_conflict_status
  ON app.consultancy_request (conflict_status);

CREATE INDEX IF NOT EXISTS idx_user_subscription_user_status
  ON app.user_subscription (user_id, status);

CREATE INDEX IF NOT EXISTS idx_market_quote_asset_quoted_at
  ON app.market_quote (asset_id, quoted_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_article_published_at
  ON app.news_article (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_item_published_at
  ON app.video_item (published_at DESC);

