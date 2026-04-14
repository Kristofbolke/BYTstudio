-- 001_initial_schema.sql — BYT Studio volledige databasestructuur
-- Voer uit in Supabase Dashboard → SQL Editor

-- ── Extensies ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Tabellen ───────────────────────────────────────────────────────────────

create table if not exists klanten (
  id            uuid primary key default uuid_generate_v4(),
  naam          text not null,
  bedrijfsnaam  text,
  btw_nummer    text,
  adres         text,
  email         text,
  telefoon      text,
  sector        text,
  notities      text,
  aangemaakt_op timestamptz default now()
);

create table if not exists projecten (
  id             uuid primary key default uuid_generate_v4(),
  klant_id       uuid references klanten(id) on delete set null,
  naam           text not null,
  beschrijving   text,
  status         text not null default 'intake'
                   check (status in ('intake','offerte','in_ontwikkeling','afgeleverd','onderhoud')),
  github_url     text,
  netlify_url    text,
  aangemaakt_op  timestamptz default now(),
  bijgewerkt_op  timestamptz default now()
);

create table if not exists huisstijlen (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid references projecten(id) on delete cascade,
  primaire_kleur   text,
  secundaire_kleur text,
  accent_kleur     text,
  font_titel       text,
  font_tekst       text,
  logo_url         text,
  bedrijfsslogan   text,
  adres            text,
  btw              text,
  iban             text,
  email            text,
  website          text,
  extra_json       jsonb
);

create table if not exists offertes (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid references projecten(id) on delete set null,
  klant_id         uuid references klanten(id) on delete set null,
  offerte_nummer   text,
  status           text not null default 'concept'
                     check (status in ('concept','verzonden','goedgekeurd','gefactureerd')),
  uurtarief        numeric,
  btw_percentage   numeric default 21,
  marge_percentage numeric default 0,
  items_json       jsonb,
  notities         text,
  aangemaakt_op    timestamptz default now(),
  geldig_tot       date
);

create table if not exists handleidingen (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references projecten(id) on delete cascade,
  type            text not null default 'gebruiker'
                    check (type in ('gebruiker','technisch')),
  inhoud_markdown text,
  aangemaakt_op   timestamptz default now()
);

create table if not exists bug_meldingen (
  id                 uuid primary key default uuid_generate_v4(),
  project_id         uuid references projecten(id) on delete set null,
  klant_naam         text,
  klant_email        text,
  onderdeel          text,
  ernst              text not null default 'medium'
                       check (ernst in ('laag','medium','hoog')),
  stappen            text,
  beschrijving       text,
  browser            text,
  status             text not null default 'nieuw'
                       check (status in ('nieuw','in_behandeling','opgelost','gesloten')),
  notities_developer text,
  aangemaakt_op      timestamptz default now(),
  opgelost_op        timestamptz
);

-- ── Auto-update bijgewerkt_op op projecten ────────────────────────────────
create or replace function set_bijgewerkt_op()
returns trigger language plpgsql as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

create trigger projecten_bijgewerkt_op
  before update on projecten
  for each row execute function set_bijgewerkt_op();

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table klanten       enable row level security;
alter table projecten     enable row level security;
alter table huisstijlen   enable row level security;
alter table offertes      enable row level security;
alter table handleidingen enable row level security;
alter table bug_meldingen enable row level security;

-- Ingelogde gebruiker heeft volledige toegang (single-user app)
create policy "auth_volledig" on klanten
  for all to authenticated using (true) with check (true);

create policy "auth_volledig" on projecten
  for all to authenticated using (true) with check (true);

create policy "auth_volledig" on huisstijlen
  for all to authenticated using (true) with check (true);

create policy "auth_volledig" on offertes
  for all to authenticated using (true) with check (true);

create policy "auth_volledig" on handleidingen
  for all to authenticated using (true) with check (true);

create policy "auth_volledig" on bug_meldingen
  for all to authenticated using (true) with check (true);
