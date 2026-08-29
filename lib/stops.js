// Real venue pool for Galoppen around Tennstopet / Vasastan.
// Venue names and addresses are curated; coordinates are intended for in-app routing/map display.
// Before a production event, review the pool for closures, opening hours and group suitability.

export const START = {
  id: 'tennstopet',
  name: 'Tennstopet',
  address: 'Dalagatan 50',
  area: 'Odenplan',
  type: 'Klassisk pub',
  food: true,
  lat: 59.34188,
  lng: 18.04563,
};

export const STOPS = [
  { id:'molly-malones', name:"Molly Malone's Odenplan", address:'Odengatan 83', area:'Odenplan', type:'Irländsk pub', food:true, lat:59.34196, lng:18.04789 },
  { id:'bryggeriet', name:'Bryggeriet Sportbar', address:'Odengatan 60', area:'Odenplan', type:'Sportbar', food:true, lat:59.34270, lng:18.05255 },
  { id:'combo', name:'Combo Vinbaren', address:'Odengatan 52', area:'Odenplan', type:'Vinbar', food:true, lat:59.34302, lng:18.05535 },
  { id:'flying-horse', name:'The Flying Horse', address:'Odengatan 44', area:'Vasastan', type:'Pub', food:true, lat:59.34335, lng:18.05820 },
  { id:'old-brewer', name:'The Old Brewer Vasastan', address:'Luntmakargatan 98', area:'Vasastan', type:'Gastropub', food:true, lat:59.34372, lng:18.06155 },
  { id:'bishops-odengatan', name:'The Bishops Arms Odengatan', address:'Odengatan 41', area:'Vasastan', type:'Gastropub', food:true, lat:59.34357, lng:18.05965 },
  { id:'bar-nombre', name:'Bar Nombre', address:'Odengatan 36', area:'Vasastan', type:'Bar', food:true, lat:59.34386, lng:18.06255 },
  { id:'balzac', name:'Brasserie Balzac', address:'Odengatan 26', area:'Vasastan', type:'Brasseriebar', food:true, lat:59.34428, lng:18.06610 },
  { id:'the-doors', name:'The Doors', address:'Odengatan 35', area:'Vasastan', type:'Pub', food:true, lat:59.34378, lng:18.06155 },
  { id:'l-avventura', name:"L'Avventura", address:'Sveavägen 77', area:'Odenplan', type:'Cocktailbar', food:true, lat:59.34220, lng:18.05965 },
  { id:'kappa', name:'Kappa Bar Sveavägen', address:'Sveavägen 105', area:'Vasastan', type:'Bar / gaming', food:true, lat:59.34482, lng:18.05800 },
  { id:'retro', name:'Retro Bar Vasastan', address:'Sveavägen 120', area:'Vasastan', type:'Bar', food:true, lat:59.34630, lng:18.05710 },
  { id:'pub-anchor', name:'Pub Anchor', address:'Sveavägen 90', area:'Vasastan', type:'Pub', food:true, lat:59.34350, lng:18.06035 },
  { id:'man-in-the-moon', name:'Man in the Moon', address:'Tegnérgatan 2C', area:'Vasastan', type:'Ölbar', food:true, lat:59.33990, lng:18.06415 },
  { id:'churchill', name:'Churchill Arms Stockholm', address:'Tulegatan 21', area:'Vasastan', type:'Brittisk pub', food:true, lat:59.34272, lng:18.06505 },
  { id:'svartengrens', name:'Svartengrens', address:'Tulegatan 24', area:'Vasastan', type:'Cocktailbar', food:true, lat:59.34320, lng:18.06470 },
  { id:'capannone', name:'Capannone Bottega', address:'Roslagsgatan 4', area:'Vasastan', type:'Vinbar', food:true, lat:59.33995, lng:18.06800 },
  { id:'tranan', name:'Tranans Bar', address:'Karlbergsvägen 14', area:'Odenplan', type:'Bar', food:true, lat:59.34320, lng:18.05000 },
  { id:'grus-grus', name:'Grus Grus', address:'Karlbergsvägen 14', area:'Odenplan', type:'Vinbar', food:true, lat:59.34325, lng:18.04992 },
  { id:'roq', name:'RoQ', address:'Gyldéngatan 2', area:'Odenplan', type:'Biljard & bar', food:false, lat:59.34330, lng:18.04735 },
  { id:'bar-etton', name:'Bar Etton', address:'Upplandsgatan 64', area:'Odenplan', type:'Bar', food:false, lat:59.34168, lng:18.05055 },
  { id:'skvallerhornan', name:'Skvallerhörnan', address:'Upplandsgatan 64', area:'Odenplan', type:'Pub', food:true, lat:59.34170, lng:18.05062 },
  { id:'erlands', name:'Erlands', address:'Gästrikegatan 1', area:'S:t Eriksplan', type:'Cocktailbar', food:true, lat:59.34020, lng:18.04100 },
  { id:'apropos', name:'Apropos', address:'Sankt Eriksplan 5', area:'S:t Eriksplan', type:'Cocktailbar', food:false, lat:59.33906, lng:18.03851 },
  { id:'portal', name:'Portal Bar', address:'Sankt Eriksplan 1', area:'S:t Eriksplan', type:'Bar', food:true, lat:59.33923, lng:18.03955 },
  { id:'bron', name:'BRON Restaurang & Bar', address:'Sankt Eriksgatan 64', area:'S:t Eriksplan', type:'Pub / bar', food:true, lat:59.33720, lng:18.03760 },
  { id:'peppar', name:'Peppar', address:'Torsgatan 34', area:'S:t Eriksplan', type:'Bar', food:true, lat:59.33875, lng:18.04075 },
  { id:'oljebaren', name:'Oljebaren', address:'Torsgatan 48B', area:'Vasastan', type:'Restaurangbar', food:true, lat:59.34075, lng:18.03625 },
  { id:'stringfellows', name:'Pub Stringfellows', address:'Torsgatan 48', area:'Vasastan', type:'Pub', food:true, lat:59.34070, lng:18.03632 },
  { id:'sthlm-tapas', name:'STHLM Tapas', address:'Torsgatan 55', area:'Vasastan', type:'Bar / tapas', food:true, lat:59.34165, lng:18.03540 },
  { id:'mellqvist-matbar', name:'Mellqvist Matbar', address:'Rörstrandsgatan 6', area:'Birkastan', type:'Matbar', food:true, lat:59.33835, lng:18.03535 },
  { id:'nektar', name:'Nektar Mat & Vin', address:'Rörstrandsgatan 12', area:'Birkastan', type:'Vinbar', food:true, lat:59.33825, lng:18.03290 },
  { id:'international-birkastan', name:'International Bar Birkastan', address:'Rörstrandsgatan 11', area:'Birkastan', type:'Pub', food:true, lat:59.33845, lng:18.03325 },
  { id:'tiki-room', name:'Tiki Room', address:'Birkagatan 10', area:'Birkastan', type:'Cocktailbar', food:false, lat:59.33872, lng:18.03405 },
  { id:'bagpipers', name:"Bagpiper's Inn", address:'Rörstrandsgatan 21', area:'Birkastan', type:'Pub', food:true, lat:59.33803, lng:18.02965 },
  { id:'ambar', name:'Ambar', address:'Tomtebogatan 22', area:'Birkastan', type:'Vinbar', food:true, lat:59.33915, lng:18.03010 },
  { id:'arc-rooftop', name:'Arc Rooftop', address:'Gävlegatan 18', area:'Hagastaden', type:'Rooftop bar', food:true, lat:59.34810, lng:18.03315 },
  { id:'avec', name:'Avec Vinbar', address:'Sankt Eriksgatan 100', area:'Vasastan', type:'Vinbar', food:false, lat:59.34430, lng:18.04010 },
  { id:'20hundra5', name:'20hundra5', address:'Sankt Eriksgatan 102', area:'Vasastan', type:'Cocktailbar', food:false, lat:59.34465, lng:18.03985 },
  { id:'muscadet', name:'Muscadet', address:'Sankt Eriksgatan 108', area:'Vasastan', type:'Vinbar', food:true, lat:59.34540, lng:18.03945 },
];

