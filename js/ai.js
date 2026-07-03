/*
 * AI particle lab.
 *
 * A prompt ("cat", "molten uranium rain", "sticky purple slime") becomes a
 * particle definition that must follow THE GUIDELINES — a strict schema whose
 * every field maps onto the physics engine, so generated particles always
 * interact with the existing world (fire, water, acid, creatures...).
 *
 * Two generation paths:
 *   1. LLM (any OpenAI-compatible chat API, key supplied by the player) —
 *      the model is prompted with the guidelines and must answer pure JSON.
 *   2. Built-in offline synthesizer — a lexicon + deterministic word-hash
 *      fallback, so the feature works with no key at all.
 * Every candidate, whatever its source, passes through validateSpec() which
 * whitelists tags/behaviors, clamps numbers and verifies references.
 */

import { CAT_NAMES, TAGS } from './registry.js';

export const GUIDELINES = `AI PARTICLE GUIDELINES (all generated particles MUST follow these)

1. Output ONE JSON object, no prose, describing a single particle.
2. Required: "name" (short), "cat" one of powder|liquid|gas|static|solid|energy
   (or omit "cat" and provide "creature" for living things), "colors"
   (1-4 hex strings), "desc" (one sentence).
3. Physics must be scientifically plausible:
   - "density": relative to water=1 (air=0.0012, stone~2.5, iron~7, gold~19).
     Lighter liquids float on denser ones; gases lighter than air rise.
   - "flamm" 0..1 only for things that really burn (organic, fuels).
     "burnTime" frames, "burnInto" what remains ("ash", "" = nothing).
   - Phase changes: "hotInto"/"hotP" (near fire), "magmaInto"/"magmaP" (near
     lava), "coldInto"/"coldP", "cryoInto"/"cryoP" (near liquid nitrogen).
   - "dissolve": [{"in":"water","into":"","otherInto":"sugar water","p":0.2}]
   - "reactions": [{"with":"element or #tag","p":0..1,"self":"...","other":"...",
     "spawn":"...","explode":radius}]  ("self"/"other" null = unchanged, "" = destroyed)
   - "grow": {"on":["water" or "#tag"],"p":0.05} spreads into those neighbors.
   - "emit": {"what":"fire","rate":0.3,"dir":"down|up|all"} for sources.
   - "decay": {"life":[min,max],"into":"steam"} for evaporating/short-lived.
   - "rest": {"after":120,"into":"wall"} hardens after settling.
   - "explosive": {"r":2..20,"byFire":true,"byImpact":false,"byShock":true}
   - "corrosive" 0..1 (acids), "tox" 0..1 (poisons), "conductive" true/false,
     "viscosity" 0..1 (honey ~0.9).
4. "tags" hook the particle into world physics; only these are allowed:
   ${TAGS.join(', ')}.
   Examples: burnables are "organic"; acids get "acid"; things that should
   melt ice/ignite others get "hot"; water-like liquids get "wet".
5. Living things use "creature": {"body":"quadruped|bird|fish|bug|humanoid|
   snake|blob","size":"tiny|small|medium","speed":0.05..3,"canFly":bool,
   "canSwim":bool,"aquatic":bool,"hp":5..400,"fears":[tags],"eats":[tags]}.
   Creatures MUST fear what would hurt them (fire => "hot"); they burn,
   drown, dissolve in acid and flee danger automatically.
6. Only reference elements that exist (fire, water, steam, smoke, ash, lava,
   stone, ice, salt, oil, sand...) or "#tags". Unknown references are removed.
7. Numbers outside the allowed ranges are clamped. Unknown fields are ignored.`;

const HEX_RE = /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
const TAG_SET = new Set(TAGS);
const BODIES = ['quadruped', 'bird', 'fish', 'bug', 'humanoid', 'snake', 'blob'];

// ---------------------------------------------------------------- validation

