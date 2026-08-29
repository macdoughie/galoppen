// Demo pool. Replace with verified Stockholm venues before production.
// Names are intentionally generic so the route stays a surprise in the UI.
export const START = { id:'tennstopet', name:'Tennstopet', lat:59.3418, lng:18.0449 };
export const STOPS = [
{id:'s1',name:'Hemligt stopp A',lat:59.3431,lng:18.0419},{id:'s2',name:'Hemligt stopp B',lat:59.3398,lng:18.0490},{id:'s3',name:'Hemligt stopp C',lat:59.3460,lng:18.0462},{id:'s4',name:'Hemligt stopp D',lat:59.3376,lng:18.0436},{id:'s5',name:'Hemligt stopp E',lat:59.3441,lng:18.0530},{id:'s6',name:'Hemligt stopp F',lat:59.3490,lng:18.0505},{id:'s7',name:'Hemligt stopp G',lat:59.3403,lng:18.0368},{id:'s8',name:'Hemligt stopp H',lat:59.3351,lng:18.0492},{id:'s9',name:'Hemligt stopp I',lat:59.3471,lng:18.0385},{id:'s10',name:'Hemligt stopp J',lat:59.3510,lng:18.0430},{id:'s11',name:'Hemligt stopp K',lat:59.3420,lng:18.0570},{id:'s12',name:'Hemligt stopp L',lat:59.3333,lng:18.0551},{id:'s13',name:'Hemligt stopp M',lat:59.3532,lng:18.0522},{id:'s14',name:'Hemligt stopp N',lat:59.3361,lng:18.0355},{id:'s15',name:'Hemligt stopp O',lat:59.3492,lng:18.0580}
];
export function distanceM(a,b){const R=6371e3;const p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180;const dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lng-a.lng)*Math.PI/180;const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
export function walkMinutes(a,b){return Math.max(2,Math.round(distanceM(a,b)/75));}
export function nextChoices(current,visited){let pool=STOPS.filter(s=>!visited.includes(s.id)).map(s=>({...s,mins:walkMinutes(current,s)}));let near=pool.filter(s=>s.mins<=10);if(near.length<2) near=pool.sort((a,b)=>a.mins-b.mins).slice(0,6);return near.sort(()=>Math.random()-.5).slice(0,2);}
