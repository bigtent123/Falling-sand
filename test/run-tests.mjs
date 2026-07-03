/* Headless test harness: verifies the classic physics, the element library,
 * the creature layer and the AI particle generator. Run: npm test */

import { Registry, CAT } from '../js/registry.js';
import { defineClassicElements } from '../js/classic.js';
import { defineLibraryElements } from '../js/library.js';
import { Engine } from '../js/engine.js';
import { Entities } from '../js/creatures.js';
import { offlineGenerate, validateSpec } from '../js/ai.js';

let passed = 0, failed = 0;
function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.log(`FAIL  ${name} ${extra}`); }
}

function freshWorld(w = 60, h = 60) {
  const reg = new Registry();
  defineClassicElements(reg);
  defineLibraryElements(reg);
  const engine = new Engine(reg, w, h);
  new Entities(engine);
  engine.cacheIds();
  return { reg, engine };
}

function countId(engine, id) {
  let n = 0;
  for (let i = 0; i < engine.cells.length; i++) if (engine.cells[i] === id) n++;
  return n;
}

function centerOfMassY(engine, id) {
  let sum = 0, n = 0;
  for (let i = 0; i < engine.cells.length; i++) {
    if (engine.cells[i] === id) { sum += (i / engine.w) | 0; n++; }
  }
  return n ? sum / n : -1;
}

// ================================================= registry & references

console.log('\n-- registry --');
{
  const { reg } = freshWorld();
  const total = reg.paletteList().length - 1; // minus Empty... Empty is hidden anyway
  console.log(`   total visible elements: ${reg.paletteList().length}`);
  check('at least 280 elements defined', reg.count() >= 280, `got ${reg.count()}`);
  check('classic elements present', ['sand', 'water', 'salt', 'oil', 'fire', 'plant', 'spout',
    'wall', 'torch', 'gunpowder', 'wax', 'nitro', 'napalm', 'concrete', 'ice', 'lava', 'stone', 'void']
    .every(n => reg.id(n) > 0));

  // audit: every referenced element name must exist
  const bad = [];
  const checkRef = (el, field, n) => {
    if (n === null || n === undefined || n === '') return;
    const s = String(n);
    if (s.startsWith('#')) return;
    if (!reg.has(s)) bad.push(`${el.name}.${field} -> "${s}"`);
  };
  for (const el of reg.elements) {
    checkRef(el, 'burnInto', el.burnInto);
    checkRef(el, 'hotInto', el.hotInto);
    checkRef(el, 'magmaInto', el.magmaInto);
    checkRef(el, 'coldInto', el.coldInto);
    checkRef(el, 'cryoInto', el.cryoInto);
    if (el.decay) checkRef(el, 'decay.into', el.decay.into);
    if (el.rest) checkRef(el, 'rest.into', el.rest.into);
    if (el.emit) checkRef(el, 'emit.what', el.emit.what);
    for (const d of el.dissolve) { checkRef(el, 'dissolve.in', d.in); checkRef(el, 'dissolve.into', d.into); if (d.otherInto) checkRef(el, 'dissolve.otherInto', d.otherInto); }
    for (const r of el.reactions) {
      checkRef(el, 'reactions.with', r.with);
      if (r.self) checkRef(el, 'reactions.self', r.self);
      if (r.other) checkRef(el, 'reactions.other', r.other);
      if (r.spawn) checkRef(el, 'reactions.spawn', r.spawn);
    }
    if (el.grow) for (const o of el.grow.on) checkRef(el, 'grow.on', o);
  }
  check('all element references resolve', bad.length === 0, bad.slice(0, 10).join('; '));
}

// ================================================= classic physics

