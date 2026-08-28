-- 032_instellingen_logo_anon_select.sql — Publieke leestoegang tot enkel het BYT-logo
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Achtergrond: het publieke intakeformulier (/intake) toont het BYT-logo uit
-- instellingen.logo_url. De tabel had enkel een "authenticated" policy, en
-- bevat gevoelige velden (IBAN, BTW-nummer, banner-teksten, ...) die niet
-- publiek leesbaar mogen worden. Daarom: RLS-policy voor anon select,
-- gecombineerd met een kolom-grant die anon enkel toegang geeft tot de
-- logo_url-kolom — niet de rest van de rij.
--
-- Idempotent: veilig om opnieuw uit te voeren.

drop policy if exists "anon_select_logo" on instellingen;
create policy "anon_select_logo" on instellingen
  for select to anon using (true);

revoke select on instellingen from anon;
grant select (logo_url) on instellingen to anon;
