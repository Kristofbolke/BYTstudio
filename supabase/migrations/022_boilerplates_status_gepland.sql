-- 022_boilerplates_status_gepland.sql — Samenvoeging App-modules in boilerplates
-- Voegt status/sleutel/geschatte_bouwtijd/geschatte_prijs toe aan boilerplates
-- en migreert de 13 statische App-modules (voorheen hardcoded in
-- src/components/studio/AppModules.jsx) als rijen met status 'gepland'.
--
-- Bestaande boilerplate-rijen blijven ongewijzigd (status krijgt de default
-- 'boilerplate', geen enkele bestaande kolomwaarde wordt overschreven).

ALTER TABLE boilerplates
  ADD COLUMN status TEXT NOT NULL DEFAULT 'boilerplate'
    CHECK (status IN ('gepland', 'boilerplate')),
  ADD COLUMN sleutel TEXT UNIQUE,
  ADD COLUMN geschatte_bouwtijd NUMERIC,
  ADD COLUMN geschatte_prijs NUMERIC;

COMMENT ON COLUMN boilerplates.status IS
  'gepland = nog te bouwen feature-idee, boilerplate = bewezen herbruikbare bouwsteen';
COMMENT ON COLUMN boilerplates.sleutel IS
  'Stabiele identifier voor gepland-items, komt overeen met de keys die in projecten.features_json.modules worden opgeslagen';
COMMENT ON COLUMN boilerplates.geschatte_bouwtijd IS
  'Uren, enkel ingevuld/relevant zolang status = gepland';
COMMENT ON COLUMN boilerplates.geschatte_prijs IS
  'Optioneel; de UI berekent de prijs standaard live als geschatte_bouwtijd × instellingen.uurtarief';

-- ── Migratie van de 13 App-modules (voorheen AppModules.jsx) ──────────────────
INSERT INTO boilerplates
  (naam, categorie, beschrijving, status, sleutel, geschatte_bouwtijd, aanpassingsprompt_template)