console.log('\n-- classic physics --');
{
  const { reg, engine } = freshWorld();
  const sand = reg.id('sand');
  engine.set(30, 0, sand);
  for (let t = 0; t < 100; t++) engine.update();
  check('sand falls to the floor', engine.cells[engine.idx(30, 59)] === sand);
}
{
  const { reg, engine } = freshWorld();
  const water = reg.id('water'), sand = reg.id('sand');
  for (let y = 40; y < 60; y++) for (let x = 0; x < 60; x++) engine.set(x, y, water);
  for (let i = 0; i < 8; i++) engine.set(28 + i % 4, i / 4 | 0, sand);
  for (let t = 0; t < 400; t++) engine.update();
  const sy = centerOfMassY(engine, sand), wy = centerOfMassY(engine, water);
  check('sand sinks through water', sy > wy, `sand y=${sy.toFixed(1)} water y=${wy.toFixed(1)}`);
}
{
  const { reg, engine } = freshWorld();
  const water = reg.id('water'), oil = reg.id('oil');
  for (let y = 45; y < 60; y++) for (let x = 0; x < 60; x++) engine.set(x, y, water);
  for (let y = 30; y < 34; y++) for (let x = 25; x < 35; x++) engine.set(x, y, oil);
  for (let t = 0; t < 500; t++) engine.update();
  const oy = centerOfMassY(engine, oil), wy = centerOfMassY(engine, water);
  check('oil floats on water', oy < wy, `oil y=${oy.toFixed(1)} water y=${wy.toFixed(1)}`);
}
{
  const { reg, engine } = freshWorld();
  const salt = reg.id('salt'), water = reg.id('water'), sw = reg.id('salt water');
  for (let y = 40; y < 60; y++) for (let x = 0; x < 60; x++) engine.set(x, y, water);
  for (let x = 20; x < 40; x++) engine.set(x, 39, salt);
  for (let t = 0; t < 200; t++) engine.update();
  check('salt dissolves into salt water', countId(engine, sw) > 5, `salt water=${countId(engine, sw)}`);
}
{
  const { reg, engine } = freshWorld();
  const plant = reg.id('plant'), water = reg.id('water');
  for (let y = 40; y < 55; y++) for (let x = 20; x < 40; x++) engine.set(x, y, water);
  engine.set(30, 55, plant);
  for (let t = 0; t < 200; t++) engine.update();
  check('plant grows through water', countId(engine, plant) > 20, `plant=${countId(engine, plant)}`);
}
{
  const { reg, engine } = freshWorld();
  const oil = reg.id('oil'), fire = reg.id('fire'), wall = reg.id('wall');
  for (let x = 0; x < 60; x++) engine.set(x, 59, wall);
  for (let y = 55; y < 59; y++) for (let x = 10; x < 50; x++) engine.set(x, y, oil);
  for (let x = 25; x < 35; x++) engine.set(x, 54, fire);
  const before = countId(engine, oil);
  for (let t = 0; t < 600; t++) engine.update();
  const after = countId(engine, oil);
  check('fire burns oil away', after < before * 0.5, `before=${before} after=${after}`);
}
{
  const { reg, engine } = freshWorld();
  const gp = reg.id('gunpowder'), fire = reg.id('fire'), wall = reg.id('wall');
  for (let x = 0; x < 60; x++) engine.set(x, 59, wall);
  for (let y = 50; y < 59; y++) for (let x = 20; x < 40; x++) engine.set(x, y, gp);
  const before = countId(engine, gp);
  for (let x = 29; x <= 31; x++) engine.set(x, 49, fire);
  for (let t = 0; t < 120; t++) engine.update();
  const after = countId(engine, gp);
  check('gunpowder chain-detonates from a spark', after < before * 0.3, `before=${before} after=${after}`);
}
{
  const { reg, engine } = freshWorld();
  const lava = reg.id('lava'), water = reg.id('water'), stone = reg.id('stone');
  for (let y = 50; y < 60; y++) for (let x = 0; x < 60; x++) engine.set(x, y, lava);
  for (let y = 40; y < 50; y++) for (let x = 0; x < 60; x++) engine.set(x, y, water);
  for (let t = 0; t < 60; t++) engine.update();
  check('lava + water makes stone & steam', countId(engine, stone) > 10 && countId(engine, reg.id('steam')) > 0,
    `stone=${countId(engine, stone)} steam=${countId(engine, reg.id('steam'))}`);
}
{
  const { reg, engine } = freshWorld();
  const ice = reg.id('ice'), fire = reg.id('fire'), torch = reg.id('torch');
  for (let y = 50; y < 55; y++) for (let x = 20; x < 40; x++) engine.set(x, y, ice);
  for (let x = 20; x < 40; x++) engine.set(x, 55, torch);
  for (let t = 0; t < 300; t++) engine.update();
  check('ice melts near heat', countId(engine, ice) < 90, `ice=${countId(engine, ice)}`);
}
{
  const { reg, engine } = freshWorld();
  const nitro = reg.id('nitro'), wall = reg.id('wall'), fire = reg.id('fire'), smoke = reg.id('smoke');
  for (let x = 0; x < 60; x++) engine.set(x, 59, wall);
  for (let y = 2; y < 6; y++) for (let x = 28; x < 32; x++) engine.set(x, y, nitro);
  for (let t = 0; t < 200; t++) engine.update();
  check('nitro detonates on impact', countId(engine, nitro) === 0,
    `nitro=${countId(engine, nitro)} fire=${countId(engine, fire)} smoke=${countId(engine, smoke)}`);
}
{
  const { reg, engine } = freshWorld();
  const conc = reg.id('concrete'), wall = reg.id('wall');
  for (let x = 0; x < 60; x++) engine.set(x, 59, wall);
  for (let y = 20; y < 30; y++) for (let x = 28; x < 32; x++) engine.set(x, y, conc);
  for (let t = 0; t < 500; t++) engine.update();
  check('concrete sets into wall', countId(engine, wall) > 60 && countId(engine, conc) === 0,
    `wall=${countId(engine, wall)} concrete=${countId(engine, conc)}`);
}