function wordHash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function hashColors(seed) {
  const h = wordHash(seed);
  const hue = h % 360, sat = 45 + (h >> 9) % 40, lig = 40 + (h >> 17) % 30;
  const c = (hh, ss, ll) => {
    ss /= 100; ll /= 100;
    const a = ss * Math.min(ll, 1 - ll);
    const f = (n) => {
      const k = (n + hh / 30) % 12;
      const v = ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(v * 255).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  return [c(hue, sat, lig), c(hue, sat, lig + 8), c(hue, sat, lig - 8)];
}

/* Validate & sanitize a raw spec (from the LLM or the offline generator)
 * against the guidelines. Returns { ok, spec, warnings, errors }. */
export function validateSpec(raw, reg) {
  const warnings = [], errors = [];
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['not an object'], warnings };

  const spec = {};
  spec.name = String(raw.name || '').replace(/[^\w\s'-]/g, '').trim().slice(0, 24);
  if (!spec.name) errors.push('missing name');

  const isCreature = raw.creature && typeof raw.creature === 'object';
  if (isCreature) {
    const c = raw.creature;
    spec.creature = {
      body: BODIES.includes(c.body) ? c.body : 'blob',
      size: c.size, speed: c.speed, canFly: c.canFly, canSwim: c.canSwim,
      aquatic: c.aquatic, hp: c.hp,
      fears: (Array.isArray(c.fears) ? c.fears : []).filter(t => TAG_SET.has(t)),
      eats: (Array.isArray(c.eats) ? c.eats : []).filter(t => TAG_SET.has(t))
    };
    if (!spec.creature.fears.length) {
      spec.creature.fears = ['hot'];
      warnings.push('creatures must fear fire: added "hot" to fears');
    }
  } else {
    spec.cat = CAT_NAMES.includes(raw.cat) ? raw.cat : null;
    if (!spec.cat || spec.cat === 'empty' || spec.cat === 'creature') {
      warnings.push(`invalid category "${raw.cat}", defaulting to powder`);
      spec.cat = 'powder';
    }
  }

  // colors
  let colors = Array.isArray(raw.colors) ? raw.colors.filter(c => HEX_RE.test(String(c))) : [];
  if (!colors.length) {
    colors = hashColors(spec.name || 'particle');
    warnings.push('no valid colors given, generated some');
  }
  spec.colors = colors.slice(0, 4).map(c => (String(c)[0] === '#' ? c : '#' + c));

  // tags
  spec.tags = (Array.isArray(raw.tags) ? raw.tags : []).filter(t => {
    if (TAG_SET.has(t)) return true;
    warnings.push(`unknown tag "${t}" removed`);
    return false;
  });

  const known = (n) => n === '' || n == null || reg.has(String(n));
  const ref = (n, field) => {
    if (n == null) return null;
    if (n === '') return '';
    const s = String(n).trim();
    if (known(s)) return s;
    warnings.push(`${field}: unknown element "${s}" -> nothing`);
    return '';
  };
  const tagOrEl = (n, field) => {
    const s = String(n || '').trim();
    if (s.startsWith('#')) {
      if (TAG_SET.has(s.slice(1))) return s;
      warnings.push(`${field}: unknown tag "${s}" -> rule dropped`);
      return null;
    }
    if (reg.has(s)) return s;
    warnings.push(`${field}: unknown element "${s}" -> rule dropped`);
    return null;
  };

  // simple numeric / string passthroughs (registry clamps ranges)
  for (const k of ['density', 'viscosity', 'flamm', 'burnTime', 'burnSmoke',
                   'hotP', 'magmaP', 'coldP', 'cryoP', 'corrosive', 'tox']) {
    if (raw[k] !== undefined) spec[k] = Number(raw[k]);
  }
  spec.conductive = !!raw.conductive;
  spec.glow = !!raw.glow;

  for (const k of ['burnInto', 'hotInto', 'magmaInto', 'coldInto', 'cryoInto']) {
    if (raw[k] !== undefined) spec[k] = ref(raw[k], k);
  }

  if (raw.dissolve) {
    spec.dissolve = (Array.isArray(raw.dissolve) ? raw.dissolve : [raw.dissolve])
      .map(dd => {
        const inn = tagOrEl(dd.in ?? 'water', 'dissolve.in');
        if (inn === null) return null;
        return { in: inn, into: ref(dd.into, 'dissolve.into'), otherInto: dd.otherInto === undefined ? null : ref(dd.otherInto, 'dissolve.otherInto'), p: dd.p };
      }).filter(Boolean);
  }

  if (raw.reactions) {
    spec.reactions = (Array.isArray(raw.reactions) ? raw.reactions : [raw.reactions])
      .map(rr => {
        const withRef = tagOrEl(rr.with, 'reactions.with');
        if (withRef === null) return null;
        return {
          with: withRef, p: rr.p,
          self: rr.self === undefined || rr.self === null ? null : ref(rr.self, 'reactions.self'),
          other: rr.other === undefined || rr.other === null ? null : ref(rr.other, 'reactions.other'),
          spawn: rr.spawn ? (reg.has(String(rr.spawn)) ? String(rr.spawn) : null) : null,
          explode: Math.min(20, Number(rr.explode) || 0)
        };
      }).filter(Boolean);
  }

  if (raw.grow && raw.grow.on) {
    const on = (Array.isArray(raw.grow.on) ? raw.grow.on : [raw.grow.on])
      .map(o => tagOrEl(o, 'grow.on')).filter(Boolean);
    if (on.length) spec.grow = { on, p: raw.grow.p };
  }
  if (raw.emit && raw.emit.what && reg.has(String(raw.emit.what))) {
    spec.emit = { what: String(raw.emit.what), rate: raw.emit.rate, dir: raw.emit.dir };
  }
  if (raw.decay) spec.decay = { life: raw.decay.life, into: ref(raw.decay.into, 'decay.into') };
  if (raw.rest && raw.rest.into && reg.has(String(raw.rest.into))) {
    spec.rest = { after: raw.rest.after, into: String(raw.rest.into) };
  }
  if (raw.explosive) {
    spec.explosive = {
      r: Math.min(20, Math.max(2, Number(raw.explosive.r) || 6)),
      byFire: raw.explosive.byFire !== false,
      byImpact: !!raw.explosive.byImpact,
      byShock: raw.explosive.byShock !== false
    };
  }

  spec.desc = String(raw.desc || '').slice(0, 200);
  spec.ai = true;
  return { ok: errors.length === 0, spec, warnings, errors };
}

// ---------------------------------------------------- offline synthesizer

/* Creature lexicon: prompt nouns that become living particles. */
const ANIMALS = {
  cat:      { body: 'quadruped', size: 'small', speed: 0.7, hp: 90, fears: ['hot', 'wet', 'toxic'], eats: ['food'], colors: ['#d08830', '#c07820', '#3a3a3a'] },
  kitten:   { body: 'quadruped', size: 'tiny', speed: 0.9, hp: 40, fears: ['hot', 'wet', 'toxic'], eats: ['food'], colors: ['#e0a050', '#d09040'] },
  dog:      { body: 'quadruped', size: 'small', speed: 0.85, hp: 100, canSwim: true, fears: ['hot', 'toxic'], eats: ['food'], colors: ['#8a6238', '#946c40'] },
  puppy:    { body: 'quadruped', size: 'tiny', speed: 1.0, hp: 45, fears: ['hot', 'toxic'], eats: ['food'], colors: ['#a87848', '#b08050'] },
  wolf:     { body: 'quadruped', size: 'small', speed: 1.0, hp: 120, fears: ['hot'], eats: ['food'], colors: ['#787c84', '#84888e'] },
  fox:      { body: 'quadruped', size: 'small', speed: 0.95, hp: 80, fears: ['hot'], eats: ['food'], colors: ['#d06828', '#f0f0f0'] },
  horse:    { body: 'quadruped', size: 'medium', speed: 1.3, hp: 200, canSwim: true, fears: ['hot'], eats: ['food'], colors: ['#7a4a22', '#845430'] },
  cow:      { body: 'quadruped', size: 'medium', speed: 0.3, hp: 220, fears: ['hot'], eats: ['food'], colors: ['#f0ece4', '#2c2824'] },
  pig:      { body: 'quadruped', size: 'small', speed: 0.5, hp: 130, fears: ['hot'], eats: ['food'], colors: ['#e8a8a0', '#f0b0a8'] },
  sheep:    { body: 'quadruped', size: 'small', speed: 0.4, hp: 110, fears: ['hot'], eats: ['food'], colors: ['#e8e4d8', '#484440'] },
  lion:     { body: 'quadruped', size: 'medium', speed: 1.1, hp: 240, fears: [], eats: ['food'], colors: ['#c89848', '#8a5c2c'] },
  tiger:    { body: 'quadruped', size: 'medium', speed: 1.15, hp: 240, canSwim: true, fears: [], eats: ['food'], colors: ['#e08028', '#2c2824'] },
  bear:     { body: 'quadruped', size: 'medium', speed: 0.8, hp: 300, canSwim: true, fears: [], eats: ['food', 'sweet'], colors: ['#5c4028', '#644830'] },
  mouse:    { body: 'bug', size: 'tiny', speed: 1.1, hp: 20, fears: ['hot', 'toxic'], eats: ['food', 'sweet'], colors: ['#9a9490'] },
  rat:      { body: 'bug', size: 'tiny', speed: 1.0, hp: 30, canSwim: true, fears: ['hot'], eats: ['food'], colors: ['#6c6864'] },
  rabbit:   { body: 'quadruped', size: 'tiny', speed: 1.2, hp: 35, fears: ['hot', 'toxic'], eats: ['food'], colors: ['#c8b8a8'] },
  bird:     { body: 'bird', size: 'tiny', speed: 0.9, hp: 30, canFly: true, fears: ['hot', 'toxic'], colors: ['#4878c8'] },
  eagle:    { body: 'bird', size: 'small', speed: 1.2, hp: 70, canFly: true, fears: ['hot'], eats: ['food'], colors: ['#5c452c', '#e8e4d8'] },
  crow:     { body: 'bird', size: 'tiny', speed: 1.0, hp: 35, canFly: true, fears: ['hot'], eats: ['food'], colors: ['#242430'] },
  owl:      { body: 'bird', size: 'small', speed: 0.9, hp: 55, canFly: true, fears: ['hot'], eats: ['food'], colors: ['#8a7454'] },
  duck:     { body: 'bird', size: 'tiny', speed: 0.7, hp: 40, canFly: true, canSwim: true, fears: ['hot'], colors: ['#e8e0c8', '#e8a020'] },
  chicken:  { body: 'bird', size: 'tiny', speed: 0.8, hp: 35, fears: ['hot', 'wet'], eats: ['food'], colors: ['#f0ece0', '#c03020'] },
  bat:      { body: 'bird', size: 'tiny', speed: 1.1, hp: 20, canFly: true, fears: ['hot'], colors: ['#3c3440'] },
  fish:     { body: 'fish', size: 'tiny', speed: 0.8, hp: 30, aquatic: true, canSwim: true, fears: ['hot', 'toxic'], colors: ['#e87838'] },
  shark:    { body: 'fish', size: 'medium', speed: 1.2, hp: 250, aquatic: true, canSwim: true, fears: [], eats: ['food'], colors: ['#7c8c9c', '#e8ecf0'] },
  whale:    { body: 'fish', size: 'medium', speed: 0.6, hp: 380, aquatic: true, canSwim: true, fears: [], colors: ['#48586c'] },
  dolphin:  { body: 'fish', size: 'small', speed: 1.4, hp: 150, aquatic: true, canSwim: true, fears: ['toxic'], colors: ['#8ca4b8'] },
  octopus:  { body: 'blob', size: 'small', speed: 0.6, hp: 90, aquatic: true, canSwim: true, fears: ['hot'], colors: ['#a05878'] },
  jellyfish:{ body: 'blob', size: 'tiny', speed: 0.3, hp: 20, aquatic: true, canSwim: true, fears: [], colors: ['#d8a8e8'] },
  crab:     { body: 'bug', size: 'tiny', speed: 0.5, hp: 60, canSwim: true, fears: ['hot'], eats: ['food'], colors: ['#d05038'] },
  snake:    { body: 'snake', size: 'small', speed: 0.5, hp: 45, canSwim: true, fears: ['hot', 'cold'], colors: ['#508030'] },
  lizard:   { body: 'snake', size: 'tiny', speed: 0.8, hp: 30, fears: ['cold'], eats: ['food'], colors: ['#68a048'] },
  gecko:    { body: 'bug', size: 'tiny', speed: 0.9, hp: 20, fears: ['cold'], colors: ['#a8d048'] },
  frog:     { body: 'blob', size: 'tiny', speed: 0.7, hp: 30, canSwim: true, fears: ['hot', 'toxic'], colors: ['#48a040'] },
  toad:     { body: 'blob', size: 'tiny', speed: 0.5, hp: 35, canSwim: true, fears: ['hot'], colors: ['#8a8448'] },
  turtle:   { body: 'blob', size: 'small', speed: 0.15, hp: 160, canSwim: true, fears: ['hot'], colors: ['#588048', '#907848'] },
  spider:   { body: 'bug', size: 'tiny', speed: 0.8, hp: 15, fears: ['hot', 'wet'], colors: ['#302824'] },
  ant:      { body: 'bug', size: 'tiny', speed: 0.95, hp: 8, fears: ['hot', 'wet'], eats: ['food', 'sweet'], colors: ['#402818'] },
  bee:      { body: 'bug', size: 'tiny', speed: 1.0, hp: 10, canFly: true, fears: ['hot', 'wet', 'toxic'], eats: ['sweet'], colors: ['#e8b820', '#302820'] },
  wasp:     { body: 'bug', size: 'tiny', speed: 1.2, hp: 12, canFly: true, fears: ['hot', 'wet'], colors: ['#e8a020', '#241c14'] },
  fly:      { body: 'bug', size: 'tiny', speed: 1.4, hp: 4, canFly: true, fears: ['hot', 'wet'], eats: ['food'], colors: ['#3c444c'] },
  mosquito: { body: 'bug', size: 'tiny', speed: 1.2, hp: 3, canFly: true, fears: ['hot', 'wet'], colors: ['#4c4440'] },
  butterfly:{ body: 'bird', size: 'tiny', speed: 0.6, hp: 6, canFly: true, fears: ['hot', 'wet'], colors: ['#e86830', '#f8d048'] },
  moth:     { body: 'bird', size: 'tiny', speed: 0.7, hp: 6, canFly: true, fears: ['wet'], colors: ['#b0a890'] },
  beetle:   { body: 'bug', size: 'tiny', speed: 0.5, hp: 25, fears: ['hot'], eats: ['food'], colors: ['#28343c'] },
  scorpion: { body: 'bug', size: 'tiny', speed: 0.6, hp: 40, fears: ['cold', 'wet'], colors: ['#8a6c34'] },
  worm:     { body: 'snake', size: 'tiny', speed: 0.25, hp: 12, fears: ['hot', 'salty'], colors: ['#c88088'] },
  snail:    { body: 'blob', size: 'tiny', speed: 0.08, hp: 20, fears: ['salty', 'hot'], colors: ['#b09468', '#8a7450'] },
  slug:     { body: 'snake', size: 'tiny', speed: 0.1, hp: 15, fears: ['salty', 'hot'], colors: ['#8a8458'] },
  penguin:  { body: 'humanoid', size: 'small', speed: 0.45, hp: 60, canSwim: true, fears: ['hot'], eats: ['food'], colors: ['#282830', '#e8e8f0'] },
  human:    { body: 'humanoid', size: 'medium', speed: 0.5, hp: 140, canSwim: true, fears: ['hot', 'toxic', 'acid', 'radioactive'], eats: ['food'], colors: ['#e0a878', '#3858a0'] },
  person:   { body: 'humanoid', size: 'medium', speed: 0.5, hp: 140, canSwim: true, fears: ['hot', 'toxic', 'acid'], eats: ['food'], colors: ['#d8a070', '#a03028'] },
  zombie:   { body: 'humanoid', size: 'medium', speed: 0.25, hp: 200, fears: [], eats: ['food'], colors: ['#7c9458', '#68804c'] },
  robot:    { body: 'humanoid', size: 'medium', speed: 0.4, hp: 250, fears: ['wet', 'acid'], colors: ['#9ca4ac', '#c8d0d8'] },
  dragon:   { body: 'quadruped', size: 'medium', speed: 0.9, hp: 350, canFly: true, fears: ['cryo'], eats: ['food'], colors: ['#b02828', '#d84030'] },
  dinosaur: { body: 'quadruped', size: 'medium', speed: 0.8, hp: 320, fears: ['cold'], eats: ['food'], colors: ['#6c8448', '#748c50'] },
  firefly:  { body: 'bug', size: 'tiny', speed: 0.7, hp: 6, canFly: true, fears: ['hot', 'wet'], colors: ['#d8e838'] }
};

/* Material templates for common substance words. */
const MATERIALS = {
  slime:   { cat: 'liquid', density: 1.3, viscosity: 0.8, tags: ['organic', 'sticky'], colors: ['#58c838', '#60d040'] },
  goo:     { cat: 'liquid', density: 1.2, viscosity: 0.85, tags: ['sticky'], colors: ['#a058c8', '#a860d0'] },
  glue:    { cat: 'liquid', density: 1.1, viscosity: 0.9, tags: ['organic', 'sticky'], colors: ['#ece8dc'] },
  cloud:   { cat: 'gas', density: 0.0009, colors: ['#e8ecf0', '#f0f4f8'], decay: { life: [500, 1200], into: 'water' } },
  fog:     { cat: 'gas', density: 0.0013, colors: ['#c8ccd0', '#d0d4d8'], decay: { life: [300, 700], into: '' } },
  rain:    { cat: 'liquid', density: 1, tags: ['wet'], colors: ['#4868d8', '#5070e0'], hotInto: 'steam', hotP: 0.08 },
  crystal: { cat: 'static', tags: ['glassy', 'acidproof'], colors: ['#b8e0e8', '#c8e8f0'] },
  gem:     { cat: 'static', tags: ['glassy', 'acidproof'], colors: ['#48c8a0', '#50d0a8'] },
  metal:   { cat: 'static', tags: ['metal', 'conductive'], density: 7, magmaInto: 'molten metal', magmaP: 0.02, colors: ['#9ca4ac', '#a4acb4'] },
  rock:    { cat: 'solid', tags: ['stone'], density: 2.6, colors: ['#7a7a7a'] },
  mineral: { cat: 'powder', tags: ['stone'], density: 2, colors: ['#a09080'] },
  wood:    { cat: 'static', tags: ['organic'], flamm: 0.15, burnTime: 350, burnInto: 'ash', colors: ['#8a5c2c'] },
  fuel:    { cat: 'liquid', density: 0.8, tags: ['organic'], flamm: 0.8, burnTime: 180, burnInto: '', colors: ['#d8b060'] },
  bomb:    { cat: 'solid', density: 2, explosive: { r: 10, byFire: true, byShock: true }, flamm: 0.4, burnTime: 20, burnInto: '', colors: ['#3c3c44', '#c03020'] },
  poison:  { cat: 'liquid', density: 1.1, tags: ['toxic'], tox: 0.7, colors: ['#68c020', '#70c828'] },
  venom:   { cat: 'liquid', density: 1.1, tags: ['toxic'], tox: 0.8, colors: ['#98c818'] },
  acid:    { cat: 'liquid', density: 1.4, corrosive: 0.7, colors: ['#c8e830', '#d0f038'] },
  soap:    { cat: 'liquid', density: 1, tags: ['wet', 'clean'], reactions: [{ with: '#toxic', p: 0.15, other: '' }], colors: ['#c8e0f0'] },
  juice:   { cat: 'liquid', density: 1.05, tags: ['organic', 'food', 'sweet', 'wet'], colors: ['#e08018'] },
  candy:   { cat: 'static', tags: ['organic', 'food', 'sweet'], dissolve: [{ in: 'water', into: '', otherInto: 'sugar water', p: 0.05 }], colors: ['#e83858', '#38a0e8'] },
  snow:    { cat: 'powder', density: 0.3, tags: ['cold', 'wet', 'light'], hotInto: 'water', hotP: 0.3, colors: ['#f4f8ff'] },
  dust:    { cat: 'powder', density: 0.4, tags: ['light'], flamm: 0.3, burnTime: 10, burnInto: '', colors: ['#b0a890'] },
  powder:  { cat: 'powder', density: 1, colors: ['#c8c0b0'] },
  sand:    { cat: 'powder', density: 1.6, tags: ['stone'], magmaInto: 'glass', magmaP: 0.02, colors: ['#eecc80'] },
  spore:   { cat: 'powder', density: 0.12, tags: ['organic', 'life', 'light'], reactions: [{ with: '#organic', p: 0.02, self: 'mold' }], colors: ['#907848'] },
  gas:     { cat: 'gas', density: 0.001, colors: ['#c0c8d0'] },
  smoke:   { cat: 'gas', density: 0.0008, decay: { life: [100, 300], into: '' }, colors: ['#3c3c3c'] },
  steam:   { cat: 'gas', density: 0.0006, decay: { life: [200, 400], into: 'water' }, tags: ['wet'], colors: ['#b8c4cc'] },
  plasma:  { cat: 'gas', density: 0.00008, tags: ['hot', 'magma'], glow: true, decay: { life: [30, 80], into: 'fire' }, colors: ['#ff80ff', '#c060ff'] },
  flame:   { cat: 'energy', density: 0.0005, tags: ['hot'], glow: true, decay: { life: [24, 70], into: '' }, colors: ['#ff6a00', '#ffa020'] },
  ember:   { cat: 'powder', density: 0.8, tags: ['hot'], glow: true, decay: { life: [80, 200], into: 'ash' }, colors: ['#ff7020'] },
  magma:   { cat: 'liquid', density: 2.8, viscosity: 0.75, tags: ['hot', 'magma'], glow: true, coldInto: 'stone', coldP: 0.4, reactions: [{ with: '#wet', p: 0.65, self: 'stone', other: 'steam' }], colors: ['#ff4400', '#ff6a10'] },
  oil:     { cat: 'liquid', density: 0.9, tags: ['organic'], flamm: 0.45, burnTime: 260, burnInto: '', colors: ['#5c4a1e'] },
  water:   { cat: 'liquid', density: 1, tags: ['wet'], hotInto: 'steam', hotP: 0.08, cryoInto: 'ice', cryoP: 0.9, colors: ['#2048ff'] },
  plant:   { cat: 'static', tags: ['organic', 'life'], flamm: 0.5, burnTime: 50, burnInto: '', grow: { on: ['water'], p: 0.2 }, colors: ['#10a010'] },
  flower:  { cat: 'static', tags: ['organic', 'life', 'sweet'], flamm: 0.45, burnTime: 25, burnInto: 'ash', colors: ['#e858a0', '#e8d048'] },
  tree:    { cat: 'static', tags: ['organic'], flamm: 0.15, burnTime: 350, burnInto: 'ash', colors: ['#8a5c2c', '#3c8c24'] },
  glass:   { cat: 'static', tags: ['glassy', 'acidproof'], magmaInto: 'molten glass', magmaP: 0.01, colors: ['#c2dce4'] },
  ice:     { cat: 'static', tags: ['cold', 'wet'], hotInto: 'water', hotP: 0.35, colors: ['#a8d8f8'] },
  paper:   { cat: 'static', tags: ['organic'], flamm: 0.8, burnTime: 25, burnInto: 'ash', colors: ['#f0ecdc'] },
  rubber:  { cat: 'static', tags: ['organic'], flamm: 0.2, burnTime: 300, burnInto: '', burnSmoke: 0.95, colors: ['#2c2c34'] },
  jelly:   { cat: 'static', tags: ['organic', 'food', 'sweet'], hotInto: 'sugar water', hotP: 0.1, colors: ['#d84868'] },
  honey:   { cat: 'liquid', density: 1.42, viscosity: 0.9, tags: ['organic', 'food', 'sweet', 'sticky'], colors: ['#e8a820'] },
  blood:   { cat: 'liquid', density: 1.06, tags: ['organic', 'wet', 'food'], hotInto: 'steam', hotP: 0.05, colors: ['#a01818'] },
  milk:    { cat: 'liquid', density: 1.03, tags: ['organic', 'food', 'wet'], colors: ['#f4f4ec'] },
  lightning:{ cat: 'energy', density: 0.00001, glow: true, tags: ['conductive'], decay: { life: [16, 40], into: '' }, colors: ['#ffff80', '#ffffff'] },
  virus:   { cat: 'static', tags: ['life', 'toxic'], tox: 0.6, grow: { on: ['#life'], p: 0.03 }, decay: { life: [500, 900], into: '' }, colors: ['#c04898'] },
  seed:    { cat: 'powder', density: 0.7, tags: ['organic', 'food'], reactions: [{ with: 'dirt', p: 0.08, self: 'plant' }, { with: 'water', p: 0.03, self: 'plant' }], colors: ['#a08040'] },
  confetti:{ cat: 'powder', density: 0.1, tags: ['organic', 'light'], flamm: 0.6, burnTime: 8, burnInto: '', colors: ['#e83858', '#38a0e8', '#e8d038', '#48c848'] }
};

/* Adjective modifiers applied on top of the base template. */
const MODIFIERS = {
  molten:     (s) => { s.cat = 'liquid'; s.tags = [...(s.tags || []), 'hot', 'magma']; s.glow = true; s.viscosity = 0.6; s.flamm = 0; },
  burning:    (s) => { s.tags = [...(s.tags || []), 'hot']; s.glow = true; },
  frozen:     (s) => { if (s.cat !== 'gas') s.cat = 'static'; s.tags = [...(s.tags || []), 'cold']; s.hotInto = 'water'; s.hotP = 0.1; },
  liquid:     (s) => { if (!s.creature) s.cat = 'liquid'; },
  solid:      (s) => { if (!s.creature) s.cat = 'static'; },
  gaseous:    (s) => { if (!s.creature) { s.cat = 'gas'; s.density = 0.001; } },
  flammable:  (s) => { s.flamm = Math.max(s.flamm || 0, 0.6); s.burnTime = s.burnTime || 120; s.burnInto = s.burnInto ?? ''; s.tags = [...(s.tags || []), 'organic']; },
  explosive:  (s) => { s.explosive = { r: 8, byFire: true, byShock: true }; s.flamm = Math.max(s.flamm || 0, 0.4); s.burnTime = 15; s.burnInto = ''; },
  toxic:      (s) => { s.tags = [...(s.tags || []), 'toxic']; s.tox = Math.max(s.tox || 0, 0.6); },
  poisonous:  (s) => { s.tags = [...(s.tags || []), 'toxic']; s.tox = Math.max(s.tox || 0, 0.6); },
  radioactive:(s) => { s.tags = [...(s.tags || []), 'radioactive']; s.glow = true; },
  corrosive:  (s) => { s.corrosive = Math.max(s.corrosive || 0, 0.5); },
  sticky:     (s) => { s.tags = [...(s.tags || []), 'sticky']; s.viscosity = Math.max(s.viscosity || 0, 0.7); },
  heavy:      (s) => { s.density = (s.density || 1) * 4; s.tags = [...(s.tags || []), 'heavy']; },
  light:      (s) => { s.density = (s.density || 1) * 0.2; s.tags = [...(s.tags || []), 'light']; },
  glowing:    (s) => { s.glow = true; },
  magic:      (s) => { s.glow = true; s.colors = ['#c060ff', '#60c0ff', '#ff60c0']; },
  cold:       (s) => { s.tags = [...(s.tags || []), 'cold']; },
  hot:        (s) => { s.tags = [...(s.tags || []), 'hot']; s.glow = true; },
  conductive: (s) => { s.conductive = true; },
  giant:      (s) => { if (s.creature) s.creature.size = 'medium'; },
  tiny:       (s) => { if (s.creature) s.creature.size = 'tiny'; },
  flying:     (s) => { if (s.creature) s.creature.canFly = true; },
  swimming:   (s) => { if (s.creature) s.creature.canSwim = true; },
  fast:       (s) => { if (s.creature) s.creature.speed = Math.min(3, (s.creature.speed || 0.6) * 1.8); },
  slow:       (s) => { if (s.creature) s.creature.speed = (s.creature.speed || 0.6) * 0.4; else s.viscosity = 0.8; }
};

const COLOR_WORDS = {
  red: ['#d02020', '#d82828'], orange: ['#e07820', '#e88028'], yellow: ['#e0d020', '#e8d828'],
  green: ['#28a028', '#30a830'], blue: ['#2048d0', '#2850d8'], purple: ['#8028c0', '#8830c8'],
  pink: ['#e868a8', '#f070b0'], black: ['#202020', '#282828'], white: ['#f0f0f0', '#f8f8f8'],
  brown: ['#8a5c2c', '#946434'], gray: ['#909090', '#989898'], grey: ['#909090', '#989898'],
  cyan: ['#20c0c0', '#28c8c8'], magenta: ['#d020d0', '#d828d8'], gold: ['#e8b820', '#f0c028'],
  silver: ['#c8ccd0', '#d0d4d8'], rainbow: ['#e04040', '#e0a040', '#40c040', '#4060e0']
};

/* Deterministic fallback for words we know nothing about. */
function hashSpec(word) {
  const h = wordHash(word);
  const cats = ['powder', 'powder', 'liquid', 'liquid', 'static', 'gas', 'solid'];
  const cat = cats[h % cats.length];
  const spec = { cat, colors: hashColors(word), density: cat === 'gas' ? 0.001 : 0.5 + ((h >> 5) % 200) / 80 };
  if ((h >> 3) % 3 === 0) { // ~1/3 of unknown things are burnable organics
    spec.tags = ['organic'];
    spec.flamm = 0.15 + ((h >> 7) % 40) / 100;
    spec.burnTime = 40 + (h >> 9) % 200;
    spec.burnInto = 'ash';
  } else {
    spec.tags = ['stone'];
  }
  if (cat === 'liquid') { spec.tags.push('wet'); spec.hotInto = 'steam'; spec.hotP = 0.04; }
  return spec;
}

/* Offline "AI": lexicon + modifiers + word-hash fallback. Deterministic. */
export function offlineGenerate(prompt, reg) {
  const words = String(prompt).toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (!words.length) words.push('mystery');

  const singular = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

  // find the base noun: prefer animals, then materials (scan right-to-left:
  // "cat food" -> food is the head noun... but "fire cat" -> cat). Head nouns
  // in English come last, so scan from the end.
  let base = null, baseWord = null, isCreature = false;
  for (let i = words.length - 1; i >= 0; i--) {
    const w = singular(words[i]);
    if (ANIMALS[w]) { base = { creature: { ...ANIMALS[w] } }; baseWord = w; isCreature = true; break; }
    if (MATERIALS[w]) { base = JSON.parse(JSON.stringify(MATERIALS[w])); baseWord = w; break; }
  }
  if (!base) {
    // no known noun: last non-modifier word gets the hash treatment
    const candidates = words.filter(w => !MODIFIERS[singular(w)] && !COLOR_WORDS[singular(w)]);
    baseWord = singular(candidates[candidates.length - 1] || words[words.length - 1]);
    base = hashSpec(baseWord);
  }

  const spec = { ...base };
  if (isCreature) {
    const a = spec.creature;
    spec.colors = a.colors;
    delete a.colors;
  }

  // apply modifiers and colors from the remaining words
  for (const raw of words) {
    const w = singular(raw);
    if (w === baseWord) continue;
    if (MODIFIERS[w]) MODIFIERS[w](spec);
    if (COLOR_WORDS[w]) spec.colors = COLOR_WORDS[w];
  }

  spec.name = words.map(w => w[0].toUpperCase() + w.slice(1)).join(' ').slice(0, 24);
  spec.desc = `AI particle generated from "${prompt}".`;
  const v = validateSpec(spec, reg);
  v.source = 'offline';
  return v;
}

// ---------------------------------------------------------------- LLM path

function systemPrompt(reg) {
  const names = reg.paletteList().slice(0, 120).map(e => e.name).join(', ');
  return `You design new particles for a falling-sand game.\n\n${GUIDELINES}\n\n` +
    `Some existing elements you may reference: ${names}.\n` +
    `Answer with the JSON object only. Example for "cat":\n` +
    `{"name":"Cat","colors":["#d08830","#c07820"],"desc":"A small cat that walks around and flees fire.",` +
    `"tags":["organic","life"],"creature":{"body":"quadruped","size":"small","speed":0.7,"hp":90,` +
    `"fears":["hot","wet","toxic"],"eats":["food"]}}`;
}

export async function llmGenerate(prompt, settings, reg) {
  const endpoint = (settings.endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const res = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt(reg) },
        { role: 'user', content: `Create a particle: ${prompt}` }
      ]
    })
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  let text = data.choices?.[0]?.message?.content || '';
  text = text.replace(/```json|```/g, '').trim();
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a === -1 || b === -1) throw new Error('model did not return JSON');
  const raw = JSON.parse(text.slice(a, b + 1));
  const v = validateSpec(raw, reg);
  v.source = 'llm';
  if (!v.ok) throw new Error('model output failed validation: ' + v.errors.join(', '));
  return v;
}

/* Main entry: LLM when a key is configured, offline synthesizer otherwise
 * (and as fallback when the API call fails). */
export async function generateParticle(prompt, settings, reg) {
  if (settings && settings.apiKey) {
    try {
      return await llmGenerate(prompt, settings, reg);
    } catch (err) {
      const v = offlineGenerate(prompt, reg);
      v.warnings.unshift(`LLM failed (${err.message}); used built-in generator instead`);
      return v;
    }
  }
  return offlineGenerate(prompt, reg);
}
