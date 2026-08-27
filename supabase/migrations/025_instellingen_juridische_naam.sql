-- 025_instellingen_juridische_naam.sql — Aparte kolom voor de juridische bedrijfsnaam
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Achtergrond: 'eigenaar_naam' is een persoonsnaamveld ("Naam eigenaar" in de UI,
-- placeholder "Voornaam Achternaam") en 'bedrijfsnaam' bevat al de commerciële naam
-- ("Build Your Tools"). Geen van beide is geschikt voor de juridische vennootschapsnaam
-- ("Jogoo BV") die op offertes/facturen naast het logo moet verschijnen.
--
-- Idempotent: veilig om opnieuw uit te voeren.

ALTER TABLE instellingen
  ADD COLUMN IF NOT EXISTS juridische_naam TEXT;

COMMENT ON COLUMN instellingen.juridische_naam IS
  'Juridische vennootschapsnaam (bv. "Jogoo BV"), te onderscheiden van bedrijfsnaam (commerciële naam, bv. "Build Your Tools") en eigenaar_naam (persoonsnaam).';