// ================================================= library chemistry

console.log('\n-- library chemistry --');
{
  const { reg, engine } = freshWorld();
  const na = reg.id('sodium'), water = reg.id('water');
  for (let y = 45; y < 60; y++) for (let x = 0; x < 60; x++) engine.set(x, y, water);
  engine.set(30, 10, na);
  for (let t = 0; t < 300; t++) engine.update();
  check('sodium explodes in water', countId(engine, na) === 0);
}
{
  const { reg, engine } = freshWorld();
  const acid = reg.id('sulfuric acid'), iron = reg.id('iron'), gold = reg.id('gold');
  for (let x = 10; x < 30; x++) for (let y = 50; y < 55; y++) engine.set(x, y, x < 20 ? iron : gold);
  for (let x = 10; x < 30; x++) engine.set(x, 49, acid);
  const ironBefore = countId(engine, iron), goldBefore = countId(engine, gold);
  for (let t = 0; t < 500; t++) engine.update();
  check('acid corrodes iron but not gold',
    countId(engine, iron) < ironBefore && countId(engine, gold) === goldBefore,
    `iron ${ironBefore}->${countId(engine, iron)}, gold ${goldBefore}->${countId(engine, gold)}`);
}
{
  const { reg, engine } = freshWorld();
  const ln = reg.id('liquid nitrogen'), water = reg.id('water'), ice = reg.id('ice');
  for (let y = 50; y < 60; y++) for (let x = 0; x < 60; x++) engine.set(x, y, water);
  for (let y = 45; y < 50; y++) for (let x = 20; x < 40; x++) engine.set(x, y, ln);
  for (let t = 0; t < 100; t++) engine.update();
  check('liquid nitrogen flash-freezes water', countId(engine, ice) > 20, `ice=${countId(engine, ice)}`);
}
{
  const { reg, engine } = freshWorld();
  const soda = reg.id('baking soda'), vin = reg.id('vinegar'), co2 = reg.id('carbon dioxide');
  for (let y = 50; y < 60; y++) for (let x = 20; x < 40; x++) engine.set(x, y, soda);
  for (let y = 45; y < 50; y++) for (let x = 20; x < 40; x++) engine.set(x, y, vin);
  for (let t = 0; t < 100; t++) engine.update();
  check('baking soda + vinegar fizzes CO2', countId(engine, co2) > 5, `co2=${countId(engine, co2)}`);
}
{
  const { reg, engine } = freshWorld();
  const cement = reg.id('cement'), water = reg.id('water'), conc = reg.id('concrete'), wallId = reg.id('wall');
  for (let x = 0; x < 60; x++) engine.set(x, 59, wallId);
  for (let y = 54; y < 59; y++) for (let x = 20; x < 40; x++) engine.set(x, y, cement);
  for (let y = 49; y < 54; y++) for (let x = 20; x < 40; x++) engine.set(x, y, water);
  for (let t = 0; t < 200; t++) engine.update();
  check('cement + water becomes concrete', countId(engine, conc) + countId(engine, wallId) > 70,
    `concrete=${countId(engine, conc)}`);
}
{
  const { reg, engine } = freshWorld();
  check('mercury is denser than iron filings dense enough to sink', reg.get('mercury').density > reg.get('water').density);
  check('hydrogen rises (lighter than air)', reg.get('hydrogen').density < 0.0012);
  check('CO2 sinks (heavier than air)', reg.get('carbon dioxide').density > 0.0012);
  check('diamond is indestructible', reg.get('diamond').indestructible === true);
}

