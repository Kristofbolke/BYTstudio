-- 015_boilerplates.sql — Boilerplate bibliotheek

CREATE TABLE boilerplates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL,
  type TEXT CHECK (type IN (
    'component','configurator','scaffold','service'
  )),
  categorie TEXT,
  beschrijving TEXT,
  versie TEXT DEFAULT '1.0',
  github_url TEXT,
  bestand_pad TEXT,
  afhankelijkheden_json JSONB DEFAULT '[]'::jsonb,
  aanpassingsprompt_template TEXT,
  tags_json JSONB DEFAULT '[]'::jsonb,
  actief BOOLEAN DEFAULT true,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW(),
  bijgewerkt_op TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_boilerplates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projecten(id) ON DELETE CASCADE,
  boilerplate_id UUID REFERENCES boilerplates(id),
  aanpassingen_json JSONB DEFAULT '{}'::jsonb,
  gegenereerde_prompt TEXT,
  status TEXT DEFAULT 'geselecteerd'
    CHECK (status IN (
      'geselecteerd','ingebouwd','aangepast'
    )),
  notities TEXT,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE boilerplates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_boilerplates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "developer beheert boilerplates"
  ON boilerplates FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "developer beheert project boilerplates"
  ON project_boilerplates FOR ALL
  USING (auth.role() = 'authenticated');

-- Initiële boilerplates
INSERT INTO boilerplates
  (naam, type, categorie, beschrijving, versie,
   aanpassingsprompt_template, tags_json)
VALUES
(
  'Adres & Contact Configurator',
  'configurator',
  'Intake',
  'BYT Studio intern intake-instrument dat automatisch een Claude Code prompt genereert op basis van klantbehoeften. Blokken 1-7 met chips, notitievelden, API-popup systeem en sticky prompt-generator.',
  '2.0',
  'De Adres & Contact Configurator is aanwezig in src/modules/address-configurator/

Pas het aan voor klant "[KLANT_NAAM]":
[AANPASSINGEN]

Raak geen andere logica aan.',
  '["adres","contact","configurator","intake","prompt-generator"]'
),
(
  'Adres & Contact Module',
  'component',
  'Formulieren',
  'Volledig herbruikbaar Next.js + TypeScript component met postcode-autofill, deelgemeenten, Google Places, IBAN→BIC en libphonenumber. Props-gestuurd, CSS-variabelen voor huisstijl.',
  '1.0',
  'Het bestand src/components/address-contact/AddressContactForm.tsx bestaat al als boilerplate.

Pas het aan voor klant "[KLANT_NAAM]":
[AANPASSINGEN]

Raak geen andere code aan — alleen deze wijzigingen.',
  '["adres","contact","formulier","next.js","typescript","autofill"]'
);
