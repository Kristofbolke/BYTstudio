CREATE TABLE intake (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projecten(id)
    ON DELETE CASCADE UNIQUE,

  -- SECTIE 1: Het bedrijf
  bedrijfsnaam TEXT,
  sector TEXT,
  aantal_medewerkers TEXT,
  omzetgrootte TEXT,
  locaties TEXT,
  bestaande_software TEXT,
  website TEXT,
  sociale_media TEXT,

  -- SECTIE 2: De problematiek
  probleem_omschrijving TEXT,
  tijdrovende_processen TEXT,
  manueel_werk TEXT,
  grootste_frustraties TEXT,
  eerder_geprobeerd TEXT,

  -- SECTIE 3: De gewenste app
  app_doel TEXT,
  app_functionaliteiten TEXT,
  inspiratie_apps TEXT,
  gewenste_naam TEXT,
  gewenste_opleverdatum DATE,
  budget_range TEXT,

  -- SECTIE 4: Gewenste features (JSON)
  features_json JSONB DEFAULT '[]'::jsonb,

  -- SECTIE 5: IT situatie
  it_afdeling BOOLEAN DEFAULT false,
  it_afdeling_details TEXT,
  app_beheerder TEXT,
  apparaten_json JSONB DEFAULT '[]'::jsonb,
  besturingssysteem TEXT,
  internetverbinding TEXT,
  integraties_nodig TEXT,
  datamigratie BOOLEAN DEFAULT false,
  datamigratie_details TEXT,
  datahoeveelheid TEXT,

  -- SECTIE 6: Doelgroep & gebruikers
  doelgroep TEXT,
  gebruikers_type TEXT,
  aantal_gebruikers TEXT,
  it_bekwaamheid TEXT,
  interface_taal TEXT DEFAULT 'Nederlands',
  toegankelijkheid TEXT,
  rollen_nodig BOOLEAN DEFAULT false,
  rollen_details TEXT,

  -- META
  ingevuld_door TEXT,
  status TEXT DEFAULT 'bezig'
    CHECK (status IN ('bezig','volledig','goedgekeurd')),
  notities TEXT,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW(),
  bijgewerkt_op TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developer beheert intake"
  ON intake FOR ALL
  USING (auth.role() = 'authenticated');