// ================================================= creatures

console.log('\n-- creatures --');
{
  const { reg, engine } = freshWorld();
  const wallId = reg.id('wall');
  for (let x = 0; x < 60; x++) engine.set(x, 50, wallId);
  const cat = reg.id('cat');
  check('cat exists as a creature', reg.get('cat').creature !== null);
  engine.paint(30, 45, 1, cat);
  check('cat spawns as an entity', engine.entities.count() === 1);
  const ent = engine.entities.list[0];
  const x0 = ent.x;
  let moved = false;
  for (let t = 0; t < 120; t++) { engine.update(); if (ent.x !== x0) moved = true; }
  check('cat is alive and standing on the floor', engine.entities.count() === 1 && ent.y + ent.shape.h <= 51);
  check('cat walks around', moved, `x0=${x0} x=${ent.x}`);
  check('cat body cells are in the grid', countId(engine, cat) > 5);

  // now torch the floor under it
  const fire = reg.id('fire');
  let died = false;
  for (let t = 0; t < 900; t++) {
    for (let x = 0; x < 60; x++) if (engine.cells[engine.idx(x, 49)] === 0 && Math.random() < 0.5) engine.set(x, 49, fire);
    engine.update();
    if (engine.entities.count() === 0) { died = true; break; }
  }
  check('cat dies in sustained fire', died);
  check('burned cat leaves ash behind', countId(engine, reg.id('ash')) > 0);
}
{
  const { reg, engine } = freshWorld();
  const fish = reg.id('fish'), water = reg.id('water');
  for (let y = 30; y < 60; y++) for (let x = 0; x < 60; x++) engine.set(x, y, water);
  engine.paint(30, 45, 1, fish);
  for (let t = 0; t < 300; t++) engine.update();
  check('fish survives under water', engine.entities.count() === 1);
}

// ================================================= AI generation

