-- 031_sectoren_anon_select.sql — Publieke leestoegang tot sectoren
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Achtergrond: de sectoren-tabel (migratie 028) had enkel een "authenticated"
-- policy. Het nieuwe publieke intakeformulier (/intake) heeft een sector-
-- dropdown nodig zonder login — voegt enkel leestoegang toe, geen schrijf-
-- toegang (het publiek kan geen sectoren aanmaken/wijzigen).
--
-- Idempotent: veilig om opnieuw uit te voeren.

drop policy if exists "anon_select" on sectoren;
create policy "anon_select" on sectoren
  for select to anon using (actief = true);
