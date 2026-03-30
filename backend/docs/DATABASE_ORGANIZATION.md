# Database Organization Guide

## 1) Current Situation (what is confusing)

Your database currently mixes many concerns in one flat schema (`app`), with no explicit domain boundary:

- Identity/Auth: `app_user`, `auth_session`, `user_address`
- CRM/Requests: `contact_message`, `consultancy_request`, `newsletter_subscriber`
- Commerce/Plans: `membership_plan`, `user_subscription`, `donation`, `product_catalog`, `service_catalog`
- Content: `news_article`, `video_item`
- Market: `market_asset`, `market_quote`, `user_market_watchlist`

This is not wrong, but it becomes hard to understand because:

1. Similar concepts are split in multiple places.
2. Some tables are "core runtime" and others are only "catalog/content".
3. There is no explicit lifecycle status for several entities.
4. There is no published data dictionary.

## 2) Target Organization (simple and readable)

Use domain-oriented grouping (logical first; physical schemas optional later):

### A. `identity`
- `app_user`
- `auth_session`
- `user_address`

### B. `crm`
- `contact_message`
- `consultancy_request`
- `newsletter_subscriber`

### C. `commerce`
- `membership_plan`
- `user_subscription`
- `donation`
- `product_catalog`
- `service_catalog`

### D. `content`
- `news_article`
- `video_item`

### E. `market`
- `market_asset`
- `market_quote`
- `user_market_watchlist`

## 3) Table-by-table action plan

### Keep as core
- `app_user`, `auth_session`, `membership_plan`, `user_subscription`, `market_asset`, `market_quote`

### Keep but normalize usage
- `contact_message` and `consultancy_request`:
  - both are "support tickets". Keep separate now, but standardize status + timestamps.
- `newsletter_subscriber`:
  - keep as marketing list, but integrate ingestion from contact opt-in.

### Candidate for consolidation (phase 2+)
- `product_catalog` + `service_catalog`:
  - long-term option: merge into `catalog_item` with `item_type` (`PRODUCT`/`SERVICE`).
  - short-term: keep separate for low risk.

### Candidate for archival strategy
- `news_article`, `video_item`, `market_quote`, `auth_session`:
  - these grow fast. Define retention and archive rules.

## 4) Naming and consistency rules

Apply these rules on new migrations:

1. All PKs as `id`.
2. All FK names as `<entity>_id`.
3. Time columns:
   - Use `created_at`, `updated_at` in mutable entities.
   - Use `published_at`, `fetched_at`, etc only when domain-specific.
4. Boolean columns as `is_active`, `is_manual_location`, etc.
5. Status columns always enum/text with documented values.
6. Unique constraints explicitly documented in dictionary.

## 5) Minimal indexes to ensure readability + performance

Recommended indexes (if missing):

- `auth_session(user_id, expires_at, revoked_at)`
- `contact_message(created_at, status)`
- `consultancy_request(created_at, status, conflict_status)`
- `newsletter_subscriber(email)` unique (already expected)
- `user_subscription(user_id, status)`
- `market_quote(asset_id, quoted_at desc)`
- `news_article(source_url)` unique (already expected)
- `video_item(platform, external_id)` unique (already expected)

## 6) Data dictionary template (create and maintain)

For each table, document:

- Business purpose
- Owner module
- Main lifecycle fields
- FK dependencies
- Read/write APIs
- Retention policy

Example:

- Table: `contact_message`
- Purpose: store incoming site contact forms
- API write path: `POST /api/contact-messages`
- Typical lifecycle: `NOVO -> EM_ANALISE -> RESOLVIDO`
- Retention: 24 months (example)

## 7) Recommended migration strategy

### Phase 1 (safe, now)
1. Freeze schema changes without migration scripts.
2. Generate inventory (row counts, indexes, constraints).
3. Publish data dictionary.
4. Add missing indexes.

### Phase 2 (low risk)
1. Standardize timestamps and status usage.
2. Add archive jobs for high-volume tables.
3. Align all write APIs with clear ownership.

### Phase 3 (structural)
1. Optional split by PostgreSQL schemas: `identity`, `crm`, `commerce`, `content`, `market`.
2. Optional merge `product_catalog` + `service_catalog` into unified catalog table.

## 8) Practical first step in your project

Run the SQL in:

- `backend/scripts/db_inventory.sql`
- `backend/scripts/db_index_recommendations.sql`

With these outputs, you can decide which tables are truly active and which are legacy/noise.

