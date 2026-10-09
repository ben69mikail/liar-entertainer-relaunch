// IndexNow (Bing, Yandex, Seznam, Naver – Bing feeds ChatGPT search and Copilot).
//   node ops/indexnow.mjs                 → submits every URL of the live sitemap
//   node ops/indexnow.mjs /pfad/ /pfad2/  → submits only these paths
// The key file is site/public/3da0cf6edca8f56ea0dc1dea223dcdbe.txt (served at https://liar-entertainer.com/3da0cf6edca8f56ea0dc1dea223dcdbe.txt).
const KEY = '3da0cf6edca8f56ea0dc1dea223dcdbe';
const HOST = 'liar-entertainer.com';
const args = process.argv.slice(2);
let urls;
if (args.length) urls = args.map((p) => `https://${HOST}${p.startsWith('/') ? p : '/' + p}`);
else {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${urls.length} URLs → HTTP ${res.status}`);
if (![200, 202].includes(res.status)) { console.log(await res.text()); process.exit(1); }
