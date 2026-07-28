# CLAUDE CODE PROMPT — Fase 2C: Intakeformulier BYT Studio (v2, gecorrigeerde huisstijl)

Plak dit volledige bericht in een nieuwe Claude Code sessie, in de map van je BYT Studio project (`~/Documents/Ontwikkeling_tools/byt-studio`).

**Dit vervangt de eerdere intakeformulier-prompt, die foutieve huisstijl-waarden gebruikte (gold/Fraunces/DM Sans bestaan niet in de echte BYT Studio-huisstijl). Gebruik enkel deze versie.**

---

## CONTEXT

Dit is een uitbreiding van BYT Studio (React 18 + Vite + TypeScript + Tailwind + Supabase + Netlify, live op https://byt-studio.netlify.app). Fase 2B is af: ProjectDetail heeft tabbladen Overzicht, Huisstijl, Offertes, Facturatie, Info. Studio heeft tabbladen Bouwproces, Boilerplates, Handleidingen, Meldingen, AI-check.

Bouw nu **Fase 2C: het intakeformulier**, in twee vormen die dezelfde data delen:

1. **Intern tabblad** — nieuw tabblad "Intake" in ProjectDetail, ik vul dit zelf in tijdens of na een klantgesprek.
2. **Publieke pagina** via tokenlink — `/intake/:token`, volledig los van de ingelogde app-omgeving (geen login nodig), zodat een klant het zelf thuis kan invullen. Ik genereer de link vanuit ProjectDetail met een knop "Publieke link genereren" die de URL naar het klembord kopieert.

Beide vormen tonen exact dezelfde zes secties en slaan op in dezelfde tabel, met een veld dat bijhoudt of ikzelf of de klant het heeft ingevuld.

---

## 1. DATABASE (Supabase)

Maak een migratie met een nieuwe tabel `intake_forms`:

```sql
create table intake_forms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
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

  -- Sectie 4: Gewenste features (dynamische lijst)
  features jsonb default '[]'::jsonb,
  -- elk item: { naam: string, beschrijving: string, prioriteit: 'must' | 'nice' }

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

create index idx_intake_forms_project_id on intake_forms(project_id);
create index idx_intake_forms_token on intake_forms(token);

-- Row Level Security
alter table intake_forms enable row level security;

-- Ingelogde gebruiker (jij) mag alles op eigen projecten
create policy "Owner full access" on intake_forms
  for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  );

-- Publiek: alleen lezen/schrijven via het exacte token, nooit een lijst opvragen
create policy "Public access via token" on intake_forms
  for select
  using (true);

create policy "Public update via token" on intake_forms
  for update
  using (true);
```

**Belangrijk voor de publieke policy:** de select/update policies hierboven staan open omdat Supabase RLS niet kan filteren op "de token die de gebruiker kent" — dat wordt afgedwongen in de applicatiecode door altijd te queryen op `.eq('token', token)` en nooit een lijst van rijen op te halen via de publieke pagina. Zorg dat de publieke pagina **nooit** een query doet zonder token-filter, en dat er geen publieke route bestaat die alle intakes toont.

Genereer deze migratie en pas toe met `Supabase:apply_migration` of via de Supabase MCP-tool die al gekoppeld is.

---

## 2. HUISSTIJL (toe te passen op beide varianten)

**Belangrijk: dit is de officiële BYT Studio-huisstijl uit `brand.css`. Als je project deze tokens al heeft (via de eerdere huisstijl-migratie), hergebruik die — maak geen nieuwe/parallelle kleurdefinities aan.**

```css
--ink: #0B0F0E;
--black: #000000;
--green: #22C35D;
--green-600: #17A84B;
--green-300: #7BDFA3;
--green-50: #E9F9EF;
--white: #FFFFFF;
--paper: #F4F6F5;

--g50: #F2F4F3;
--g100: #E7EBE9;
--g200: #D5DAD8;
--g300: #B7BEBB;
--g400: #929996;
--g500: #6B726F;
--g600: #4D534F;
--g700: #373C39;
--g800: #252926;
--g900: #151817;

--amber: #FFB020;
--amber-50: #FFF3DD;

font-family (koppen/display): 'Space Grotesk', sans-serif;
font-family (body/UI): 'IBM Plex Sans', sans-serif;
font-family (labels/mono/eyebrow): 'IBM Plex Mono', monospace;
```

Gebruik `--green` (`#22C35D`) voor vlakken/knoppen/actieve stap-indicatoren, en `--green-600` (`#17A84B`) voor kleine groene tekst op een lichte achtergrond (beter contrast) — dat is het patroon dat de brandkit zelf consequent toepast.

- **Intern tabblad:** gebruikt de bestaande app-shell/navigatie van BYT Studio; kleurenpalet en fonts hierboven voor de formulier-content zelf.
- **Publieke pagina:** **geen** app-navigatie/sidebar. Losstaande pagina met een rustige header: logo bovenaan (klein), `--ink` (`#0B0F0E`) achtergrond in de header, `--paper` (`#F4F6F5`) als achtergrond voor de formuliersecties zelf.

**Logo:** gebruik de assets uit `public/assets/logo/` en `public/assets/mark/` (dezelfde set als gebruikt bij de algemene huisstijl-migratie).
- Publieke pagina-header (donkere achtergrond) → `logo-reversed.svg`
- Bedankscherm/kleine iconen → `mark-tile.svg`
- Intern tabblad (volgt de bestaande sidebar-achtergrond van de app) → dezelfde logo-variant die daar al gebruikt wordt na de huisstijl-migratie

---

## 3. STRUCTUUR: ZES SECTIES

Bouw een herbruikbare component `IntakeFormWizard` (gebruikt door zowel het interne tabblad als de publieke pagina) met een stap-indicator bovenaan (1 t/m 6) en Vorige/Volgende-knoppen. Auto-save bij elke stapwissel (update de rij in Supabase, status blijft `draft`).

**Stap 1 — Het bedrijf**
- Bedrijfsnaam (tekst, verplicht)
- Ondernemingsvorm (dropdown: eenmanszaak, BV, vzw, andere)
- Sector (tekst)
- Aantal medewerkers (dropdown: 1, 2-5, 6-20, 21-50, 50+)
- Contactpersoon: naam, functie, e-mail, telefoon
- Website (tekst, optioneel)
- Adres (tekst, optioneel)

**Stap 2 — De problematiek**
- Hoe verloopt dit vandaag? (textarea)
- Wat is het grootste pijnpunt? (textarea, verplicht)
- Hoeveel tijd gaat hier per week/maand aan verloren? (tekst)
- Wat gebeurt er als dit niet wordt opgelost? (textarea)
- Zijn er al eerdere pogingen geweest om dit op te lossen? (textarea)

**Stap 3 — De gewenste app**
- Type app (dropdown: webapp, PWA/mobiele app, dashboard, interne tool, klantportaal, andere)
- Korte omschrijving van wat de app moet doen (textarea, verplicht)
- Is er een vergelijkbare app of tool als voorbeeld? (tekst)
- Prioriteit/timing (dropdown: dringend, komende 3 maanden, geen haast, verkennend)

**Stap 4 — Gewenste features**
- Dynamische lijst: knop "Feature toevoegen" → per item: naam (tekst), beschrijving (textarea), prioriteit (radio: must-have / nice-to-have)
- Minstens 1 feature vereist om door te gaan, geen maximum
- Knop om een feature te verwijderen

**Stap 5 — IT-situatie**
- Welke software/tools worden nu gebruikt? (textarea)
- Bestaat er al data die moet worden overgenomen? (textarea, bv. Excel-bestanden, ander systeem)
- Zijn er integraties nodig? (textarea, bv. boekhouding, CRM, betaalprovider)
- Technische kennis binnen het bedrijf (dropdown: geen, basis, gevorderd, eigen IT-dienst)
- Hostingvoorkeur (dropdown: geen voorkeur, bestaande hosting behouden, advies gewenst)
- Budgetindicatie (dropdown: <2.500€, 2.500-5.000€, 5.000-10.000€, 10.000€+, nog te bepalen)

**Stap 6 — Doelgroep en gebruikers**
- Wie gebruikt de app? (checkboxes: intern personeel, klanten, leveranciers, publiek/iedereen)
- Aantal gebruikers (tekst/dropdown)
- Technische vaardigheid van de gebruikers (dropdown: laag, gemiddeld, hoog, gemengd)
- Op welke apparaten? (checkboxes: desktop, tablet, smartphone)
- Taal/talen van de app (checkboxes: NL, FR, EN, DE)

Na stap 6: overzichtsscherm met samenvatting van alle ingevulde velden, knop "Versturen" → zet `status = 'submitted'`, `submitted_at = now()`, toont bedankpagina.

---

## 4. ROUTES EN INTEGRATIE

- `/projecten/:id` → nieuw tabblad **"Intake"** in de bestaande tabbladenrij, toont `IntakeFormWizard` met `filled_by = 'intern'`. Als er nog geen `intake_forms`-rij bestaat voor dit project, maak er automatisch één aan (status `draft`) zodra het tabblad geopend wordt.
- Knop in ProjectDetail (Overzicht-tabblad): **"Publieke link genereren"** → als er nog geen intake-rij is, maak er één; toon dan de URL `https://byt-studio.netlify.app/intake/{token}` in een kopieerbaar veld met een "Kopieer"-knop.
- Nieuwe publieke route `/intake/:token` (buiten de ingelogde app-shell, geen auth-check) → haalt de rij op via `.eq('token', token).single()`, toont `IntakeFormWizard` met `filled_by = 'klant'`. Als token niet bestaat: nette foutpagina "Deze link is niet geldig."
- Als de klant het formulier via de publieke link invult, zie ik dat resultaat automatisch terug in het interne "Intake"-tabblad (zelfde rij, zelfde data) — geen aparte sync nodig, gewoon dezelfde tabel.

---

## 5. UI-DETAILS

- Stap-indicator: 6 bolletjes/nummers bovenaan, huidige stap gemarkeerd in `--green` (`#22C35D`), afgewerkte stappen in `--green-600` (`#17A84B`).
- Elke stap in een kaart (afgeronde hoeken `14px`, rand in `--g200` (`#D5DAD8`), witte/`--paper`-achtergrond).
- Verplichte velden gemarkeerd met een asterisk, validatie vóór "Volgende" bij verplichte velden.
- Mobielvriendelijk: formulier moet goed werken op smartphone, aangezien de klant het mogelijk op zijn/haar telefoon invult.
- Autosave-indicator: klein tekstje "Opgeslagen" dat kort verschijnt na elke autosave.

---

## 6. TESTPLAN (voer dit uit voor je pusht)

1. Nieuw project aanmaken (of bestaand testproject gebruiken), tabblad "Intake" openen → lege wizard verschijnt, stap 1 actief.
2. Sectie 1 t/m 6 volledig invullen, tussendoor pagina herladen → data blijft bewaard (autosave werkt).
3. Bij stap 4 minstens 2 features toevoegen, één weer verwijderen → lijst update correct.
4. Formulier volledig indienen → status wordt `submitted`, bedankscherm verschijnt.
5. Vanuit ProjectDetail publieke link genereren, kopiëren, in incognito-venster openen → formulier laadt zonder inloggen.
6. In incognito het formulier invullen en versturen → terug in de ingelogde app, tabblad "Intake" van hetzelfde project tonen de zonet ingevulde data.
7. Een niet-bestaand token proberen (`/intake/00000000-0000-0000-0000-000000000000`) → nette foutpagina, geen crash.
8. `npm run build` lokaal draaien → geen errors, geen ongebruikte imports.

---

## 7. NA AFLOOP

Geef me een kort verslag met:
- Welke bestanden zijn aangemaakt/aangepast
- Of de migratie succesvol is toegepast op Supabase
- Of `npm run build` foutloos doorloopt
- Een korte samenvatting zodat ik daarna via GitHub Desktop kan committen en pushen
