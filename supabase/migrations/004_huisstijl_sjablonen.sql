-- ── Huisstijl sjablonen ──────────────────────────────────────────────────────
CREATE TABLE huisstijl_sjablonen (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  naam          TEXT        NOT NULL,
  huisstijl_json JSONB      NOT NULL,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE huisstijl_sjablonen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developer beheert sjablonen"
  ON huisstijl_sjablonen
  FOR ALL
  USING (auth.role() = 'authenticated');
