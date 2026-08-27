# BYT Studio — CLAUDE.md

Interne tool van Build Your Tools voor het beheren en configureren van klant-apps.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router v6
- **Icons**: lucide-react
- **Deployment**: Netlify

## Commando's

```bash
npm run dev      # start dev server (standaard poort 5173, valt terug op 5174)
npm run build    # productie build naar dist/
npm run preview  # preview van de build
```

## Projectstructuur

```
src/
├── pages/               # Één bestand per route
├── components/
│   ├── studio/          # Studio-tabblad componenten
│   └── ...              # Gedeelde UI-componenten
├── lib/
│   ├── supabase.js      # Supabase client
│   └── handleidingGenerators.js  # Gedeelde handleiding-content generators
└── styles/
    ├── index.css        # Tailwind entry + globale stijlen
    └── print.css        # Print-stijlen voor offertes, handleidingen en facturen
```

## Routing (App.jsx)

| Route | Component |
|---|---|
| `/dashboard` | Dashboard |
| `/klanten` | Klanten |
| `/projecten` | Projecten |
| `/projecten/:id` | ProjectDetail |
| `/studio` | Studio |
| `/offertes` | Offertes |
| `/offertes/nieuw` | OfferteNieuw |
| `/offertes/:id` | OfferteDetail |
| `/klanten/:id` | KlantDetail |
| `/facturen` | Facturen |
| `/facturen/nieuw` | FactuurNieuw |
| `/facturen/:id` | FactuurDetail |
| `/handleidingen` | Handleidingen (overzicht) |
| `/handleidingen/nieuw` | HandleidingNieuw |
| `/handleidingen/:id` | HandleidingDetail |
| `/boilerplates` | Boilerplates (overzicht) |
| `/boilerplates/nieuw` | BoilerplateDetail (nieuw) |
| `/boilerplates/:id` | BoilerplateDetail |
| `/instellingen` | Instellingen |

## Database (Supabase)

Migraties staan in `supabase/migrations/` — uitvoeren via Supabase Dashboard → SQL Editor.

| Tabel | Beschrijving |
|---|---|
| `klanten` | Klantfiches |
| `projecten` | Projecten met `features_json` en `blokken_json` (JSONB) |
| `huisstijlen` | Huisstijl per project (kleuren, fonts, bedrijfsinfo) |
| `huisstijl_sjablonen` | Herbruikbare huisstijl-sjablonen |
| `offertes` | Offertes met `items_json` (JSONB) |
| `boilerplates` | Boilerplate bibliotheek (component/configurator/scaffold/service) |
| `project_boilerplates` | Koppeling project ↔ boilerplate met aanpassingen, gegenereerde prompt en status |
| `handleidingen` | Markdown-handleidingen per project (gebruiker/technisch) |
| `bug_meldingen` | Bug-meldingen van klanten |
| `instellingen` | App-instellingen (uurtarief, etc.) |

Alle tabellen hebben RLS ingeschakeld. Ingelogde gebruikers hebben volledige toegang.

## Studio-tabbladen (src/components/studio/)

| Component | Functie |
|---|---|
| `FeatureConfigurator` | Feature-selectie per categorie, opgeslagen in `projecten.features_json` |
| `PromptTemplates` | 7 herbruikbare Claude-prompts met zoekfunctie en aanpassing per project |
| `AppModules` | 13 modulecatalogus, togglebaar, prijsraming op basis van uurtarief |
| `BlokkensBuilder` | Drag-and-drop blokkenstructuur, opgeslagen in `projecten.blokken_json` |
| `Projectdocumentatie` | 5 secties: mappenstructuur, externe diensten, prijsraming, volgende stappen, handleidingen |

## OfferteBuilder (src/components/OfferteBuilder.jsx)

Gestructureerde offerte builder met 3 blokken. Geëxporteerde functies:

| Export | Beschrijving |
|---|---|
| `DEFAULT_BLOKKEN` | Startwaarden voor de 3 blokken (deep clone bij gebruik) |
| `berekenBlok(blok, uurtarief)` | Berekent subtotaal, BTW en totaal van één blok |
| `berekenAlles(blokken, uurtarief)` | Sommeert alle actieve blokken → `{ excl, btw, incl }` |
| `vlakItemsVoorFactuur(blokken, uurtarief)` | Converteert v2-blokken naar platte factuuritems |
| `default OfferteBuilder` | React component: `{ blokken, uurtarief, onChange }` |

