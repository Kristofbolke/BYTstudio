// handleidingGenerators.js — Gedeelde handleiding content generators
import { MODULES_DATA } from '../components/studio/modulesData'

function formatDatumLang() {
  return new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function moduleNamenVanProject(featuresJson) {
  const keys = featuresJson?.modules ?? []
  return MODULES_DATA.filter(m => keys.includes(m.key)).map(m => m.naam)
}

export function genereerGebruiker(projectNaam, moduleNamen) {
  const moduleSections = moduleNamen.map(naam =>
    `## ${naam}\n\nHier volgt de uitleg voor **${naam}**.\n\n1. Navigeer naar het onderdeel "${naam}" in het menu\n2. [Vul hier de stap-voor-stap uitleg in]\n3. Klik op Opslaan om uw wijzigingen te bewaren`
  ).join('\n\n---\n\n')

  return `# Gebruikershandleiding — ${projectNaam}

**Versie:** 1.0
**Datum:** ${formatDatumLang()}

---

## Inleiding

Deze handleiding legt uit hoe u **${projectNaam}** gebruikt. U vindt hier een stap-voor-stap overzicht van alle beschikbare functies.

Heeft u vragen die niet in deze handleiding beantwoord worden? Gebruik dan het meldingsformulier in de applicatie of neem contact op met uw beheerder.

---

## Inloggen en navigeren

1. Open de applicatie via uw browser
2. Voer uw **e-mailadres** en **wachtwoord** in
3. Klik op **Inloggen**

Na het inloggen ziet u het dashboard met een overzicht van alle beschikbare functies. Gebruik het navigatiemenu links om naar een specifiek onderdeel te gaan.

> **Wachtwoord vergeten?** Klik op "Wachtwoord vergeten" op de inlogpagina. U ontvangt een resetlink via e-mail.

---

${moduleSections || '## [Modules worden hier gegenereerd]\n\nSelecteer modules via de Studio om automatisch secties te genereren.'}

---

## Veelgestelde vragen

**Hoe reset ik mijn wachtwoord?**
Klik op "Wachtwoord vergeten" op de inlogpagina en volg de instructies in de e-mail die u ontvangt.

**Kan ik meerdere gebruikers aanmaken?**
Neem contact op met uw beheerder voor het aanmaken van extra gebruikersaccounts.

**Hoe exporteer ik gegevens?**
Gebruik de exportfunctie die beschikbaar is in het betreffende onderdeel van de applicatie.

**Wat doe ik als de pagina niet laadt?**
Ververs de pagina met F5. Werkt dit niet? Probeer een andere browser of neem contact op met uw beheerder.

**Hoe meld ik een fout of probleem?**
Gebruik het meldingsformulier in de applicatie of stuur een e-mail naar uw contactpersoon bij Build Your Tools.

---

## Problemen melden

Als u een probleem ondervindt in de applicatie, kunt u dit melden via het ingebouwde formulier:

1. Klik op **"Probleem melden"** in de navigatie
2. Beschrijf zo nauwkeurig mogelijk wat er fout ging
3. Geef aan in welk onderdeel het probleem zich voordeed
4. Klik op **Verzenden**

Uw melding wordt zo snel mogelijk behandeld.
`
}

export function genereerTechnisch(projectNaam, moduleNamen) {
  const moduleLijst = moduleNamen.length > 0
    ? moduleNamen.map(n => `- ${n}`).join('\n')
    : '- [Nog geen modules geconfigureerd via Studio]'

  const slug = projectNaam.toLowerCase().replace(/\s+/g, '-')

  return `# Technische handleiding — ${projectNaam}

**Versie:** 1.0
**Datum:** ${formatDatumLang()}
**Auteur:** Build Your Tools

---

## Projectoverzicht

**Tech stack:**
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Hosting: Netlify (frontend)
- Versiecontrole: GitHub

**Actieve modules:**
${moduleLijst}

---

## Installatie

Clone de repository en installeer de dependencies:

\`\`\`bash
git clone [repository-url]
cd ${slug}
npm install
\`\`\`

Maak een \`.env\` bestand aan op basis van \`.env.example\`:

\`\`\`
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
\`\`\`

Start de development server:

\`\`\`bash
npm run dev
\`\`\`

---

## Environment variables

| Variabele | Beschrijving | Verplicht |
|---|---|---|
| \`VITE_SUPABASE_URL\` | Supabase project URL | Ja |
| \`VITE_SUPABASE_ANON_KEY\` | Supabase anonieme sleutel | Ja |

---

## Deployment

De applicatie wordt automatisch gedeployed via Netlify bij elke push naar de \`main\` branch.

1. Commit en push wijzigingen naar GitHub
2. Netlify detecteert de push en start automatisch een build
3. Build commando: \`npm run build\`
4. Publish directory: \`dist\`

---

## Database

De database draait op Supabase (PostgreSQL). Migraties staan in \`supabase/migrations/\`.

**Migraties uitvoeren:**
1. Open Supabase Dashboard → SQL Editor
2. Plak de inhoud van het migratiebestand
3. Klik op Run

**Row Level Security (RLS):**
Alle tabellen hebben RLS ingeschakeld. Ingelogde gebruikers hebben volledige toegang via de policy \`auth_volledig\`.

---

## Updates uitvoeren

1. Pull de laatste wijzigingen: \`git pull origin main\`
2. Installeer nieuwe packages indien nodig: \`npm install\`
3. Controleer of er nieuwe migraties zijn in \`supabase/migrations/\`
4. Voer nieuwe migraties uit in Supabase SQL Editor
5. Test lokaal: \`npm run dev\`
6. Push naar main voor automatische deployment op Netlify

---

## Veelvoorkomende fouten

**Build fout: "Missing environment variable"**
Controleer of alle variabelen in \`.env\` correct zijn ingesteld. Op Netlify: controleer de Environment Variables in het project dashboard.

**"Failed to fetch" bij Supabase-aanvragen**
Controleer \`VITE_SUPABASE_URL\` en \`VITE_SUPABASE_ANON_KEY\`. Zorg dat de Supabase RLS-policies correct zijn geconfigureerd.

**Witte pagina na deployment**
Controleer de Netlify build logs. Controleer of de \`base\` in \`vite.config.js\` correct is ingesteld.

**Gebruiker kan niet inloggen**
Controleer in Supabase Dashboard → Authentication → Users of het account actief is. Verifieer de redirect URL's in Auth Settings.
`
}
