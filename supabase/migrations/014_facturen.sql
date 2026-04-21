-- 014_facturen.sql — Facturen tabel (juridisch bindend)
-- Voer uit in Supabase Dashboard → SQL Editor

CREATE TABLE facturen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projecten(id),
  klant_id UUID REFERENCES klanten(id),
  offerte_id UUID REFERENCES offertes(id),
  factuur_nummer TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'verstuurd'
    CHECK (status IN (
      'concept',
      'verstuurd',
      'betaald',
      'vervallen',
      'gedeeltelijk_betaald'
    )),
  factuur_datum DATE DEFAULT CURRENT_DATE,
  verval_datum DATE,
  items_json JSONB DEFAULT '[]'::jsonb,
  subtotaal NUMERIC DEFAULT 0,
  btw_percentage NUMERIC DEFAULT 21,
  btw_bedrag NUMERIC DEFAULT 0,
  totaal_incl NUMERIC DEFAULT 0,
  betaald_bedrag NUMERIC DEFAULT 0,
  betaaldatum DATE,
  betalingswijze TEXT,
  is_voorschot BOOLEAN DEFAULT false,
  voorschot_percentage NUMERIC,
  is_creditnota BOOLEAN DEFAULT false,
  originele_factuur_id UUID REFERENCES facturen(id),
  notities TEXT,
  interne_notities TEXT,
  herinneringen_json JSONB DEFAULT '[]'::jsonb,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW(),
  bijgewerkt_op TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE facturen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developer beheert facturen"
  ON facturen FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX facturen_project_id_idx  ON facturen(project_id);
CREATE INDEX facturen_klant_id_idx    ON facturen(klant_id);
CREATE INDEX facturen_status_idx      ON facturen(status);
CREATE INDEX facturen_verval_datum_idx ON facturen(verval_datum);
