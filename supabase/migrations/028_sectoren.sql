-- 028_sectoren.sql — Beheerbare sectorenlijst (vervangt hardcoded SECTOREN-arrays)
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Achtergrond: 'sector' werd tot nu toe overal als vrije tekst of via een
-- hardcoded array (verschillend per bestand: KlantDetail.jsx vs ProjectDetail.jsx)
-- ingevuld. Deze tabel wordt de centrale, beheerbare bron voor de nieuwe
-- SectorSelect-component. Bestaande kolommen (klanten.sector,
-- huisstijlen.extra_json.sector) blijven vrije tekst — er is bewust geen FK,
-- zodat bestaande data niet breekt en sectoren vrij hernoembaar/verwijderbaar
-- blijven zonder migratie van bestaande rijen.

CREATE TABLE IF NOT EXISTS sectoren (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL UNIQUE,
  actief BOOLEAN NOT NULL DEFAULT true,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sectoren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developer beheert sectoren"
  ON sectoren FOR ALL
  USING (auth.role() = 'authenticated');

-- Seed: samenvoeging van de twee bestaande hardcoded lijsten
INSERT INTO sectoren (naam) VALUES
  ('Horeca'), ('Retail'), ('Bouw & vastgoed'), ('Zorg & welzijn'),
  ('IT & software'), ('Marketing & communicatie'), ('Onderwijs'),
  ('Logistiek'), ('Financiën'), ('Evenementen'), ('Overheid'),
  ('Sport & recreatie'), ('Vrije beroepen'), ('Overige')
ON CONFLICT (naam) DO NOTHING;
