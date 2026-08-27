-- 024_huisstijl_logo_storage.sql — Storage bucket voor huisstijl-logo's
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Publieke bucket (logo's moeten tonen op offertes/facturen/handleidingen
-- zonder login). Ingelogde gebruiker mag uploaden/overschrijven/verwijderen —
-- zelfde single-user-app patroon als de rest van de RLS-policies.
--
-- Idempotent: veilig om opnieuw uit te voeren.

insert into storage.buckets (id, name, public)
values ('huisstijl-logos', 'huisstijl-logos', true)
on conflict (id) do nothing;

drop policy if exists "auth_upload_huisstijl_logos" on storage.objects;
create policy "auth_upload_huisstijl_logos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'huisstijl-logos');

drop policy if exists "auth_update_huisstijl_logos" on storage.objects;
create policy "auth_update_huisstijl_logos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'huisstijl-logos');

drop policy if exists "auth_delete_huisstijl_logos" on storage.objects;
create policy "auth_delete_huisstijl_logos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'huisstijl-logos');

drop policy if exists "publiek_lezen_huisstijl_logos" on storage.objects;
create policy "publiek_lezen_huisstijl_logos"
  on storage.objects for select
  to public
  using (bucket_id = 'huisstijl-logos');
