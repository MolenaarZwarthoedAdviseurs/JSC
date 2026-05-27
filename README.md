# JSC Toptraining PWA

Mobiele testformulier- en schemagenerator voor JSC Toptraining.

## Wat is aangepast

- De dubbele broncode uit `index.html` en `jsc-testformulier.jsx` is vervangen door een normale React/Vite-structuur.
- De oefenlijst staat apart in `src/data/exercises.js`.
- De 1RM-tabel, methodekeuzes en set-aantallen staan apart in `src/data/`.
- De rekenregels staan in `src/logic/calculations.js` en worden gevalideerd met `npm test`.
- De app bewaart concepten lokaal op het toestel en kan JSON importeren/exporteren.
- De app heeft PWA-bestanden: manifest, SVG-iconen en service worker.
- Twijfelpunten en dubbele oefeningnamen uit de brondocumenten zijn zichtbaar onder `Controle` en in de oefeningkiezer.

## Ontwikkelen

```bash
npm install
npm run dev
```

## Controleren

```bash
npm test
npm run build
```

## Publiceren als PWA

Publiceer de inhoud via een HTTPS-host zoals GitHub Pages, Netlify of Vercel. Daarna kan de app op een mobiele telefoon worden geinstalleerd via de browser.

In deze repository staat ook een GitHub Pages-workflow. Elke push naar `main` voert de datacontrole uit, bouwt de app en publiceert de inhoud van `dist`.

## Bronnen

- `Lijst Personal Workout fitness oefeningen nummers.doc`
- `Schema Martijn Kerssens .xlsx`