### Blokken

| id | type | Inhoud |
|---|---|---|
| `ontwikkeling` | `ontwikkeling` | 8 categorieën; modus: `uren` (× uurtarief), `percentage` (van uren-subtotaal), `stuk` (qty × prijs) |
| `abonnement` | `abonnement` | 6 categorieën; prijs per maand + vrij tekstveld (servicenaam) |
| `support` | `support` | 3 radio-pakketten (Basis / Standaard / Pro); één actief tegelijk |

Elk blok heeft: `actief` (toggle), `btw` (%), en een eigen subtotaalweergave.

### items_json formaat (v2)

```json
{
  "_v": 2,
  "uurtarief": 85,
  "blokken": [ /* DEFAULT_BLOKKEN structuur */ ]
}
```

Detectie: `!Array.isArray(items_json) && items_json?._v === 2`

v1-offertes (platte array) blijven ongewijzigd werken — `OfferteDetail` en `OfferteNieuw` branchen op versie.

## features_json formaat

```json
{
  "modules": ["login", "factuur", "klanten"],
  "login": "multi",
  "dashboard": "uitgebreid"
}
```

`modules` is een array van module-keys. Overige keys zijn feature-configuraties.

## Print CSS (src/styles/print.css)

Bevat print-stijlen voor drie documenten:
- **Offertes**: klasse `.offerte-print` — geïmporteerd in `OfferteDetail.jsx`
- **Handleidingen**: klasse `.handleiding-print-content` — geïmporteerd in `HandleidingDetail.jsx`
- **Facturen**: klasse `.factuur-print-content` — geïmporteerd in `FactuurDetail.jsx`; alle klassen hebben het prefix `fp-`; accentkleur via CSS-variabele `--fp-primair` (standaard `#78C833`); Belgische wettelijke vermeldingen (BTW-nummer, RPR, IBAN/BIC, gestructureerde mededeling) aanwezig in de print layout.

Offertes en handleidingen gebruiken `--hs-primair` als accentkleur (gezet als inline style op het print-element).

## Conventies

- Componenten en pagina's in het **Nederlands** (labels, comments, variabelenamen)
- Supabase-client: `import { supabase } from '../lib/supabase'`
- Gedeelde module-data: `import { MODULES_DATA } from '../components/studio/modulesData'`
- Gedeelde handleiding-generators: `import { genereerGebruiker, genereerTechnisch, moduleNamenVanProject } from '../lib/handleidingGenerators'`
- Tailwind voor alle styling; inline `style` alleen voor dynamische kleuren (huisstijl)
- Geen externe component-libraries (geen shadcn, geen MUI)
- Lucide voor alle iconen

## Authenticatie

Supabase Auth — sessie via `supabase.auth.getSession()`. Niet ingelogd → redirect naar `/login`.
Recovery password werkt via de Supabase e-mailtemplate (check Supabase Dashboard → Auth → Email Templates).

## Status & Voortgang

### Wat al gebouwd en werkt

- [x] Dashboard — statistieken, openstaande offertes, vervallen facturen, widgets
- [x] Klanten — overzicht + detailpagina (KlantDetail)
- [x] Projecten — overzicht + detailpagina met tabbladen (Overzicht, Offertes, Facturatie, Studio, Handleidingen)
- [x] Studio — FeatureConfigurator, PromptTemplates, AppModules, BlokkensBuilder, Projectdocumentatie
- [x] Offertes — overzicht, nieuw, detail met PDF-print en offerte→factuur conversie; v2 gestructureerde builder (OfferteBuilder.jsx) met 3 blokken
- [x] Facturen — volledig met PDF-print, betaling registreren, herinneringen, creditnota, offerte→factuur conversie
- [x] Handleidingen — overzicht, nieuw, detail met PDF-print
- [x] Instellingen — IBAN, BIC, BTW-nummer, betalingstermijn, bedrijfsnaam via `useInstellingen()` context
- [x] Sidebar — vervallen facturen badge (rood), BYT-branding
- [x] Boilerplates — bibliotheek overzicht, detail/bewerken, project-koppeling met Claude-prompt generator
- [x] Deployment evaluatie geslaagd — `✓ built in 6.08s` (2026-04-21)
- [x] OfferteBuilder v2 — gestructureerde offerte builder met 3 blokken en backward compat (2026-04-21)

