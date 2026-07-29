# IVAREM-netwerkonderzoek

Onderzocht op 27 juli 2026 via de publieke kalender
`https://diftar.ivarem.be/Ophaalkalender/input`.

## Gevonden datastroom

De pagina gebruikt gestructureerde JSON; HTML-scraping is niet nodig.

1. `GET /API/ophaalkalender/getGemeenten?q={postcode}` geeft onder meer `id`,
   `postcode` en `gemeente`.
2. `GET /API/ophaalkalender/GetStreetsByZipCodeId?query={straat}&zipcodeId={id}`
   geeft `id` en `straat`.
3. De oorspronkelijke pagina post de gekozen IDs en het huisnummer naar
   `/Ophaalkalender/input`.
4. De kalenderbundle gebruikt daarna `POST /api/ophaalkalender/GetOphaaldata`
   met `zipcodeId`, `streetId`, `housNr`, `straat`, `gemeente`, `fromDate` en
   `untilDate`.
5. Het JSON-antwoord bevat `ophaaldatum`, `fractie`, `fractieCode` en
   `kleurcode`.

`POST /api/ophaalkalender/GetFractieDetails` bestaat eveneens, maar is niet
nodig voor het zevendaagse overzicht.

## Implementatiekeuze

De browser praat alleen met de eigen route `/api/collections`. Die vraagt de
publieke IVAREM-endpoints server-side op en normaliseert het antwoord. Zo is de
koppeling niet afhankelijk van browser-CORS.

Er is geen publiek versiecontract gevonden. Daarom zit de integratie achter
`WasteCollectionProvider`, wordt het antwoord gecontroleerd en blijft mockdata
beschikbaar. De app gebruikt geen login of afgeschermde gegevens.
