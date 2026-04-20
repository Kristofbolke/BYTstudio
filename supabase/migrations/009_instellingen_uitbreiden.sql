-- 009_instellingen_uitbreiden.sql
-- Voegt ontbrekende kolommen toe aan de bestaande instellingen-tabel
-- Voer uit in Supabase Dashboard → SQL Editor

ALTER TABLE instellingen
  ADD COLUMN IF NOT EXISTS eigenaar_naam TEXT,
  ADD COLUMN IF NOT EXISTS uurtarief NUMERIC DEFAULT 75,
  ADD COLUMN IF NOT EXISTS btw_percentage NUMERIC DEFAULT 21,
  ADD COLUMN IF NOT EXISTS marge_percentage NUMERIC DEFAULT 15,
  ADD COLUMN IF NOT EXISTS offerte_geldigheid INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS offerte_voorwaarden TEXT,
  ADD COLUMN IF NOT EXISTS factuur_voorwaarden TEXT,
  ADD COLUMN IF NOT EXISTS betalingstermijn INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS nalatigheidsintrest NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS forfait_schadevergoeding NUMERIC DEFAULT 40,
  ADD COLUMN IF NOT EXISTS banner_zichtbaar BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS banner_titel TEXT DEFAULT 'Welkom bij Build Your Tools',
  ADD COLUMN IF NOT EXISTS banner_subtitel TEXT DEFAULT 'Slimme apps voor slimme bedrijven',
  ADD COLUMN IF NOT EXISTS aangemaakt_op TIMESTAMPTZ DEFAULT NOW();

-- Zorg dat er altijd precies één rij bestaat
INSERT INTO instellingen (bedrijfsnaam)
VALUES ('Build Your Tools')
ON CONFLICT DO NOTHING;
