const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = __dirname;
const imgDir = path.join(dir, 'images');
fs.mkdirSync(imgDir, { recursive: true });

const re = /https:\/\/www\.omiworld\.org\/wp-content\/uploads\/[^"')\s]+\.(?:jpe?g|png|gif|webp|svg)/gi;
const urls = new Set();
const files = fs.readdirSync(dir).filter(f => /\.(html|css)$/i.test(f));

files.forEach(f => {
  (fs.readFileSync(path.join(dir, f), 'utf8').match(re) || []).forEach(u => urls.add(u));
});

function download(url) {
  return new Promise(resolve => {
    const name = decodeURIComponent(url.split('/').pop());
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.omiworld.org/' } }, res => {
      if (res.statusCode !== 200) { console.log('FAILED', res.statusCode, url); res.resume(); return resolve(); }
      res.pipe(fs.createWriteStream(path.join(imgDir, name))).on('finish', () => { console.log('ok', name); resolve(); });
    }).on('error', () => { console.log('ERROR', url); resolve(); });
  });
}

(async () => {
  for (const u of urls) await download(u);
  files.forEach(f => {
    const p = path.join(dir, f);
    let t = fs.readFileSync(p, 'utf8');
    t = t.replace(re, u => 'images/' + decodeURIComponent(u.split('/').pop()));
    fs.writeFileSync(p, t);
  });
  console.log('Done. Check the images folder.');
})();