-- 029_leads.sql — Publiek intakeformulier (marketingwebsite) → leads-tabel
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Achtergrond: het publieke formulier op /intake laat bezoekers van de BYT-website
-- (nog geen klant, nog geen project) een aanvraag indienen. Dit is bewust een
-- aparte tabel van 'intake_forms' — die is altijd gekoppeld aan een reeds
-- bestaand project (project_id not null) en wordt intern per klant verstuurd.
-- Een lead bestaat vóór er een klant/project is; klant_id/project_id worden
-- pas ingevuld bij "Omzet naar project" vanuit Leads.jsx.
--
-- Kolomnamen mirroren zoveel mogelijk intake_forms voor consistentie.
--
-- Idempotent: veilig om opnieuw uit te voeren.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'nieuw' check (status in ('nieuw', 'in_behandeling', 'omgezet', 'gesloten')),

  -- Stap 1: Uw bedrijf
  bedrijfsnaam text not null,
  contactpersoon_naam text not null,
  contactpersoon_functie text,
  contactpersoon_email text not null,
  contactpersoon_telefoon text,
  website text,
  sector text,
  aantal_medewerkers text,
  ondernemingsvorm text,
  adres text,

  -- Stap 2: Uw huisstijl
  heeft_huisstijl boolean,
  huisstijl_beschrijving text,
  logo_url text,
  stijldocument_url text,

  -- Stap 3: Uw uitdaging
  huidige_werkwijze text,
  grootste_pijnpunt text,
  tijd_verloren text,
  eerder_geprobeerd text,

  -- Stap 4: De gewenste app
  type_app text,
  omschrijving_app text,
  vergelijkbaar_voorbeeld text,
  prioriteit text,
  budget_indicatie text,
  gewenste_opleverdatum date,

  -- Stap 5: Gewenste features — array van strings
  features jsonb default '[]'::jsonb,

  -- Stap 6: Technisch & gebruikers
  apparaten text[],
  gebruikers_type text,
  aantal_gebruikers text,
  it_bekwaamheid text,
  interface_talen text[],
  integraties_nodig text,

  -- Stap 7: Afronden
  hosting_voorkeur text,
  technische_kennis_bedrijf text,
  opmerkingen text,

  -- Beheer (intern, BYT Studio)
  notities_intern text,
  klant_id uuid references klanten(id) on delete set null,
  project_id uuid references projecten(id) on delete set null,

  ingediend_op timestamptz default now(),
  bijgewerkt_op timestamptz default now()
);

create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_ingediend_op on leads(ingediend_op desc);

create trigger leads_bijgewerkt_op
  before update on leads
  for each row execute function set_bijgewerkt_op();

alter table leads enable row level security;

-- Ingelogde gebruiker (BYT Studio) heeft volledige toegang
create policy "auth_volledig" on leads
  for all to authenticated using (true) with check (true);

-- Publiek: enkel toevoegen (het website-formulier), geen lees/schrijftoegang nadien
create policy "anon_insert" on leads
  for insert to anon with check (true);