### Deployment checklist

- [x] Factuurmodule volledig
- [x] Pre-deployment evaluatie gedaan
- [x] Build geslaagd (6.08s)
- [ ] Netlify omgevingsvariabelen ingesteld (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ANTHROPIC_API_KEY`)
- [ ] Supabase RLS policies gecontroleerd in productie
- [ ] Supabase Auth e-mailtemplate geconfigureerd

## Database schema — exacte kolomnamen

Opgebouwd uit `supabase/migrations/001_initial_schema.sql` t.e.m. `023_klanten_uitbreiding.sql`, in volgorde toegepast. Twee kolommen zijn expliciet geverifieerd tegen de **live database** (niet enkel de migratiebestanden) omdat ze in de praktijk al eens afweken — zie de opmerkingen bij `contactpersonen`.

### klanten
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| naam | text | ja |
| bedrijfsnaam | text | nee |
| btw_nummer | text | nee |
| adres | text | nee — oud vrij-tekstveld, vóór de gestructureerde adresvelden hieronder (023). Niet meer gebruikt in KlantDetail.jsx, maar kolom bestaat nog. |
| email | text | nee |
| telefoon | text | nee |
| sector | text | nee |
| notities | text | nee |
| aangemaakt_op | timestamptz | nee — wordt in de UI ook hergebruikt als **"Klant sinds"**-datum (Bedrijf-tabblad KlantDetail.jsx). Geen aparte `klant_sinds`-kolom. |
| handelsnaam | text | nee |
| ondernemingsnummer | text | nee |
| website | text | nee |
| taal_correspondentie | text | ja, default `'NL'` — check: `NL`/`FR`/`EN`. **Niet** `taal`. |
| status | text | ja, default `'actief'` — check: `actief`/`inactief`/`prospect`. |
| straat | text | nee |
| huisnummer | text | nee |
| postcode | text | nee |
| gemeente | text | nee |
| provincie | text | nee |
| land | text | ja, default `'België'` |
| facturatie_email | text | nee |
| iban | text | nee |
| bic | text | nee |
| betalingstermijn | integer | ja, default `30` — check: `15`/`30`/`45`/`60` |
| btw_regime | text | ja, default `'normaal'` — check: `normaal`/`vrijgesteld`/`medecontractant` |

### contactpersonen
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| klant_id | uuid | ja — FK → klanten, on delete cascade |
| voornaam | text | ja |
| achternaam | text | **ja in de live database** (migratiebestand had dit optioneel bedoeld — bij een leeg veld altijd `''` versturen, nooit `null`) |
| functie | text | nee |
| email | text | nee |
| gsm | text | nee |
| telefoon | text | nee |
| primair | boolean | ja, default `false` — **kolomnaam is `primair`, niet `primair_contact`** (live geverifieerd) |
| notities | text | nee |
| aangemaakt_op | timestamptz | nee |
| bijgewerkt_op | timestamptz | nee — auto-update via trigger |

### projecten
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| klant_id | uuid | nee — FK → klanten, on delete set null |
| naam | text | ja |
| beschrijving | text | nee |
| status | text | ja, default `'intake'` — check: `intake`/`offerte`/`in_ontwikkeling`/`afgeleverd`/`onderhoud` |
| github_url | text | nee |
| netlify_url | text | nee |
| aangemaakt_op | timestamptz | nee |
| bijgewerkt_op | timestamptz | nee — auto-update via trigger |
| features_json | jsonb | nee |
| blokken_json | jsonb | nee |
| hosting_provider | text | nee — `'netlify'` \| `'vercel'` |
| hosting_login | text | nee |
| hosting_wachtwoord | text | nee |
| hosting_type_account | text | nee |
| supabase_login | text | nee |
| supabase_wachtwoord | text | nee |
| supabase_organisatie | text | nee |
| supabase_project | text | nee |
| supabase_type_account | text | nee |
| supabase_url | text | nee |

### huisstijlen
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nee — FK → projecten, on delete cascade |
| primaire_kleur | text | nee |
| secundaire_kleur | text | nee |
| accent_kleur | text | nee |
| font_titel | text | nee |
| font_tekst | text | nee |
| logo_url | text | nee |
| bedrijfsslogan | text | nee |
| adres | text | nee |
| btw | text | nee |
| iban | text | nee |
| email | text | nee |
| website | text | nee |
| extra_json | jsonb | nee |

### huisstijl_sjablonen
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| naam | text | ja |
| huisstijl_json | jsonb | ja |
| aangemaakt_op | timestamptz | nee |

### offertes
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nee — FK → projecten, on delete set null |
| klant_id | uuid | nee — FK → klanten, on delete set null |
| offerte_nummer | text | nee |
| status | text | ja, default `'concept'` — check: `concept`/`verzonden`/`goedgekeurd`/`gefactureerd` |
| uurtarief | numeric | nee |
| btw_percentage | numeric | nee, default `21` |
| marge_percentage | numeric | nee, default `0` |
| items_json | jsonb | nee — v1 (platte array) of v2 (`{_v:2, uurtarief, blokken}`), zie sectie hierboven |
| notities | text | nee |
| aangemaakt_op | timestamptz | nee |
| geldig_tot | date | nee |

### handleidingen
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nee — FK → projecten, on delete cascade |
| type | text | ja, default `'gebruiker'` — check: `gebruiker`/`technisch` |
| inhoud_markdown | text | nee |
| aangemaakt_op | timestamptz | nee |
| bijgewerkt_op | timestamptz | nee — auto-update via trigger |

### bug_meldingen
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nee — FK → projecten, on delete set null |
| klant_naam | text | nee |
| klant_email | text | nee |
| onderdeel | text | nee |
| ernst | text | ja, default `'medium'` — check: `laag`/`medium`/`hoog` |
| stappen | text | nee |
| beschrijving | text | nee |
| browser | text | nee |
| status | text | ja, default `'nieuw'` — check: `nieuw`/`in_behandeling`/`opgelost`/`gesloten` |
| notities_developer | text | nee |
| aangemaakt_op | timestamptz | nee |
| opgelost_op | timestamptz | nee |

### klant_intake
Legacy — niet meer aangesloten op de UI sinds de herbouw van Klanten.jsx/KlantDetail.jsx (het oude Intake-tabblad in de slide-in fiche is verwijderd). Data blijft bestaan, tabel is niet meer bereikbaar via de app.

| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| klant_id | uuid | ja, uniek — FK → klanten, on delete cascade |
| sector | text | nee |
| aantal_medewerkers | text | nee |
| doelgroep | text | nee |
| website | text | nee |
| huidig_systeem | text | nee |
| huidig_systeem_vrij | text | nee |
| tijdverlies | text | nee |
| grootste_probleem | text | nee |
| must_have | text | nee |
| nice_to_have | text | nee |
| klanten_toegang | text | nee |
| apparaten | text | nee — JSON-array als tekst |
| budget | text | nee |
| opleverdatum | date | nee |
| onderhoud | text | nee |
| externe_diensten | text | nee — JSON-array als tekst |
| notities_gesprek | text | nee |
| datum_eerste_contact | date | nee, default vandaag |
| aangemaakt_op | timestamptz | nee |
| bijgewerkt_op | timestamptz | nee — auto-update via trigger |

### instellingen
Enkelvoudige configuratierij (altijd precies 1 rij).

| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| bedrijfsnaam | text | ja, default `'Build Your Tools'` |
| adres | text | nee |
| postcode | text | nee |
| gemeente | text | nee |
| land | text | nee, default `'België'` |
| btw_nummer | text | nee |
| email | text | nee |
| telefoon | text | nee |
| website | text | nee |
| iban | text | nee |
| bic | text | nee |
| bijgewerkt_op | timestamptz | nee |
| uurtarief | numeric | nee, default `75` |
| eigenaar_naam | text | nee |
| btw_percentage | numeric | nee, default `21` |
| marge_percentage | numeric | nee, default `15` |
| offerte_geldigheid | integer | nee, default `30` |
| offerte_voorwaarden | text | nee |
| factuur_voorwaarden | text | nee |
| betalingstermijn | integer | nee, default `30` |
| nalatigheidsintrest | numeric | nee, default `10` |
| forfait_schadevergoeding | numeric | nee, default `40` |
| banner_zichtbaar | boolean | nee, default `true` |
| banner_titel | text | nee, default `'Welkom bij Build Your Tools'` |
| banner_subtitel | text | nee, default `'Slimme apps voor slimme bedrijven'` |
| aangemaakt_op | timestamptz | nee |
| logo_url | text | nee |
| rechtbank | text | nee, default `'arrondissement Gent'` |
| standaard_projectstatus | text | nee, default `'intake'` |
| standaard_handleiding_versie | text | nee, default `'v1.0'` |
| standaard_auteur_handleiding | text | nee, default `'Build Your Tools'` |
| juridische_naam | text | nee — migratie 025, **nog niet uitgevoerd in Supabase** |
| secundair_logo_url | text | nee — migratie 026, **nog niet uitgevoerd in Supabase** |

### ai_checks
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nee — FK → projecten, on delete cascade |
| aangemaakt_op | timestamptz | nee |
| project_context | text | nee |
| suggesties_json | jsonb | nee |
| gelezen | boolean | nee, default `false` |
| toegepast_json | jsonb | nee, default `[]` |

### facturen
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nee — FK → projecten |
| klant_id | uuid | nee — FK → klanten |
| offerte_id | uuid | nee — FK → offertes |
| factuur_nummer | text | ja, uniek |
| status | text | nee, default `'verstuurd'` — check: `concept`/`verstuurd`/`betaald`/`vervallen`/`gedeeltelijk_betaald` |
| factuur_datum | date | nee, default vandaag |
| verval_datum | date | nee |
| items_json | jsonb | nee, default `[]` |
| subtotaal | numeric | nee, default `0` |
| btw_percentage | numeric | nee, default `21` |
| btw_bedrag | numeric | nee, default `0` |
| totaal_incl | numeric | nee, default `0` |
| betaald_bedrag | numeric | nee, default `0` |
| betaaldatum | date | nee |
| betalingswijze | text | nee |
| is_voorschot | boolean | nee, default `false` |
| voorschot_percentage | numeric | nee |
| is_creditnota | boolean | nee, default `false` |
| originele_factuur_id | uuid | nee — FK → facturen (zelfreferentie, creditnota's) |
| notities | text | nee |
| interne_notities | text | nee |
| herinneringen_json | jsonb | nee, default `[]` |
| aangemaakt_op | timestamptz | nee |
| bijgewerkt_op | timestamptz | nee |

### boilerplates
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| naam | text | ja |
| type | text | nee — check: `component`/`configurator`/`scaffold`/`service` |
| categorie | text | nee |
| beschrijving | text | nee |
| versie | text | nee, default `'1.0'` |
| github_url | text | nee |
| bestand_pad | text | nee |
| afhankelijkheden_json | jsonb | nee, default `[]` |
| aanpassingsprompt_template | text | nee |
| tags_json | jsonb | nee, default `[]` |
| actief | boolean | nee, default `true` |
| aangemaakt_op | timestamptz | nee |
| bijgewerkt_op | timestamptz | nee |
| status | text | ja, default `'boilerplate'` — check: `gepland`/`boilerplate` |
| sleutel | text | nee, uniek — stabiele identifier voor `gepland`-items |
| geschatte_bouwtijd | numeric | nee |
| geschatte_prijs | numeric | nee |

### project_boilerplates
| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nee — FK → projecten, on delete cascade |
| boilerplate_id | uuid | nee — FK → boilerplates |
| aanpassingen_json | jsonb | nee, default `{}` |
| gegenereerde_prompt | text | nee |
| status | text | nee, default `'geselecteerd'` — check: `geselecteerd`/`ingebouwd`/`aangepast` |
| notities | text | nee |
| aangemaakt_op | timestamptz | nee |

### intake
Voor `/projecten/:id/intake` (Intake.jsx) — te onderscheiden van `intake_forms` en `klantenvragenlijst` hieronder.

| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nee, uniek — FK → projecten, on delete cascade |
| bedrijfsnaam | text | nee |
| sector | text | nee |
| aantal_medewerkers | text | nee |
| omzetgrootte | text | nee |
| locaties | text | nee |
| bestaande_software | text | nee |
| website | text | nee |
| sociale_media | text | nee |
| probleem_omschrijving | text | nee |
| tijdrovende_processen | text | nee |
| manueel_werk | text | nee |
| grootste_frustraties | text | nee |
| eerder_geprobeerd | text | nee |
| app_doel | text | nee |
| app_functionaliteiten | text | nee |
| inspiratie_apps | text | nee |
| gewenste_naam | text | nee |
| gewenste_opleverdatum | date | nee |
| budget_range | text | nee |
| features_json | jsonb | nee, default `[]` |
| it_afdeling | boolean | nee, default `false` |
| it_afdeling_details | text | nee |
| app_beheerder | text | nee |
| apparaten_json | jsonb | nee, default `[]` |
| besturingssysteem | text | nee |
| internetverbinding | text | nee |
| integraties_nodig | text | nee |
| datamigratie | boolean | nee, default `false` |
| datamigratie_details | text | nee |
| datahoeveelheid | text | nee |
| doelgroep | text | nee |
| gebruikers_type | text | nee |
| aantal_gebruikers | text | nee |
| it_bekwaamheid | text | nee |
| interface_taal | text | nee, default `'Nederlands'` |
| toegankelijkheid | text | nee |
| rollen_nodig | boolean | nee, default `false` |
| rollen_details | text | nee |
| ingevuld_door | text | nee |
| status | text | nee, default `'bezig'` — check: `bezig`/`volledig`/`goedgekeurd` |
| notities | text | nee |
| aangemaakt_op | timestamptz | nee |
| bijgewerkt_op | timestamptz | nee |

### klantenvragenlijst
Publieke vragenlijst via tokenlink (Vragenlijst.jsx, `/vragenlijst/:token`).

| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nee — FK → projecten, on delete cascade |
| token | text | ja, uniek, default random hex |
| status | text | nee, default `'verzonden'` — check: `aangemaakt`/`verzonden`/`ingevuld` |
| sector | text | nee |
| aantal_medewerkers | text | nee |
| apparaten_json | jsonb | nee, default `[]` |
| problemen_json | jsonb | nee, default `[]` |
| probleem_andere | text | nee |
| functies_json | jsonb | nee, default `[]` |
| functies_andere | text | nee |
| budget_range | text | nee |
| gewenste_datum | date | nee |
| klant_naam | text | nee |
| klant_email | text | nee |
| klant_opmerkingen | text | nee |
| aangemaakt_op | timestamptz | nee |
| ingevuld_op | timestamptz | nee |
| bijgewerkt_op | timestamptz | nee |

### intake_forms
Publieke intake v2 via tokenlink (IntakePubliek.jsx, `/intake/:token`). **Let op**: gebruikt als enige tabel `created_at`/`updated_at` i.p.v. de overal elders gebruikte `aangemaakt_op`/`bijgewerkt_op`-conventie.

| Kolom | Type | Verplicht |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | ja, uniek — FK → projecten, on delete cascade |
| token | uuid | ja, uniek, default random |
| status | text | ja, default `'draft'` — check: `draft`/`submitted` |
| filled_by | text | nee — check: `intern`/`klant` |
| bedrijfsnaam | text | nee |
| ondernemingsvorm | text | nee |
| sector | text | nee |
| aantal_medewerkers | text | nee |
| contactpersoon_naam | text | nee |
| contactpersoon_functie | text | nee |
| contactpersoon_email | text | nee |
| contactpersoon_telefoon | text | nee |
| website | text | nee |
| adres | text | nee |
| huidige_werkwijze | text | nee |
| grootste_pijnpunt | text | nee |
| tijd_verloren | text | nee |
| gevolg_bij_niet_oplossen | text | nee |
| eerdere_pogingen | text | nee |
| type_app | text | nee |
| omschrijving_app | text | nee |
| vergelijkbaar_voorbeeld | text | nee |
| prioriteit | text | nee |
| features | jsonb | nee, default `[]` |
| huidige_tools | text | nee |
| bestaande_data | text | nee |
| benodigde_integraties | text | nee |
| technische_kennis_bedrijf | text | nee |
| hosting_voorkeur | text | nee |
| budget_indicatie | text | nee |
| gebruikers_type | text | nee |
| aantal_gebruikers | text | nee |
| technische_vaardigheid_gebruikers | text | nee |
| devices | text[] | nee |
| talen | text[] | nee |
| notities_intern | text | nee |
| created_at | timestamptz | nee |
| updated_at | timestamptz | nee |
| submitted_at | timestamptz | nee |

## Coding regel — database

ALTIJD de exacte kolomnamen uit het schema hierboven gebruiken.
NOOIT kolomnamen verzinnen of afleiden uit wat "logisch" lijkt.
Bij twijfel: lees het schema opnieuw, en als een query toch faalt met "column ... does not exist" of "could not find column", vertrouw de foutmelding boven aannames — werk het schema hierboven meteen bij zodra een afwijking met de live database wordt vastgesteld.
