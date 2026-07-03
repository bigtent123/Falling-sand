/*
 * Creature entity layer. Creatures are multi-cell living particles (cat,
 * bird, fish...). Their cells live in the normal grid so every element
 * interacts with them (fire burns fur, acid dissolves, water drowns
 * non-swimmers), but their movement is driven by a tiny per-entity AI:
 * walk, climb, fly, swim, flee from feared substances, eat food.
 */

import { CAT } from './registry.js';

const BODY_PATTERNS = {
  quadruped: [   // cat / dog: ears left, tail right
    '.X.X....',
    '.XXX...X',
    '.XXXXXXX',
    '.XXXXXX.',
    '.X.X.X.X'
  ],
  bird: [
    '.XX',
    'XXX',
    '.X.'
  ],
  fish: [
    '.XXX..X',
    'XXXXXXX',
    '.XXX..X'
  ],
  bug: [
    'XX',
    'XX'
  ],
  humanoid: [
    '.X.',
    'XXX',
    '.X.',
    '.X.',
    'X.X'
  ],
  snake: [
    'XXXXXX'
  ],
  blob: [
    '.XX.',
    'XXXX',
    '.XX.'
  ]
};

const SIZE_SCALE = { tiny: 1, small: 1, medium: 2 };

function patternCells(body, size) {
  const pat = BODY_PATTERNS[body] || BODY_PATTERNS.blob;
  const s = SIZE_SCALE[size] || 1;
  const cells = [];
  for (let r = 0; r < pat.length; r++) {
    for (let c = 0; c < pat[r].length; c++) {
      if (pat[r][c] !== 'X') continue;
      for (let sy = 0; sy < s; sy++) {
        for (let sx = 0; sx < s; sx++) {
          cells.push([c * s + sx, r * s + sy]);
        }
      }
    }
  }
  const wpx = Math.max(...cells.map(c => c[0])) + 1;
  const hpx = Math.max(...cells.map(c => c[1])) + 1;
  return { cells, w: wpx, h: hpx };
}

const MAX_ENTITIES = 64;

export class Entities {
  constructor(engine) {
    this.engine = engine;
    this.list = [];
    engine.entities = this;
  }

  clear() { this.list = []; }

  count() { return this.list.filter(Boolean).length; }

  spawn(x, y, elId) {
    if (this.count() >= MAX_ENTITIES) return null;
    const el = this.engine.reg.elements[elId];
    if (!el || !el.creature) return null;
    const shape = patternCells(el.creature.body, el.creature.size);
    const ent = {
      x: Math.round(x - shape.w / 2), y: Math.round(y - shape.h / 2),
      elId, def: el.creature, shape,
      hp: el.creature.hp, dir: this.engine.rng() < 0.5 ? 1 : -1,
      moveAcc: 0, burning: 0, breath: 240,
      placed: [], displaced: [], alive: true, flying: el.creature.canFly, vy: 0
    };
    // find a free slot index
    let idx = this.list.indexOf(null);
    if (idx === -1) { idx = this.list.length; this.list.push(ent); }
    else this.list[idx] = ent;
    ent.idx = idx;
    this.place(ent);
    return ent;
  }

  damage(idx, amount, type) {
    const ent = this.list[idx];
    if (!ent || !ent.alive) return;
    ent.hp -= amount;
    if (type === 'fire' && ent.burning === 0) ent.burning = 90;
  }

  /* Remove the entity's cells from the grid, restoring displaced fluids. */
  erase(ent) {
    const e = this.engine;
    for (let k = 0; k < ent.placed.length; k++) {
      const i = ent.placed[k];
      if (e.entityMap[i] === ent.idx + 1) {
        e.entityMap[i] = 0;
        e.cells[i] = 0;
        e.burn[i] = 0;
        const d = ent.displaced[k];
        if (d > 0 && e.cells[i] === 0) e.setI(i, d);
      }
    }
    ent.placed = [];
    ent.displaced = [];
  }

