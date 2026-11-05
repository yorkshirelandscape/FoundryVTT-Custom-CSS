// usage: node run-in-world.cjs <foundry-url> <cookie-jar> <page-script.js> [screenshot.png]
// Opens /game with a session from the jar and runs the script body (async) in the page; prints JSON.
const { chromium } = require('playwright');
const fs = require('fs');
const [url, jar, script, shot] = process.argv.slice(2);
const cookies = fs.readFileSync(jar, 'utf8').split('\n')
  .map(l => l.replace(/^#HttpOnly_/, '')).filter(l => l && !l.startsWith('#'))
  .map(l => l.split('\t')).filter(f => f.length >= 7)
  .map(([domain, , path, secure, , name, value]) => ({ name, value, domain: domain.replace(/^\./, ''), path, secure: secure === 'TRUE' }));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  await ctx.addCookies(cookies);
  const p = await ctx.newPage();
  const logs = [];
  // MODULE_DIRS="id=dir,id=dir" (or SIGHTLINES_DIR): serve modules from local checkouts instead of the server's install
  const dirs = Object.fromEntries((process.env.MODULE_DIRS ?? '').split(',').filter(Boolean).map(s => s.split('=')));
  if (process.env.SIGHTLINES_DIR) dirs.sightlines = process.env.SIGHTLINES_DIR;
  for (const [id, dir] of Object.entries(dirs)) await p.route(new RegExp(`/modules/${id}/`), route => {
    const rel = new URL(route.request().url()).pathname.replace(new RegExp(`^.*/modules/${id}/`), '');
    const file = require('path').join(dir, rel);
    if (!fs.existsSync(file)) return route.continue();
    const type = { js: 'application/javascript', mjs: 'application/javascript', css: 'text/css', json: 'application/json', hbs: 'text/plain', woff2: 'font/woff2' }[rel.split('.').pop()] ?? 'application/octet-stream';
    return route.fulfill({ status: 200, contentType: type, body: fs.readFileSync(file) });
  });
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  p.on('console', m => { const t = m.text(); if (t.startsWith('CC|')) console.log(new Date().toTimeString().slice(0, 8), t.slice(3)); else if (/custom-css|libWrapper/i.test(t)) logs.push(m.type() + ': ' + t.slice(0, 300)); });
  await p.goto(url + '/game', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.game?.ready, null, { timeout: 300000 });
  const out = await p.evaluate(`(async () => { ${fs.readFileSync(script, 'utf8')} })()`);
  console.log(JSON.stringify({ out, logs }, null, 1));
  if (shot) await p.screenshot({ path: shot });
  await b.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
