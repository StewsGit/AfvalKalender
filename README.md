# Afval Kalender

Nederlandstalige mobile-first webapp die IVAREM-ophalingen voor morgen en de
komende zeven dagen toont.

## Lokaal starten

Node.js 22.13 of nieuwer is vereist.

```bash
npm ci
npm run dev
```

Open daarna de lokale URL die Vite toont.

## Testen en bouwen

```bash
npm test
npm run lint
npm run build
```

De interface kan zonder IVAREM worden bekeken via **Bekijk eerst een
voorbeeld**.

## Structuur

- `app/`: interface en server-side API-route
- `services/address-settings.ts`: vervangbare adresopslag
- `services/ivarem-provider.ts`: `WasteCollectionProvider` voor IVAREM
- `services/collection-cache.ts`: browsercache van zes uur
- `lib/dates.ts`: tijdzone- en datumlogica
- `lib/waste-normalization.ts`: categorieën en onbekende fracties
- `tests/unit/`: tests voor datumlogica en normalisatie
- `docs/ivarem-network-research.md`: gedocumenteerde netwerkrequests

Adresgegevens en cache blijven lokaal in de browser. De API-route stuurt het
ingevoerde adres alleen naar de publieke IVAREM-kalender om de ophalingen op te
vragen.
