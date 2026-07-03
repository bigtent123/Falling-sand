/*
 * Element registry: every particle in the game (classic, library, or
 * AI-generated) is a normalized "definition" stored here. The engine reads
 * these definitions; the AI validator produces them.
 */

export const CAT = Object.freeze({
  EMPTY: 0,   // air
  STATIC: 1,  // never moves (wall, wood, ice, torch...)
  POWDER: 2,  // falls, slides diagonally, sinks in lighter liquids
  SOLID: 3,   // falls straight down, stacks (rock/stone chunks)
  LIQUID: 4,  // falls, disperses horizontally, stratifies by density
  GAS: 5,     // rises/sinks vs air, wanders, may decay
  ENERGY: 6,  // fire, spark, ember... custom-ish movement
  CREATURE: 7 // multi-cell living entity (handled by the entity layer)
});

export const CAT_NAMES = ['empty', 'static', 'powder', 'solid', 'liquid', 'gas', 'energy', 'creature'];

/* Whitelisted tags. Tags drive the generic, physically-plausible cross
 * interactions (heat, cold, corrosion, conduction, growth targets...). */
export const TAGS = Object.freeze([
  'hot',        // ignites flammables, triggers hotInto (fire, ember, lava...)
  'magma',      // extreme heat: melts metal, vitrifies sand (lava, thermite)
  'cold',       // triggers coldInto (ice, snow)
  'cryo',       // extreme cold: flash-freezes (liquid nitrogen)
  'wet',        // water-like: rusts iron, grows plants, shorts circuits
  'organic',    // burns to ash, eaten by acid quickly, rots
  'metal',      // conducts, corrodes in acid, melts under magma
  'stone',      // acid-resistant mineral
  'glassy',     // immune to acid
  'acid',       // corrosive substances
  'base',       // alkaline: neutralizes acid
  'toxic',      // kills creatures/plants on contact
  'radioactive',// mutates/kills life nearby, glows
  'explosive',  // detonates when ignited or shocked
  'conductive', // carries electric spark
  'flammgas',   // explosive gas mixture behaviour
  'food',       // creatures eat it
  'life',       // alive: plants, creatures, bacteria
  'acidproof',  // never corroded
  'fireproof',  // never ignites or melts from plain fire
  'sticky',     // slows creatures / clings
  'light',      // floats on almost anything
  'heavy',      // sinks through almost anything
  'salty',      // melts ice, kills plants slowly
  'sweet',      // attracts bugs
  'clean'       // soap-like: neutralizes toxic
]);

const TAG_SET = new Set(TAGS);

