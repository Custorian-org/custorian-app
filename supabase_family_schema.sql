-- Custorian Family Pairing & Alert Sync
-- Run in Supabase SQL Editor after the base schema

-- Family groups (parent + children linked by code)
CREATE TABLE families (
  id BIGSERIAL PRIMARY KEY,
  family_code TEXT NOT NULL UNIQUE, -- 6-digit pairing code
  parent_push_token TEXT, -- Expo push token for parent device
  parent_device_id TEXT, -- random ID for parent device
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children linked to a family
CREATE TABLE family_children (
  id BIGSERIAL PRIMARY KEY,
  family_code TEXT NOT NULL REFERENCES families(family_code),
  child_name TEXT NOT NULL, -- e.g. "Emma's iPhone"
  child_device_id TEXT NOT NULL, -- random ID for child device
  age_bracket TEXT, -- '8-10', '11-13', '14-16', '17+'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts synced from child devices to parent
CREATE TABLE family_alerts (
  id BIGSERIAL PRIMARY KEY,
  family_code TEXT NOT NULL,
  child_device_id TEXT NOT NULL,
  child_name TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence REAL NOT NULL,
  snippet TEXT NOT NULL, -- pattern description, NOT message content
  source_app TEXT,
  intervention_shown BOOLEAN DEFAULT FALSE,
  is_self_report BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'new', -- new, reviewed, resolved, escalated
  parent_action TEXT, -- blocked_contact, discussed, reported, etc.
  parent_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_alerts ENABLE ROW LEVEL SECURITY;

-- Allow inserts from app (anon key)
CREATE POLICY "Allow inserts" ON families FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts" ON family_children FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserts" ON family_alerts FOR INSERT WITH CHECK (true);

-- Allow reads filtered by family code (app sends family_code in query)
CREATE POLICY "Allow reads by family" ON families FOR SELECT USING (true);
CREATE POLICY "Allow reads by family" ON family_children FOR SELECT USING (true);
CREATE POLICY "Allow reads by family" ON family_alerts FOR SELECT USING (true);

-- Allow updates (parent reviewing alerts)
CREATE POLICY "Allow updates" ON family_alerts FOR UPDATE USING (true);
CREATE POLICY "Allow updates" ON families FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_family_alerts_code ON family_alerts (family_code);
CREATE INDEX idx_family_alerts_created ON family_alerts (created_at);
CREATE INDEX idx_family_children_code ON family_children (family_code);
