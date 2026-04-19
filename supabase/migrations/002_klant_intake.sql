-- 002_klant_intake.sql — Intake-formulier per klant
-- Voer uit in Supabase Dashboard → SQL Editor

create table if not exists klant_intake (
  id                   uuid primary key default uuid_generate_v4(),
  klant_id             uuid references klanten(id) on delete cascade not null unique,

  -- Sectie 1: Bedrijfsprofiel
  sector               text,
  aantal_medewerkers   text,
  doelgroep            text,
  website              text,

  -- Sectie 2: Huidig pijnpunt
  huidig_systeem       text,
  huidig_systeem_vrij  text,
  tijdverlies          text,
  grootste_probleem    text,

  -- Sectie 3: Gewenste app
  must_have            text,
  nice_to_have         text,
  klanten_toegang      text,
  apparaten            text,   -- JSON array als tekst: ["Desktop","Tablet"]

  -- Sectie 4: Praktisch
  budget               text,
  opleverdatum         date,
  onderhoud            text,
  externe_diensten     text,   -- JSON array als tekst: ["Eigen domein","Hosting"]

  -- Sectie 5: Notities gesprek
  notities_gesprek     text,
  datum_eerste_contact date default current_date,

  aangemaakt_op        timestamptz default now(),
  bijgewerkt_op        timestamptz default now()
);

-- Auto-update bijgewerkt_op
create or replace function set_intake_bijgewerkt_op()
returns trigger language plpgsql as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

create trigger klant_intake_bijgewerkt_op
  before update on klant_intake
  for each row execute function set_intake_bijgewerkt_op();

-- Row Level Security
alter table klant_intake enable row level security;

create policy "auth_volledig" on klant_intake
  for all to authenticated using (true) with check (true);
