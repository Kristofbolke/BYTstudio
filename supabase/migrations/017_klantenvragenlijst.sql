CREATE TABLE klantenvragenlijst (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projecten(id)
    ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL
    DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- Status
  status TEXT DEFAULT 'verzonden'
    CHECK (status IN (
      'aangemaakt','verzonden','ingevuld'
    )),

  -- SECTIE 1: Bedrijf
  sector TEXT,
  aantal_medewerkers TEXT,
  apparaten_json JSONB DEFAULT '[]'::jsonb,

  -- SECTIE 2: Uitdaging
  problemen_json JSONB DEFAULT '[]'::jsonb,
  probleem_andere TEXT,

  -- SECTIE 3: Gewenste functies
  functies_json JSONB DEFAULT '[]'::jsonb,
  functies_andere TEXT,

  -- SECTIE 4: Praktisch
  budget_range TEXT,
  gewenste_datum DATE,
  klant_naam TEXT,
  klant_email TEXT,
  klant_opmerkingen TEXT,

  -- META
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW(),
  ingevuld_op TIMESTAMPTZ,
  bijgewerkt_op TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE klantenvragenlijst
  ENABLE ROW LEVEL SECURITY;

-- Ingelogde developer kan alles
CREATE POLICY "developer beheert vragenlijst"
  ON klantenvragenlijst FOR ALL
  USING (auth.role() = 'authenticated');

-- Klant kan lezen en invullen via token
-- zonder in te loggen
CREATE POLICY "klant kan invullen via token"
  ON klantenvragenlijst FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "klant kan lezen via token"
  ON klantenvragenlijst FOR SELECT
  USING (true);