  /* Write the entity's cells into the grid at its current position. */
  place(ent) {
    const e = this.engine;
    ent.placed = [];
    ent.displaced = [];
    for (const [dx, dy] of ent.shape.cells) {
      const x = ent.x + (ent.dir === 1 ? dx : ent.shape.w - 1 - dx);
      const y = ent.y + dy;
      if (!e.inBounds(x, y)) continue;
      const i = e.idx(x, y);
      if (e.entityMap[i]) continue;
      const o = e.cells[i];
      let displaced = 0;
      if (o !== 0) {
        const oe = e.reg.elements[o];
        if (oe.cat === CAT.LIQUID || oe.cat === CAT.GAS) displaced = o;
        else if (oe.cat === CAT.ENERGY) {
          if (oe.tags.has('hot')) this.damage(ent.idx, 3, 'fire');
        } else continue; // solid: don't overwrite
      }
      e.cells[i] = ent.elId;
      e.entityMap[i] = ent.idx + 1;
      e.burn[i] = ent.burning > 0 ? 2 : 0;
      e.life[i] = 0;
      ent.placed.push(i);
      ent.displaced.push(displaced);
    }
  }

  /* Is the cell passable for this entity? */
  passable(ent, x, y) {
    const e = this.engine;
    if (!e.inBounds(x, y)) return false;
    const i = e.idx(x, y);
    if (e.entityMap[i] && e.entityMap[i] !== ent.idx + 1) return false;
    const o = e.cells[i];
    if (o === 0 || e.entityMap[i] === ent.idx + 1) return true;
    const oe = e.reg.elements[o];
    return oe.cat === CAT.LIQUID || oe.cat === CAT.GAS || oe.cat === CAT.ENERGY;
  }

  areaPassable(ent, nx, ny) {
    for (const [dx, dy] of ent.shape.cells) {
      const x = nx + (ent.dir === 1 ? dx : ent.shape.w - 1 - dx);
      if (!this.passable(ent, x, ny + dy)) return false;
    }
    return true;
  }

  /* Fraction of body cells currently inside liquid. */
  submersion(ent) {
    const e = this.engine;
    let inLiq = 0;
    for (let k = 0; k < ent.placed.length; k++) {
      const i = ent.placed[k];
      const d = ent.displaced[k];
      if (d > 0 && e.reg.elements[d].cat === CAT.LIQUID) inLiq++;
    }
    return ent.placed.length ? inLiq / ent.placed.length : 0;
  }

  /* Look for feared substances nearby; returns flee direction or 0. */
  senseDanger(ent) {
    const e = this.engine;
    const cx = ent.x + (ent.shape.w >> 1), cy = ent.y + (ent.shape.h >> 1);
    const R = 7;
    let threat = 0;
    for (let dy = -R; dy <= R; dy += 2) {
      for (let dx = -R; dx <= R; dx += 2) {
        const x = cx + dx, y = cy + dy;
        if (!e.inBounds(x, y)) continue;
        const i = e.idx(x, y);
        const o = e.cells[i];
        if (o === 0 || e.entityMap[i]) continue;
        const oe = e.reg.elements[o];
        const scary = e.burn[i] > 0 || ent.def.fears.some(t => oe.tags.has(t));
        if (scary) threat += dx >= 0 ? 1 : -1;
      }
    }
    if (threat === 0) return 0;
    return threat > 0 ? -1 : 1; // run away from the threat side
  }

  eat(ent) {
    if (!ent.def.eats.length) return;
    const e = this.engine;
    const cx = ent.x + (ent.dir === 1 ? ent.shape.w : -1);
    for (let dy = 0; dy < ent.shape.h; dy++) {
      const y = ent.y + dy;
      if (!e.inBounds(cx, y)) continue;
      const i = e.idx(cx, y);
      const o = e.cells[i];
      if (o === 0 || e.entityMap[i]) continue;
      const oe = e.reg.elements[o];
      if (ent.def.eats.some(t => oe.tags.has(t))) {
        e.setI(i, 0);
        ent.hp = Math.min(ent.hp + 4, ent.def.hp);
        return;
      }
    }
  }

