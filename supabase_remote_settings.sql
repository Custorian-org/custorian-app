-- Remote Parental Controls — run in Supabase SQL Editor

CREATE TABLE remote_settings (
  id BIGSERIAL PRIMARY KEY,
  family_code TEXT NOT NULL,
  child_device_id TEXT NOT NULL,
  settings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_code, child_device_id)
);

ALTER TABLE remote_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON remote_settings FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_remote_settings_family ON remote_settings (family_code, child_device_id);