VALUES
(
  $$Login & rollen$$, $$Basis$$,
  $$Inlogscherm, wachtwoord, rollen admin/medewerker, sessie via Supabase Auth.$$,
  'gepland', 'login', 6,
  $$Bouw een loginmodule met:
- Inlogscherm met e-mail en wachtwoord
- Supabase Auth voor sessie- en gebruikersbeheer
- Rollen: admin en medewerker
- Beveiligde routes (redirect naar login als niet ingelogd)
- Uitlogknop in navigatie
- Wachtwoord vergeten: stuur reset-mail via Supabase$$
),
(
  $$Factuurmodule$$, $$Financieel$$,
  $$Facturen aanmaken, nummering, BTW, PDF-export, betaalstatus. Belgische standaard.$$,
  'gepland', 'factuur', 11,
  $$Bouw een complete factuurmodule:
- Facturen aanmaken met automatische nummering (2025-001)
- Klantgegevens, regelitems, BTW (0/6/12/21%), eindtotaal
- Betaalstatus: Onbetaald / Betaald / Vervallen
- PDF-export via window.print() met A4-opmaak
- Opslag in Supabase tabel 'facturen'
- Overzichtspagina met filter op status en datum$$
),
(
  $$Klantenbestand$$, $$Klanten$$,
  $$CRM light: fiches, historiek, zoeken, filteren, exporteren naar CSV.$$,
  'gepland', 'klanten', 9,
  $$Bouw een klantenbeheersmodule:
- Klantenfiche: naam, adres, BTW, e-mail, telefoon, notities
- Categorie: Particulier / Bedrijf / VIP / Prospect
- Overzicht met zoekbalk en filter op categorie
- Klantenhistoriek: notities met datum
- Archiveer/verwijder klant
- Export klantenlijst als CSV$$
),
(
  $$Reservatiekalender$$, $$Planning$$,
  $$Dag/week/maand kalender, boekingen beheren, statussen, beschikbaarheid instellen.$$,
  'gepland', 'reservaties', 12,
  $$Bouw een reservatiemodule met kalender:
- Maand- en weekweergave met gekleurde blokken per status
- Status: Bevestigd (groen) / Optie (oranje) / Geannuleerd (rood)
- Boekingsformulier: klant, datum, tijdslot, type, prijs
- Bevestigingsmail via mailto
- Lijst met filter op datum/status/klant
- Capaciteitslimiet per dag instellen$$
),
(
  $$Offertemodule$$, $$Financieel$$,
  $$Offertes opmaken, PDF exporteren, omzetten naar factuur, statusopvolging.$$,
  'gepland', 'offerte', 7,
  $$Bouw een offertemodule:
- Offertenummer automatisch (OFF-2025-001)
- Klantgegevens, itemlijst, BTW, eindtotaal
- Status: Concept / Verzonden / Geaccepteerd / Verlopen
- PDF-export via window.print()
- Knop "Zet om naar factuur"
- Overzicht met filter op status$$
),
(
  $$Dashboard & statistieken$$, $$Rapportage$$,
  $$Samenvattende cijfers, grafieken via Chart.js, snelkoppelingen naar modules.$$,
  'gepland', 'dashboard', 6,
  $$Bouw een dashboard-startpagina:
- Statistische kaarten: omzet, openstaande facturen, klanten, boekingen
- Grafiek maandomzet (Chart.js, lijndiagram)
- Grafiek statussen (donut)
- Recente activiteit (laatste 5 facturen/boekingen)
- Snelkoppelingen naar alle modules$$
),
(
  $$Prijscalculator$$, $$Financieel$$,
  $$Kosten berekenen per event of dienst, waste factor, break-even grafiek, offerte genereren.$$,
  'gepland', 'calculator', 6,
  $$Bouw een prijscalculator:
- Invoer: aantal personen, duur, materiaalkosten
- Waste factor instellen (bijv. 10%)
- Break-even berekening en grafiek
- Knop "Genereer offerte op basis van berekening"
- Opslaan als sjabloon voor hergebruik$$
),
(
  $$Gebruikershandleiding$$, $$Documentatie$$,
  $$Automatisch gegenereerde handleiding op basis van aanwezige modules, exporteerbaar als PDF.$$,
  'gepland', 'handleiding_gebruiker', 3,
  $$Bouw een gebruikershandleiding:
- Inleiding: waarvoor dient de app
- Per module: stap-voor-stap uitleg in eenvoudig Nederlands
- Genummerde stappen, geen jargon
- FAQ sectie onderaan
- Knop "Afdrukken als PDF" via window.print()$$
),
(
  $$Technische documentatie$$, $$Documentatie$$,
  $$Installatie, deployment, ENV-variabelen, updateprocedure in Markdown formaat.$$,
  'gepland', 'handleiding_tech', 3,
  $$Bouw een technische documentatiepagina:
- Installatie en lokale setup (npm install, .env)
- Environment variables overzicht
- Deployment workflow: GitHub → Netlify/Railway
- Databasestructuur en migraties
- Updateprocedure
- Veelvoorkomende fouten en oplossingen
- Formaat: Markdown, gerenderd in de app$$
),
(
  $$Reclamebanner$$, $$UX$$,
  $$Aanpasbare banner met tekst, kleur, animatie. Aan/uit schakelaar voor beheerder.$$,
  'gepland', 'banner', 3,
  $$Bouw een reclamebanner module:
- Aanpasbare tekst, achtergrondkleur en tekstkleur
- Optionele animatie: sliding tekst (marquee-stijl)
- Aan/uit schakelaar voor beheerder via instellingen
- Hoogte instelbaar (40–100px)
- Positie: bovenaan de pagina
- Opslag banner-instellingen in Supabase$$
),
(
  $$Bevestigingsmail$$, $$Communicatie$$,
  $$Automatische mail via mailto of Resend API bij boeking, registratie of aankoop.$$,
  'gepland', 'mail', 2,
  $$Bouw een bevestigingsmailsysteem:
- Trigger: na boeking, registratie of aankoop
- Optie 1: mailto-link met voorgevulde onderwerp en body
- Optie 2: Resend API met HTML e-mailtemplate
- Variabelen: klantnaam, datum, bedrag, referentienummer
- Configureerbaar: afzender, onderwerp, inhoud via instellingen$$
),
(
  $$Export module$$, $$Rapportage$$,
  $$Data exporteren naar CSV of Excel, maandrapport als PDF.$$,
  'gepland', 'export', 3,
  $$Bouw een exportmodule:
- Export klantenlijst naar CSV
- Export facturen/boekingen naar CSV of Excel
- Maandrapport: samenvatting omzet, klanten, boekingen
- PDF-export maandrapport via window.print()
- Datumselectie voor exportperiode$$
),
(
  $$Bug-meldingsformulier$$, $$Support$$,
  $$Ingebouwd formulier voor klanten om problemen te melden. Opslag in Supabase, notificatie naar developer.$$,
  'gepland', 'bugs', 3,
  $$Bouw een bug-meldingsformulier:
- Formulier: naam, e-mail, onderdeel, beschrijving, ernst (laag/medium/hoog)
- Opslag in Supabase tabel 'bug_meldingen'
- Overzicht voor developer: lijst, filter op ernst/status
- Status: Nieuw / In behandeling / Opgelost
- Notitieveld voor developer
- Optioneel: e-mailnotificatie naar developer via Resend$$
);
