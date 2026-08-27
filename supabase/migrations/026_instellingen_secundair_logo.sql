-- 026_instellingen_secundair_logo.sql — Aparte kolom voor het secundair (juridisch) logo
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Achtergrond: 'logo_url' is het hoofdlogo (commercieel, BYT) dat links op offertes/
-- facturen verschijnt. Er is nog geen kolom voor een tweede, optioneel logo (bv. het
-- Jogoo BV-logo) dat naast de officiële bedrijfsgegevens rechts moet verschijnen.
--
-- Idempotent: veilig om opnieuw uit te voeren.

ALTER TABLE instellingen
  ADD COLUMN IF NOT EXISTS secundair_logo_url TEXT;

COMMENT ON COLUMN instellingen.secundair_logo_url IS
  'Optioneel tweede logo (bv. juridische vennootschap "Jogoo BV"), getoond naast de bedrijfsgegevens op offertes/facturen. Leeg = niet getoond.';
