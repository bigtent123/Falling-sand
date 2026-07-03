/* Browser smoke test: loads the game in headless Chrome, verifies the UI,
 * runs the simulation, draws some elements, uses the AI lab, and captures
 * screenshots. Requires a static server on :8123 and Chrome installed.
 * Not part of `npm test` (needs a browser); run: node test/browser-smoke.mjs */

import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const OUT = process.env.SHOT_DIR || '/tmp/sand-shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1100,1300']
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 1300 });

const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto('http://localhost:8123/', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 3000)); // let the streams pour

const state1 = await page.evaluate(() => ({
  buttons: document.querySelectorAll('#classic-buttons button').length,
  libButtons: document.querySelectorAll('#lib-list button').length,
  counters: document.getElementById('counters').innerText,
  elCount: document.getElementById('element-count').textContent
}));
console.log('classic buttons:', state1.buttons, '| library buttons:', state1.libButtons, '|', state1.elCount);
console.log('counters:\n' + state1.counters);

// draw a wall shelf and pour lava on it via the engine-facing UI (mouse events)
async function drag(x0, y0, x1, y1, steps = 20) {
  const c = await page.$('#game');
  const box = await c.boundingBox();
  await page.mouse.move(box.x + x0, box.y + y0);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(box.x + x0 + (x1 - x0) * i / steps, box.y + y0 + (y1 - y0) * i / steps);
    await new Promise(r => setTimeout(r, 15));
  }
  await page.mouse.up();
}

async function pick(name) {
  await page.evaluate((n) => {
    const btns = [...document.querySelectorAll('#classic-buttons button, #lib-list button')];
    const b = btns.find(b => b.textContent.trim().toUpperCase().includes(n));
    if (!b) throw new Error('no button ' + n);
    b.click();
  }, name.toUpperCase());
}

// keep all strokes clear of the panel overlay in the bottom-right corner
await pick('WALL');
await drag(120, 420, 360, 420);
await pick('LAVA');
await drag(160, 300, 300, 300);
await pick('PLANT');
await drag(420, 250, 470, 250);
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: `${OUT}/gameplay.png` });

// AI lab: generate a cat and spawn it
await page.type('#ai-prompt', 'cat');
await page.click('#ai-generate');
await new Promise(r => setTimeout(r, 500));
const aiStatus = await page.evaluate(() => document.getElementById('ai-status').innerText);
console.log('AI status:', aiStatus);

const c = await page.$('#game');
const box = await c.boundingBox();
// spawn the cat on open canvas (left side, clear of the lava pour and the panel overlay)
await page.mouse.click(box.x + 120, box.y + 450);
await new Promise(r => setTimeout(r, 1200));

const world = await page.evaluate(() => window.__debug());
console.log('entities alive:', world.entities, '| total particles:', world.total, '| fps~', world.fps);

// generate a weirder one
await page.evaluate(() => { document.getElementById('ai-prompt').value = ''; });
await page.type('#ai-prompt', 'explosive rainbow dust');
await page.click('#ai-generate');
await new Promise(r => setTimeout(r, 400));
await drag(700, 200, 750, 200, 8);
await new Promise(r => setTimeout(r, 800));

await page.screenshot({ path: `${OUT}/full-page.png`, fullPage: true });
await page.screenshot({ path: `${OUT}/with-cat.png` });

if (errors.length) {
  console.log('ERRORS:\n' + errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('no page errors');
}
await browser.close();
