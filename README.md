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


## v10 – map + late join
- The mock Galoppen map is visible again in the ride flow.
- Only already visited stops are shown; future destinations stay private.
- Riders can join an already started Galopp and are added at the end of the active rotation.
- Late joiners start with the current completed beer count, so they never block old rounds.


## v11 – riktig karta och riktig krogpool

- Leaflet + OpenStreetMap ersätter låtsaskartan.
- Delad karta visar endast redan besökta stopp.
- Kvällens ryttare får en privat karta med de två hemliga valen.
- Vald destination kan öppnas som vägbeskrivning i Google Maps.
- 40 statiska barer, pubar, vinbarer och restaurangbarer i Vasastan/Birkastan/Hagastaden ingår tills en dynamisk AI-/places-koppling byggs.
- Matläget prioriterar stopp markerade med `food: true`.
- Sen ankomst stöds: en deltagare kan joina en pågående Galopp, hamnar sist i turordningen och får direkt se var gruppen befinner sig.


## v12 – GPS, beer trail and in-map directions
- Each visited venue is marked with a beer icon on the shared map.
- The phone's live GPS position is shown as a blue dot using browser geolocation.
- The current rider gets a private walking route from their live GPS position to the selected hidden venue.
- Walking routing uses the public OpenStreetMap.de foot-routing service and falls back to a straight guide line if routing is unavailable.
- Google Maps remains available for turn-by-turn walking navigation.
- Future/hidden venues remain private to the current rider.


## v12.1 – beer markers
Visited stops now use a large beer icon as the primary map marker. The stop number remains as a small badge, and the current stop has a subtle pulse.


## v13 – three choices + expanded venue pool
- The current rider now receives three nearby hidden venue choices instead of two.
- The primary range remains roughly 10 minutes walking from the current stop.
- If fewer than three unvisited venues are available in range, the nearest candidates are used so the ride never dead-ends.
- Six additional Vasastan/Odenplan/S:t Eriksplan venues were added to the curated pool.


## v14 – retrieve a finished ride
- Home screen now includes "HÄMTA AVSLUTAD GALOPP".
- Enter the ride name to reopen a finished Firestore session.
- The archived view restores the final map, visited-stop history, rider beer totals and paid-round statistics.
- Archived rides are read-only and cannot accidentally resume gameplay.


## v15 – active rides + join codes
- Hosts now receive a unique 5-character join code when a ride is created.
- Riders join using the private code instead of the ride name.
- Home screen includes "PÅGÅENDE GALOPPER" showing lobby/playing rides without exposing their join codes.
- Ride names are display names and can be reused on future nights because Firestore session ids are now unique.
