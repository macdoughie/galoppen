# Galoppen v3

Mobil PWA-prototyp för en gemensam pubrunda där varje deltagare kör appen på sin egen telefon.

## Nytt i v3
- En person skapar en Galopp och får en 5-teckens kod.
- Övriga ansluter från sina egna telefoner med kod + smeknamn.
- Skaparen väljer kvällens host. Hosten betalar första rundan på Tennstopet.
- Därefter roterar ryttarrollen automatiskt.
- Bara aktuell ryttare får läsa sina två hemliga destinationsval.
- Ryttaren väljer nästa stopp, leder gruppen, väljer ölsort och betalar rundan.
- Ingen fritext för ölval.
- Efter fem stopp kommer matfrågan; vid Nej återkommer den två stopp senare.
- Historik och betalningsstatistik synkas för alla telefoner.

## Firebase
1. Skapa ett Firebase-projekt.
2. Aktivera Authentication -> Anonymous.
3. Skapa Firestore Database.
4. Lägg in värden från Firebase Web App i `.env.local` enligt `.env.example`.
5. Publicera reglerna i `firestore.rules`.

## Kör lokalt
```bash
npm install
npm run dev
```

## Viktigt inför produktion
`lib/stops.js` innehåller fortfarande demo-stopp. Byt dessa mot verifierade riktiga barer/restaurangbarer innan skarp körning. Nästa steg är riktig Leaflet-karta och ruttdata.
