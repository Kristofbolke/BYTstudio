-- 027_offertes_nummer_uniek.sql — Unieke constraint op offerte_nummer
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Achtergrond: offerte_nummer had geen UNIQUE-constraint. De generatielogica in
-- OfferteNieuw.jsx telde simpelweg het aantal rijen in de tabel (COUNT(*) + 1)
-- in plaats van te kijken naar het hoogste bestaande volgnummer. Na het
-- verwijderen van een offerte kon de teller dalen, waardoor een volgend
-- aangemaakt nummer opnieuw bestond — zo ontstonden twee offertes met
-- nummer OFF-2026-002. Deze migratie voorkomt herhaling op databaseniveau;
-- de applicatielogica is apart gefixt om het hoogste bestaande volgnummer
-- per jaar op te zoeken.
--
-- BELANGRIJK: voer dit pas uit nadat het bestaande dubbele nummer is
-- hernoemd (zie STAP 4 van de bugfix — het tweede OFF-2026-002 is via de
-- app hernoemd naar OFF-2026-003). Zonder die stap faalt deze migratie
-- met een duplicate-key fout.
--
-- Idempotent: veilig om opnieuw uit te voeren.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'offertes_offerte_nummer_key'
  ) THEN
    ALTER TABLE offertes
      ADD CONSTRAINT offertes_offerte_nummer_key UNIQUE (offerte_nummer);
  END IF;
END $$;
