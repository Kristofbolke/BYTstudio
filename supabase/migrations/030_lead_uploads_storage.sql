-- 030_lead_uploads_storage.sql — Storage bucket voor bijlagen bij het publieke leadformulier
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Publieke bucket: bezoekers van het /intake-formulier (niet ingelogd) moeten
-- een logo en/of stijldocument kunnen uploaden. Ingelogde BYT Studio-gebruikers
-- lezen en beheren (verwijderen) de bestanden nadien vanuit Leads.jsx.
--
-- Idempotent: veilig om opnieuw uit te voeren.

insert into storage.buckets (id, name, public)
values ('lead-uploads', 'lead-uploads', true)
on conflict (id) do nothing;

drop policy if exists "publiek_upload_lead_uploads" on storage.objects;
create policy "publiek_upload_lead_uploads"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'lead-uploads');

drop policy if exists "publiek_lezen_lead_uploads" on storage.objects;
create policy "publiek_lezen_lead_uploads"
  on storage.objects for select
  to public
  using (bucket_id = 'lead-uploads');

drop policy if exists "auth_verwijder_lead_uploads" on storage.objects;
create policy "auth_verwijder_lead_uploads"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lead-uploads');
