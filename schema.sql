-- Schema for anonymous signal statistics
-- This table stores ONLY anonymized data (no personal information)

CREATE TABLE IF NOT EXISTS anonymous_signals (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  source TEXT NOT NULL,
  custom_source TEXT,
  district TEXT NOT NULL,
  symptoms TEXT NOT NULL,  -- JSON array of symptoms
  email_hash TEXT NOT NULL,  -- SHA-256 hash of email for unique respondent tracking
  created_at INTEGER NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_timestamp ON anonymous_signals(timestamp);
CREATE INDEX IF NOT EXISTS idx_source ON anonymous_signals(source);
CREATE INDEX IF NOT EXISTS idx_district ON anonymous_signals(district);
CREATE INDEX IF NOT EXISTS idx_created_at ON anonymous_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_email_hash ON anonymous_signals(email_hash);