export function hex(c) {
  // '#rgb' | '#rrggbb' -> [r,g,b]
  let h = String(c).replace('#', '').trim();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h.slice(0, 6), 16);
  if (!Number.isFinite(n)) return [255, 0, 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function clamp(v, lo, hi, dflt) {
  v = Number(v);
  if (!Number.isFinite(v)) return dflt;
  return Math.min(hi, Math.max(lo, v));
}

let NEXT_ID = 0;

export class Registry {
  constructor() {
    this.elements = [];        // id -> normalized def
    this.byKey = new Map();    // lowercase name -> id
    this.pendingResolve = [];  // rules referencing names defined later
    NEXT_ID = 0;
    // id 0 is always EMPTY (air)
    this.define({ name: 'Empty', cat: 'empty', colors: ['#000000'], density: 0.0012, hidden: true });
  }

  key(name) { return String(name).trim().toLowerCase(); }

  has(name) { return this.byKey.has(this.key(name)); }

  id(name) {
    if (name == null || name === '' || name === 'none' || name === 'nothing' || name === 'empty') return 0;
    const id = this.byKey.get(this.key(name));
    return id === undefined ? -1 : id;
  }

  get(idOrName) {
    if (typeof idOrName === 'number') return this.elements[idOrName];
    const id = this.id(idOrName);
    return id >= 0 ? this.elements[id] : undefined;
  }

  uniqueName(name) {
    let base = String(name).trim().slice(0, 24) || 'Particle';
    let n = base, i = 2;
    while (this.byKey.has(this.key(n))) n = `${base} ${i++}`;
    return n;
  }

  /* Normalize a raw definition into the internal element format and add it.
   * Unknown fields are ignored; all values are clamped to sane ranges.
   * This is the single funnel that classic elements, the big library and
   * AI-generated particles all pass through. */
  define(raw) {
    const name = this.uniqueName(raw.name || 'Particle');
    const catName = CAT_NAMES.includes(raw.cat) ? raw.cat : 'powder';
    const cat = CAT_NAMES.indexOf(catName);

    const colors = (Array.isArray(raw.colors) && raw.colors.length ? raw.colors : ['#c0c0c0'])
      .slice(0, 4).map(hex);

    const tags = new Set();
    for (const t of (raw.tags || [])) if (TAG_SET.has(t)) tags.add(t);

    const el = {
      id: NEXT_ID++,
      name,
      key: this.key(name),
      desc: String(raw.desc || '').slice(0, 200),
      cat,
      colors,
      glow: !!raw.glow,
      shimmer: raw.shimmer !== undefined ? !!raw.shimmer : (cat === CAT.LIQUID || cat === CAT.ENERGY || cat === CAT.GAS),
      hidden: !!raw.hidden,
      ai: !!raw.ai,                     // was this created by the AI prompt?
      indestructible: !!raw.indestructible, // survives explosions & acid (wall, diamond)
      spark: !!raw.spark,               // electricity: travels through conductors

      // physical
      density: clamp(raw.density, 0.00005, 30, cat === CAT.GAS ? 0.001 : (cat === CAT.LIQUID ? 1 : 1.6)),
      viscosity: clamp(raw.viscosity, 0, 1, 0),
      slide: raw.slide !== undefined ? !!raw.slide : cat === CAT.POWDER,

      // combustion
      flamm: clamp(raw.flamm, 0, 1, 0),
      burnTime: Math.round(clamp(raw.burnTime, 1, 5000, 90)),
      burnInto: raw.burnInto ?? '',      // name; '' = empty
      burnSmoke: clamp(raw.burnSmoke, 0, 1, 0.25),

      // phase / contact transitions (probability per hot/cold neighbor per tick)
      hotInto: raw.hotInto ?? null, hotP: clamp(raw.hotP, 0, 1, 0),
      magmaInto: raw.magmaInto ?? null, magmaP: clamp(raw.magmaP, 0, 1, 0),
      coldInto: raw.coldInto ?? null, coldP: clamp(raw.coldP, 0, 1, 0),
      cryoInto: raw.cryoInto ?? null, cryoP: clamp(raw.cryoP, 0, 1, 0),

      // dissolving: [{in: name|'#tag', into, p, otherInto?}]
      dissolve: (raw.dissolve || []).slice(0, 4).map(d => ({
        in: String(d.in || 'water'), into: d.into ?? '', p: clamp(d.p, 0, 1, 0.05),
        otherInto: d.otherInto !== undefined ? d.otherInto : null
      })),

      // custom pair reactions: [{with: name|'#tag', p, self, other, spawn, explode}]
      reactions: (raw.reactions || []).slice(0, 10).map(r => ({
        with: String(r.with || ''),
        p: clamp(r.p, 0, 1, 0.1),
        self: r.self !== undefined ? r.self : null,     // null = unchanged, '' = empty, name = becomes
        other: r.other !== undefined ? r.other : null,
        spawn: r.spawn || null,                          // spawn into nearby empty cell
        explode: Math.round(clamp(r.explode, 0, 40, 0))
      })),

      // growth: converts matching neighbors into self (plants, crystals, mold)
      grow: raw.grow ? {
        on: (Array.isArray(raw.grow.on) ? raw.grow.on : [raw.grow.on]).slice(0, 4).map(String),
        p: clamp(raw.grow.p, 0, 1, 0.05)
      } : null,

      // emitter (torch, spout...): {what, rate, dir: 'down'|'up'|'all'}
      emit: raw.emit ? {
        what: String(raw.emit.what || 'water'),
        rate: clamp(raw.emit.rate, 0, 1, 0.3),
        dir: ['down', 'up', 'all'].includes(raw.emit.dir) ? raw.emit.dir : 'down'
      } : null,

      // sink: deletes matching neighbors ('all' | 'liquid' | 'powder')
      sink: raw.sink || null,

      // spontaneous decay: {life:[min,max], into} (fire, smoke, steam...)
      decay: raw.decay ? {
        life: [Math.round(clamp(raw.decay.life?.[0], 1, 60000, 60)),
               Math.round(clamp(raw.decay.life?.[1], 1, 60000, 120))],
        into: raw.decay.into ?? ''
      } : null,

      // settles into another element after resting N frames (concrete, molten wax)
      rest: raw.rest ? {
        after: Math.round(clamp(raw.rest.after, 1, 5000, 120)),
        into: String(raw.rest.into || 'wall')
      } : null,

      explosive: raw.explosive ? {
        r: Math.round(clamp(raw.explosive.r, 2, 40, 8)),
        byFire: raw.explosive.byFire !== false,
        byImpact: !!raw.explosive.byImpact,
        byShock: raw.explosive.byShock !== false
      } : null,

      corrosive: clamp(raw.corrosive, 0, 1, 0),
      conductive: !!raw.conductive || tags.has('conductive') || tags.has('metal'),
      tox: clamp(raw.tox, 0, 1, tags.has('toxic') ? 0.5 : 0),

      tags,

      // creature template (see creatures.js)
      creature: raw.creature ? {
        body: String(raw.creature.body || 'quadruped'),
        size: ['tiny', 'small', 'medium'].includes(raw.creature.size) ? raw.creature.size : 'small',
        speed: clamp(raw.creature.speed, 0.05, 3, 0.6),
        canFly: !!raw.creature.canFly,
        canSwim: !!raw.creature.canSwim,
        aquatic: !!raw.creature.aquatic,
        hp: Math.round(clamp(raw.creature.hp, 5, 400, 60)),
        fears: (raw.creature.fears || ['hot']).filter(t => TAG_SET.has(t)).slice(0, 4),
        eats: (raw.creature.eats || []).filter(t => TAG_SET.has(t)).slice(0, 4)
      } : null
    };

    if (el.creature) { el.cat = CAT.CREATURE; tags.add('life'); tags.add('organic'); }
    if (el.corrosive > 0) tags.add('acid');
    if (el.explosive) tags.add('explosive');

    this.elements.push(el);
    this.byKey.set(el.key, el.id);
    return el.id;
  }

  /* Resolve every name reference in every definition to a numeric id.
   * Safe to call repeatedly (called after bulk loads and after each AI add). */
  resolveAll() {
    const rid = (n) => { const i = this.id(n); return i >= 0 ? i : 0; };
    for (const el of this.elements) {
      el.burnIntoId = rid(el.burnInto);
      el.hotIntoId = el.hotInto == null ? -1 : rid(el.hotInto);
      el.magmaIntoId = el.magmaInto == null ? -1 : rid(el.magmaInto);
      el.coldIntoId = el.coldInto == null ? -1 : rid(el.coldInto);
      el.cryoIntoId = el.cryoInto == null ? -1 : rid(el.cryoInto);
      if (el.decay) el.decay.intoId = rid(el.decay.into);
      if (el.rest) el.rest.intoId = rid(el.rest.into);
      if (el.emit) el.emit.whatId = rid(el.emit.what);
      for (const d of el.dissolve) {
        d.tag = d.in.startsWith('#') ? d.in.slice(1) : null;
        d.inId = d.tag ? -1 : rid(d.in);
        d.intoId = rid(d.into);
        d.otherIntoId = d.otherInto === null ? -1 : rid(d.otherInto);
      }
      for (const r of el.reactions) {
        r.tag = r.with.startsWith('#') ? r.with.slice(1) : null;
        r.withId = r.tag ? -1 : rid(r.with);
        r.selfId = r.self === null ? -1 : rid(r.self);
        r.otherId = r.other === null ? -1 : rid(r.other);
        r.spawnId = r.spawn ? rid(r.spawn) : -1;
      }
      if (el.grow) {
        el.grow.tags = el.grow.on.filter(o => o.startsWith('#')).map(o => o.slice(1));
        el.grow.ids = el.grow.on.filter(o => !o.startsWith('#')).map(rid);
      }
    }
  }

  /* Elements to show in the UI palette. */
  paletteList() {
    return this.elements.filter(e => !e.hidden);
  }

  count() { return this.elements.length; }
}
