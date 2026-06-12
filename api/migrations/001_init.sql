-- プロフ帳 (selfie) initial schema.

CREATE TABLE IF NOT EXISTS sheets (
  id          TEXT PRIMARY KEY,
  nickname    TEXT        NOT NULL,
  fullname    TEXT        NOT NULL DEFAULT '',
  avatar      INTEGER     NOT NULL DEFAULT 0,
  av_color    INTEGER     NOT NULL DEFAULT 0,
  dept_idx    INTEGER     NOT NULL DEFAULT 0,
  catch       TEXT        NOT NULL DEFAULT '',
  hobbies     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  recent      TEXT        NOT NULL DEFAULT '',
  resolution  TEXT        NOT NULL DEFAULT '',
  wishlist    TEXT        NOT NULL DEFAULT '',
  -- Photo is stored as a data URL (data:<mime>;base64,<...>) or NULL for the
  -- character avatar. Served via /api/sheets/:id/photo so list payloads stay small.
  photo       TEXT,
  pin_hash    TEXT        NOT NULL,
  -- Lunch-date can only be set by an admin (the design forbids self-input).
  lunch_date  DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per (sheet, anonymous client, reaction kind). Presence == reacted.
CREATE TABLE IF NOT EXISTS reactions (
  sheet_id   TEXT NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  client_id  TEXT NOT NULL,
  kind       TEXT NOT NULL CHECK (kind IN ('heart', 'star', 'clap', 'smile')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sheet_id, client_id, kind)
);
CREATE INDEX IF NOT EXISTS reactions_sheet_idx ON reactions (sheet_id);

CREATE TABLE IF NOT EXISTS comments (
  id         BIGSERIAL PRIMARY KEY,
  sheet_id   TEXT NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  by         TEXT NOT NULL,
  avatar     INTEGER NOT NULL DEFAULT 0,
  av_color   INTEGER NOT NULL DEFAULT 0,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_sheet_idx ON comments (sheet_id, created_at);

CREATE INDEX IF NOT EXISTS sheets_lunch_date_idx ON sheets (lunch_date);
CREATE INDEX IF NOT EXISTS sheets_created_idx ON sheets (created_at DESC);