  die(ent) {
    const e = this.engine;
    for (let k = 0; k < ent.placed.length; k++) {
      const i = ent.placed[k];
      if (e.entityMap[i] !== ent.idx + 1) continue;
      e.entityMap[i] = 0;
      if (ent.burning > 0) e.setI(i, e.rng() < 0.5 ? e.FIRE : e.ASH);
      else e.setI(i, e.rng() < 0.7 ? e.ASH : 0);
    }
    ent.alive = false;
    this.list[ent.idx] = null;
  }

  update() {
    const e = this.engine;
    for (const ent of this.list) {
      if (!ent || !ent.alive) continue;

      // deaths from accumulated damage
      const sub = this.submersion(ent);
      this.erase(ent);
      if (ent.hp <= 0) { ent.placed = []; this.finishDeath(ent); continue; }

      // burning: lose health, shed flames
      if (ent.burning > 0) {
        ent.burning--;
        ent.hp -= 0.5;
        if (sub > 0.4) ent.burning = 0; // water puts you out
      }

      // drowning for land creatures / drying out for aquatics
      if (sub > 0.8 && !ent.def.canSwim && !ent.def.aquatic) {
        ent.breath -= 4;
        if (ent.breath <= 0) ent.hp -= 1;
      } else if (ent.def.aquatic && sub < 0.2) {
        ent.breath -= 2;                 // fish out of water
        if (ent.breath <= 0) ent.hp -= 0.5;
      } else {
        ent.breath = Math.min(240, ent.breath + 6);
      }

      // behaviour: flee danger, otherwise wander
      const flee = this.senseDanger(ent);
      if (flee !== 0) ent.dir = flee;
      else if (e.rng() < 0.01) ent.dir = -ent.dir;

      const panic = ent.burning > 0 || flee !== 0;
      const speed = ent.def.speed * (panic ? 2.2 : 1);

      // vertical physics
      const inLiquid = sub > 0.3;
      if (ent.def.aquatic && inLiquid) {
        // swim freely
        if (e.rng() < 0.15) {
          const ny = ent.y + (e.rng() < 0.5 ? -1 : 1);
          if (this.areaPassable(ent, ent.x, ny)) ent.y = ny;
        }
      } else if (ent.flying && !inLiquid) {
        // flap around, mostly staying airborne
        if (e.rng() < 0.4) {
          const ny = ent.y + (e.rng() < 0.55 ? -1 : 1);
          if (this.areaPassable(ent, ent.x, ny)) ent.y = ny;
          else if (this.areaPassable(ent, ent.x, ent.y + 1)) ent.y++;
        }
      } else if (inLiquid && ent.def.canSwim) {
        // paddle up toward the surface
        if (e.rng() < 0.6 && this.areaPassable(ent, ent.x, ent.y - 1)) ent.y--;
      } else {
        // gravity
        let fell = 0;
        while (fell < 2 && this.areaPassable(ent, ent.x, ent.y + 1)) { ent.y++; fell++; }
        if (inLiquid && fell > 0) fell = 0; // sink slowly
      }

      // horizontal walking with 1-cell climbing
      ent.moveAcc += speed;
      while (ent.moveAcc >= 1) {
        ent.moveAcc -= 1;
        const nx = ent.x + ent.dir;
        if (this.areaPassable(ent, nx, ent.y)) ent.x = nx;
        else if (this.areaPassable(ent, nx, ent.y - 1)) { ent.x = nx; ent.y -= 1; }
        else if (this.areaPassable(ent, nx, ent.y - 2) && !ent.def.aquatic) { ent.x = nx; ent.y -= 2; }
        else { ent.dir = -ent.dir; break; }
      }

      this.place(ent);
      this.eat(ent);
      if (ent.hp <= 0) { this.finishDeath(ent); }
    }
  }

  finishDeath(ent) {
    if (ent.placed.length === 0) {
      // body already erased: re-place it briefly so it can decay into ash
      this.place(ent);
    }
    this.die(ent);
  }
}