export function distanceM(a, b) {
  const R = 6371e3;
  const p1 = a.lat * Math.PI / 180;
  const p2 = b.lat * Math.PI / 180;
  const dp = (b.lat - a.lat) * Math.PI / 180;
  const dl = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Walking estimate deliberately includes a street-network factor rather than straight-line only.
export function walkMinutes(a, b) {
  return Math.max(2, Math.round((distanceM(a, b) * 1.22) / 75));
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function nextChoices(current, visitedIds, { foodMode = false } = {}) {
  let pool = STOPS
    .filter((s) => !visitedIds.includes(s.id))
    .map((s) => ({ ...s, mins: walkMinutes(current, s) }));

  if (foodMode) {
    const withFood = pool.filter((s) => s.food);
    if (withFood.length >= 2) pool = withFood;
  }

  // Primary rule: normally keep both options within roughly ten minutes' walk.
  let near = pool.filter((s) => s.mins <= 10);

  // If the route has moved to the edge of the pool, use the nearest candidates instead of dead-ending.
  if (near.length < 2) {
    near = [...pool].sort((a, b) => a.mins - b.mins).slice(0, 8);
  }

  // Prefer some variety in venue type when possible.
  const shuffled = shuffle(near);
  const first = shuffled[0];
  const second = shuffled.find((s) => s.type !== first?.type) || shuffled[1];

  return [first, second].filter(Boolean);
}
