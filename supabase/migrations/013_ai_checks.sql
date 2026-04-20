-- 013_ai_checks.sql — Tabel voor AI-suggesties per project
-- Voer uit in Supabase Dashboard → SQL Editor

CREATE TABLE ai_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projecten(id)
    ON DELETE CASCADE,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW(),
  project_context TEXT,
  suggesties_json JSONB,
  gelezen BOOLEAN DEFAULT false,
  toegepast_json JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE ai_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developer beheert ai checks"
  ON ai_checks FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX ai_checks_project_id_idx
  ON ai_checks(project_id);

CREATE INDEX ai_checks_aangemaakt_op_idx
  ON ai_checks(aangemaakt_op DESC);
