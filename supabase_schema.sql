-- Custorian Analytics Schema
-- Run this in Supabase SQL Editor (supabase.com/dashboard → SQL)

-- Detection events from risk engine
CREATE TABLE scan_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  category TEXT NOT NULL, -- grooming, bullying, self_harm, violence, content_wellness
  severity TEXT NOT NULL, -- critical, high, medium, low
  confidence REAL NOT NULL, -- 0.0 - 1.0
  language TEXT DEFAULT 'en', -- en, da, de, etc.
  source TEXT DEFAULT 'risk_engine', -- risk_engine, behavior_engine, content_radar
  platform TEXT, -- ios, android
  app_version TEXT
);

-- PhotoDNA scan results
CREATE TABLE photodna_scans (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_match BOOLEAN NOT NULL DEFAULT FALSE,
  response_time_ms INTEGER,
  status_code INTEGER,
  error TEXT,
  platform TEXT,
  app_version TEXT
);

-- Anonymous app sessions
CREATE TABLE app_sessions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT NOT NULL, -- random per app launch, not persistent
  platform TEXT,
  app_version TEXT
);

-- Intervention events
CREATE TABLE interventions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  category TEXT NOT NULL,
  intervention_type TEXT NOT NULL, -- empowerment_prompt, crisis_resource, block_contact
  platform TEXT,
  app_version TEXT
);

-- Daily aggregates (populated by a cron or on-demand)
CREATE TABLE daily_stats (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_scans INTEGER DEFAULT 0,
  total_alerts INTEGER DEFAULT 0,
  grooming_count INTEGER DEFAULT 0,
  bullying_count INTEGER DEFAULT 0,
  self_harm_count INTEGER DEFAULT 0,
  violence_count INTEGER DEFAULT 0,
  content_wellness_count INTEGER DEFAULT 0,
  photodna_scans INTEGER DEFAULT 0,
  photodna_matches INTEGER DEFAULT 0,
  active_sessions INTEGER DEFAULT 0,
  interventions_shown INTEGER DEFAULT 0
);

-- Quarterly accuracy metrics (manually updated after validation)
CREATE TABLE accuracy_metrics (
  id BIGSERIAL PRIMARY KEY,
  period TEXT NOT NULL, -- '2026-Q2'
  category TEXT NOT NULL,
  language TEXT NOT NULL,
  precision_score REAL,
  recall_score REAL,
  f1_score REAL,
  false_positive_rate REAL,
  sample_size INTEGER,
  auditor TEXT, -- 'self' or auditor org name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photodna_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE accuracy_metrics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts from the app (anon key)
CREATE POLICY "Allow anonymous inserts" ON scan_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous inserts" ON photodna_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous inserts" ON app_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous inserts" ON interventions FOR INSERT WITH CHECK (true);

-- Allow public reads for the dashboard (all data is anonymous anyway)
CREATE POLICY "Allow public reads" ON scan_events FOR SELECT USING (true);
CREATE POLICY "Allow public reads" ON photodna_scans FOR SELECT USING (true);
CREATE POLICY "Allow public reads" ON app_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public reads" ON interventions FOR SELECT USING (true);
CREATE POLICY "Allow public reads" ON daily_stats FOR SELECT USING (true);
CREATE POLICY "Allow public reads" ON accuracy_metrics FOR SELECT USING (true);

-- Indexes for dashboard queries
CREATE INDEX idx_scan_events_created ON scan_events (created_at);
CREATE INDEX idx_scan_events_category ON scan_events (category);
CREATE INDEX idx_photodna_created ON photodna_scans (created_at);
CREATE INDEX idx_sessions_created ON app_sessions (created_at);
CREATE INDEX idx_daily_stats_date ON daily_stats (date);
