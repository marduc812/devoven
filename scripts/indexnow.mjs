// Pushes every URL in the live sitemap to Bing and other IndexNow engines.
// Deploy first: the key file at https://www.devoven.com/79ff5974bf456839053fa8bc5009b106.txt must be live.
// Usage: node scripts/indexnow.mjs
const host = 'www.devoven.com';
const key = '79ff5974bf456839053fa8bc5009b106';

const xml = await (await fetch(`https://${host}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }),
});
console.log(`Submitted ${urlList.length} URLs: HTTP ${res.status}`);
