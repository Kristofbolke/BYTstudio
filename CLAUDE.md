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
    └── print.css        # Print-stijlen voor offertes en handleidingen
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
| `/handleidingen` | Handleidingen (overzicht) |
| `/handleidingen/nieuw` | HandleidingNieuw |
| `/handleidingen/:id` | HandleidingDetail |
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

Bevat print-stijlen voor twee documenten:
- **Offertes**: klasse `.offerte-print` — geïmporteerd in `OfferteDetail.jsx`
- **Handleidingen**: klasse `.handleiding-print-content` — geïmporteerd in `HandleidingDetail.jsx`

Accentkleur via CSS-variabele `--hs-primair` (gezet als inline style op het print-element).

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