console.log('\n-- AI particle lab --');
{
  const { reg } = freshWorld();
  const v = offlineGenerate('cat', reg);
  check('offline AI: "cat" is a creature', v.ok && v.spec.creature && v.spec.creature.body === 'quadruped');
  check('offline AI: cat fears fire and water',
    v.spec.creature.fears.includes('hot') && v.spec.creature.fears.includes('wet'));
}
{
  const { reg, engine } = freshWorld();
  const v = offlineGenerate('cat', reg);
  const id = reg.define(v.spec);
  reg.resolveAll();
  engine.cacheIds();
  const wallId = reg.id('wall');
  for (let x = 0; x < 60; x++) engine.set(x, 50, wallId);
  engine.paint(30, 45, 1, id);
  for (let t = 0; t < 60; t++) engine.update();
  check('generated cat lives in the world', engine.entities.count() === 1);
}
{
  const { reg } = freshWorld();
  const v = offlineGenerate('explosive rainbow dust', reg);
  check('offline AI: "explosive rainbow dust" explodes', v.ok && !!v.spec.explosive);
  check('offline AI: rainbow coloring applied', v.spec.colors.length >= 4);
  const v2 = offlineGenerate('molten gold rain', reg);
  check('offline AI: "molten" makes it a hot liquid',
    v2.ok && v2.spec.cat === 'liquid' && v2.spec.tags.includes('hot'));
  const v3 = offlineGenerate('glorbnak', reg);
  check('offline AI: unknown word still yields a valid particle', v3.ok && v3.spec.colors.length >= 3);
  const v4 = offlineGenerate('toxic green gas', reg);
  check('offline AI: "toxic green gas" is a toxic gas', v4.ok && v4.spec.cat === 'gas' && v4.spec.tags.includes('toxic'));
  const v5 = offlineGenerate('flying blue whale', reg);
  check('offline AI: modifiers apply to creatures', v5.ok && v5.spec.creature && v5.spec.creature.canFly === true);
}
{
  const { reg, engine } = freshWorld();
  // every generated spec must define cleanly and simulate without crashing
  const prompts = ['cat', 'dragon', 'lava monster', 'frozen honey', 'radioactive slime',
    'sticky pink goo', 'quantum foam', 'xyzzyplugh', 'magic crystal', 'burning ice'];
  let allOk = true;
  for (const p of prompts) {
    const v = offlineGenerate(p, reg);
    if (!v.ok) { allOk = false; console.log(`   spec failed for "${p}"`); continue; }
    const id = reg.define(v.spec);
    reg.resolveAll();
    engine.cacheIds();
    engine.paint(30, 10, 3, id);
  }
  for (let t = 0; t < 200; t++) engine.update();
  check('10 varied AI particles simulate without crashing', allOk);
}
{
  const { reg } = freshWorld();
  const bad = validateSpec({ colors: 'nope' }, reg);
  check('validator rejects spec without a name', !bad.ok);
  const risky = validateSpec({
    name: 'Sketchy', cat: 'liquid', tags: ['hot', 'notatag', 'evil'],
    reactions: [{ with: 'nonexistium', p: 1, explode: 999 }, { with: '#wet', p: 2, self: 'fakeium' }],
    explosive: { r: 5000 }, corrosive: 99, colors: ['#zzz', '#ff0000']
  }, reg);
  check('validator strips unknown tags', risky.ok && risky.spec.tags.length === 1 && risky.spec.tags[0] === 'hot');
  check('validator drops rules on unknown elements', risky.spec.reactions.length === 1 && risky.spec.reactions[0].with === '#wet');
  check('validator clamps explosion radius', risky.spec.explosive.r <= 20);
  check('validator keeps only valid colors', risky.spec.colors.length === 1);
  const def = reg.define(risky.spec);
  check('sanitized spec registers cleanly (corrosive clamped)', reg.elements[def].corrosive <= 1);
}

// ================================================= perf smoke

console.log('\n-- performance smoke --');
{
  const { reg, engine } = freshWorld();
  // fill a busy world on the real grid size
  const big = new Engine(reg, 480, 320);
  new Entities(big);
  big.cacheIds();
  const ids = ['sand', 'water', 'salt', 'oil', 'lava', 'gunpowder'].map(n => reg.id(n));
  for (let y = 200; y < 320; y++) for (let x = 0; x < 480; x++) {
    big.setI(big.idx(x, y), ids[(x / 80 | 0) % ids.length]);
  }
  const t0 = performance.now();
  for (let t = 0; t < 60; t++) big.update();
  const ms = (performance.now() - t0) / 60;
  console.log(`   avg update: ${ms.toFixed(2)} ms/frame on 480x320 with ~57k particles`);
  check('60fps budget: update under 16ms/frame', ms < 16, `${ms.toFixed(2)}ms`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
