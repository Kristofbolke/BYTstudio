-- 018_intake_forms.sql — Intakeformulier v2 met publieke tokenlink

create table if not exists intake_forms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projecten(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  filled_by text check (filled_by in ('intern', 'klant')),

  -- Sectie 1: Het bedrijf
  bedrijfsnaam text,
  ondernemingsvorm text,
  sector text,
  aantal_medewerkers text,
  contactpersoon_naam text,
  contactpersoon_functie text,
  contactpersoon_email text,
  contactpersoon_telefoon text,
  website text,
  adres text,

  -- Sectie 2: De problematiek
  huidige_werkwijze text,
  grootste_pijnpunt text,
  tijd_verloren text,
  gevolg_bij_niet_oplossen text,
  eerdere_pogingen text,

  -- Sectie 3: De gewenste app
  type_app text,
  omschrijving_app text,
  vergelijkbaar_voorbeeld text,
  prioriteit text,

  -- Sectie 4: Gewenste features
  -- elk item: { id, naam, beschrijving, prioriteit: 'must' | 'nice' }
  features jsonb default '[]'::jsonb,

  -- Sectie 5: IT-situatie
  huidige_tools text,
  bestaande_data text,
  benodigde_integraties text,
  technische_kennis_bedrijf text,
  hosting_voorkeur text,
  budget_indicatie text,

  -- Sectie 6: Doelgroep en gebruikers
  gebruikers_type text,
  aantal_gebruikers text,
  technische_vaardigheid_gebruikers text,
  devices text[],
  talen text[],

  notities_intern text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  submitted_at timestamptz
);

create index if not exists idx_intake_forms_project_id on intake_forms(project_id);
create index if not exists idx_intake_forms_token on intake_forms(token);

alter table intake_forms enable row level security;

-- Ingelogde gebruiker heeft volledige toegang
create policy "auth_volledig" on intake_forms
  for all to authenticated using (true) with check (true);

-- Publiek: select en update zonder login
-- Token-filter wordt afgedwongen in applicatiecode (.eq('token', token))
create policy "anon_select" on intake_forms
  for select to anon using (true);

create policy "anon_update" on intake_forms
  for update to anon using (true) with check (true);
