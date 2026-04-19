-- 003_instellingen.sql — Bedrijfsinstellingen (enkelvoudige rij)
-- Voer uit in Supabase Dashboard → SQL Editor

create table if not exists instellingen (
  id            uuid primary key default uuid_generate_v4(),
  bedrijfsnaam  text not null default 'Build Your Tools',
  adres         text,
  postcode      text,
  gemeente      text,
  land          text default 'België',
  btw_nummer    text,
  email         text,
  telefoon      text,
  website       text,
  iban          text,
  bic           text,
  bijgewerkt_op timestamptz default now()
);

alter table instellingen enable row level security;

create policy "auth_volledig" on instellingen
  for all to authenticated using (true) with check (true);

-- Voeg één standaardrij in (enkelvoudige configuratierij)
insert into instellingen (bedrijfsnaam, email)
  values ('Build Your Tools', '')
  on conflict do nothing;
