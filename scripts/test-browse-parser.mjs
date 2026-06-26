const res = await fetch('https://smart-slab-app.vercel.app/browse');
const html = await res.text();
const normalized = html.replace(/\\"/g, '"');
const re =
  /"id":"([a-f0-9-]{36})","vendorId":"[^"]*","locationId":[^,]*,"materialId":"[^"]*","type":"(full_slab|remnant)"[\s\S]*?"name":"([^"]+)"[\s\S]*?"widthCm":"([^"]+)"[\s\S]*?"heightCm":"([^"]+)"[\s\S]*?"city":"([^"]*?)"[\s\S]*?"state":"([^"]*?)"[\s\S]*?"price":"([^"]+)"[\s\S]*?"material":\{"id":"[^"]*","name":"([^"]+)"/g;

let n = 0;
let full = 0;
for (const m of normalized.matchAll(re)) {
  n++;
  if (m[2] === 'full_slab') full++;
  if (n <= 3) console.log(m[3], m[9], m[8], m[2]);
}
console.log('total', n, 'full_slab', full);
