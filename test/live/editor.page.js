const tick = (ms = 300) => new Promise(r => setTimeout(r, ms));
const Cls = game.settings.menus.get('custom-css.settingsMenu').type;
for (const a of foundry.applications.instances.values()) if (a instanceof Cls) await a.close();
const app = new Cls(); await app.render({ force: true }); await tick(1500);
const el = app.element, q = s => el.querySelector(s)?.getBoundingClientRect();
const box = r => r && [r.x, r.y, r.width, r.height].map(Math.round);
const out = { win: box(el.getBoundingClientRect()), world: box(q('#ccss-world-stylesheet')), sep: box(q('#ccss-separator')),
  user: box(q('#ccss-user-stylesheet')), footer: box(q('.form-footer')), vh: innerHeight };
if (window.CC_DRAG) {
  const s = q('#ccss-separator'), x = s.x + s.width / 2, y = s.y + s.height / 2;
  const fire = (t, yy) => el.querySelector('#ccss-separator').dispatchEvent(new MouseEvent(t, { bubbles: true, clientX: x, clientY: yy }));
  fire('mousedown', y);
  for (let i = 1; i <= 10; i++) document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y - 20 * i }));
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  await tick(500);
  Object.assign(out, { afterWorld: box(q('#ccss-world-stylesheet')), afterSep: box(q('#ccss-separator')), afterUser: box(q('#ccss-user-stylesheet')), afterFooter: box(q('.form-footer')) });
}
return out;
