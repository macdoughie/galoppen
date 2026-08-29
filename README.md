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


## v5 – individual beer finish
Only the rider/host leading the current leg checks the group in. After check-in, every participant gets an **ÖLEN ÄR SLUT** button on their own phone. The next rider receives the two private destination choices only after marking their own beer as finished.


## v6 – finish and save
The host can end the ride from the active game. Ending the ride stores `status: finished`, `finishedAt`, `savedAt` and a summary in the existing Firestore session. The complete `visited` history remains in the session document and is therefore preserved for later recap/history views.


## v7 – all riders finish before moving on
Every rider must press **ÖLEN ÄR SLUT** for the current stop. The next leg is released only when all active riders have finished. The game also shows the riders in join/order sequence with each rider's consumed beer count and current completion state.


## v9 – clearer pre-rider flow
UX copy has been simplified around the core loop: follow the rider, the rider orders/pays, everyone finishes their beer, then the next rider gets the secret choice. "Check in" wording has been replaced by "RUNDAN ÄR BESTÄLLD".
