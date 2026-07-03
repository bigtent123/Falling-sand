/*
 * Cellular-automaton engine recreating the classic falling-sand physics:
 * bottom-up scan with alternating direction, swap-based movement, powders
 * that pile and sink, liquids that stratify by density, rising gases,
 * flickering fire, plus a generic tag-driven reaction layer so hundreds of
 * elements (and AI-generated ones) interact plausibly.
 */

import { CAT } from './registry.js';

const AIR_DENSITY = 0.0012;

export class Engine {
  constructor(reg, w, h) {
    this.reg = reg;
    this.w = w;
    this.h = h;
    const n = w * h;
    this.cells = new Uint16Array(n);   // element id
    this.burn = new Uint16Array(n);    // frames of burning remaining (0 = not burning)
    this.life = new Uint16Array(n);    // decay countdown for decaying elements
    this.aux = new Uint16Array(n);     // fall-streak (impact) or rest counter
    this.charge = new Uint8Array(n);   // electric charge overlay on conductors
    this.parity = new Uint8Array(n);   // frame parity to avoid double-moves
    this.entityMap = new Uint16Array(n); // entity index + 1 for creature cells
    this.frame = 0;
    this.rng = Math.random;
    this.entities = null;              // set by creatures module
    this.explosionQueue = [];
    this.counts = new Uint32Array(4096);
  }

  idx(x, y) { return y * this.w + x; }
  inBounds(x, y) { return x >= 0 && x < this.w && y >= 0 && y < this.h; }

  elAt(i) { return this.reg.elements[this.cells[i]]; }

  /* Place an element, initializing its per-cell state. */
  set(x, y, id) {
    if (!this.inBounds(x, y)) return;
    const i = this.idx(x, y);
    this.setI(i, id);
  }

  setI(i, id) {
    this.cells[i] = id;
    this.burn[i] = 0;
    this.aux[i] = 0;
    this.charge[i] = 0;
    this.entityMap[i] = 0;
    const el = this.reg.elements[id];
    if (el && el.decay) {
      const [a, b] = el.decay.life;
      this.life[i] = a + ((this.rng() * (b - a)) | 0);
    } else {
      this.life[i] = 0;
    }
  }

  clear() {
    this.cells.fill(0);
    this.burn.fill(0);
    this.life.fill(0);
    this.aux.fill(0);
    this.charge.fill(0);
    this.entityMap.fill(0);
    if (this.entities) this.entities.clear();
  }

  /* Swap two cells including their per-cell state. */
  swap(i, j) {
    const c = this.cells, b = this.burn, l = this.life, a = this.aux, e = this.entityMap;
    let t = c[i]; c[i] = c[j]; c[j] = t;
    t = b[i]; b[i] = b[j]; b[j] = t;
    t = l[i]; l[i] = l[j]; l[j] = t;
    t = a[i]; a[i] = a[j]; a[j] = t;
    t = e[i]; e[i] = e[j]; e[j] = t;
    this.parity[i] = this.parity[j] = this.frame & 1;
  }

  /* Can element `el` (falling) displace whatever is in cell j? */
  canSink(el, j) {
    const o = this.cells[j];
    if (o === 0) return true;
    if (this.entityMap[j]) return false;
    const oe = this.reg.elements[o];
    if (oe.cat === CAT.LIQUID || oe.cat === CAT.GAS) return el.density > oe.density;
    return false;
  }

  // ------------------------------------------------------------------ update

  update() {
    this.frame++;
    const p = this.frame & 1;
    const w = this.w, h = this.h, cells = this.cells;
    const ltr = (this.frame & 2) === 0;

    for (let y = h - 1; y >= 0; y--) {
      const row = y * w;
      for (let k = 0; k < w; k++) {
        const x = ltr ? k : w - 1 - k;
        const i = row + x;
        const id = cells[i];
        if (id === 0) { this.charge[i] = 0; continue; }
        if (this.parity[i] === p) continue;
        this.parity[i] = p;
        if (this.entityMap[i]) continue; // creature cells handled by entity layer

        const el = this.reg.elements[id];

        // charge fades
        if (this.charge[i] > 0) this.charge[i]--;

        // spontaneous decay (fire, smoke, steam...)
        if (el.decay) {
          if (this.life[i] > 0) this.life[i]--;
          if (this.life[i] === 0) { this.setI(i, el.decay.intoId); continue; }
        }

        // burning
        if (this.burn[i] > 0 && this.stepBurn(i, x, y, el)) continue;

        // reactions with neighbors (only for elements that can react)
        if (el.reactive && this.stepReactions(i, x, y, el)) continue;

        // emitters
        if (el.emit) this.stepEmit(i, x, y, el);

        // movement
        switch (el.cat) {
          case CAT.POWDER: this.movePowder(i, x, y, el); break;
          case CAT.SOLID: this.moveSolid(i, x, y, el); break;
          case CAT.LIQUID: this.moveLiquid(i, x, y, el); break;
          case CAT.GAS: this.moveGas(i, x, y, el); break;
          case CAT.ENERGY: this.moveEnergy(i, x, y, el); break;
        }
      }
    }

    // deferred explosions (chained detonations propagate as a wave)
    if (this.explosionQueue.length) {
      const q = this.explosionQueue;
      this.explosionQueue = [];
      for (const [ex, ey, r] of q) this.explodeNow(ex, ey, r);
    }

    if (this.entities) this.entities.update();
  }

  // ------------------------------------------------------------ movement

  movePowder(i, x, y, el) {
    const w = this.w;
    if (y + 1 < this.h) {
      const below = i + w;
      if (this.cells[below] === 0) { this.swap(i, below); this.bumpStreak(below); return; }
      if (this.canSink(el, below) && this.rng() < 0.4) { this.swap(i, below); this.bumpStreak(below); return; }
      if (el.slide) {
        const d = this.rng() < 0.5 ? 1 : -1;
        for (const dx of [d, -d]) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          const diag = below + dx;
          const side = i + dx;
          if ((this.cells[side] === 0 || this.isFluid(side)) && this.canSink(el, diag)) {
            this.swap(i, diag); this.bumpStreak(diag); return;
          }
        }
      }
    }
    this.landed(i, el);
  }

  moveSolid(i, x, y, el) {
    // classic STONE: falls straight down only
    if (y + 1 < this.h) {
      const below = i + this.w;
      if (this.canSink(el, below)) { this.swap(i, below); this.bumpStreak(below); return; }
    }
    this.landed(i, el);
  }

  moveLiquid(i, x, y, el) {
    const w = this.w;
    if (el.viscosity > 0 && this.rng() < el.viscosity) { this.landed(i, el); return; }

    if (y + 1 < this.h) {
      const below = i + w;
      if (this.cells[below] === 0) { this.swap(i, below); this.bumpStreak(below); return; }
      if (this.canSink(el, below) && this.rng() < 0.55) { this.swap(i, below); this.bumpStreak(below); return; }
      const d = this.rng() < 0.5 ? 1 : -1;
      for (const dx of [d, -d]) {
        const nx = x + dx;
        if (nx < 0 || nx >= w) continue;
        if (this.canSink(el, below + dx) && this.cells[i + dx] === 0) {
          this.swap(i, below + dx); this.bumpStreak(below + dx); return;
        }
      }
    }
    // buoyancy: lighter liquid below denser liquid rises
    if (y > 0) {
      const above = i - w;
      const oa = this.cells[above];
      if (oa !== 0 && !this.entityMap[above]) {
        const oe = this.reg.elements[oa];
        if (oe.cat === CAT.LIQUID && oe.density > el.density && this.rng() < 0.4) {
          this.swap(i, above); return;
        }
      }
    }
    // horizontal dispersion
    const run = Math.max(1, Math.round(5 * (1 - el.viscosity)));
    const dir = this.rng() < 0.5 ? 1 : -1;
    let moved = 0, j = i;
    for (let s = 1; s <= run; s++) {
      const nx = x + dir * s;
      if (nx < 0 || nx >= w) break;
      const nj = i + dir * s;
      if (this.cells[nj] === 0) { j = nj; moved = s; }
      else break;
    }
    if (moved > 0) { this.swap(i, j); return; }
    this.landed(i, el);
  }

  moveGas(i, x, y, el) {
    const w = this.w;
    const rises = el.density < AIR_DENSITY;
    const vy = rises ? -1 : 1;
    const r = this.rng();
    let dx = 0, dy = 0;
    if (r < 0.55) { dy = vy; dx = (this.rng() * 3 | 0) - 1; }
    else if (r < 0.9) { dx = this.rng() < 0.5 ? 1 : -1; }
    else { dy = -vy; }
    const nx = x + dx, ny = y + dy;
    if (!this.inBounds(nx, ny)) return;
    const j = this.idx(nx, ny);
    const o = this.cells[j];
    if (o === 0) { this.swap(i, j); return; }
    if (this.entityMap[j]) return;
    const oe = this.reg.elements[o];
    // gases bubble up through liquids; heavier gases sink below lighter ones
    if (oe.cat === CAT.LIQUID && dy === -1) { if (this.rng() < 0.5) this.swap(i, j); return; }
    if (oe.cat === CAT.GAS && ((dy === -1 && el.density < oe.density) || (dy === 1 && el.density > oe.density))) {
      this.swap(i, j);
    }
  }

  moveEnergy(i, x, y, el) {
    if (el.spark) { this.moveSpark(i, x, y, el); return; }
    let clings = false;
    if (el.tags.has('hot')) {
      // hot energy (fire) actively ignites its neighbors...
      if (y > 0) clings = this.fireTouch(i - this.w) || clings;
      if (y + 1 < this.h) clings = this.fireTouch(i + this.w) || clings;
      if (x > 0) clings = this.fireTouch(i - 1) || clings;
      if (x + 1 < this.w) clings = this.fireTouch(i + 1) || clings;
    }
    // ...and clings to flammable surfaces instead of floating away
    if (clings && this.rng() < 0.9) return;
    // fire-like: flickers upward
    const r = this.rng();
    let dx = (this.rng() * 3 | 0) - 1, dy = r < 0.72 ? -1 : (r < 0.92 ? 0 : 1);
    const nx = x + dx, ny = y + dy;
    if (!this.inBounds(nx, ny)) { this.setI(i, 0); return; }
    const j = this.idx(nx, ny);
    if (this.cells[j] === 0) this.swap(i, j);
  }

  moveSpark(i, x, y, el) {
    // electricity: hops along conductors, electrolyzes water, zaps creatures
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    const conductors = [];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (!this.inBounds(nx, ny)) continue;
      const j = this.idx(nx, ny);
      const o = this.cells[j];
      if (o === 0) continue;
      if (this.entityMap[j]) { this.entities?.damage(this.entityMap[j] - 1, 12, 'shock'); continue; }
      const oe = this.reg.elements[o];
      if (oe.conductive && this.charge[j] === 0) conductors.push(j);
      if (oe.tags.has('wet') && this.rng() < 0.02) {
        // electrolysis: split water
        this.setI(j, this.rng() < 0.66 ? (this.reg.id('hydrogen') > 0 ? this.reg.id('hydrogen') : 0)
                                       : (this.reg.id('oxygen') > 0 ? this.reg.id('oxygen') : 0));
      }
      if (oe.flamm > 0 && this.rng() < oe.flamm * 0.5) this.ignite(j);
      if (oe.explosive && oe.explosive.byShock && this.rng() < 0.4) this.queueExplosion(nx, ny, oe.explosive.r);
    }
    if (conductors.length) {
      const j = conductors[(this.rng() * conductors.length) | 0];
      this.charge[j] = 8;
      // relocate the spark to an empty cell adjacent to the charged conductor
      const jy = (j / this.w) | 0, jx = j % this.w;
      for (let t = 0; t < 4; t++) {
        const [dx, dy] = dirs[(this.rng() * 8) | 0];
        const nx = jx + dx, ny = jy + dy;
        if (!this.inBounds(nx, ny)) continue;
        const k = this.idx(nx, ny);
        if (this.cells[k] === 0) { this.swap(i, k); return; }
      }
    }
    // otherwise drift like a short-lived arc
    const nx = x + ((this.rng() * 3 | 0) - 1), ny = y + ((this.rng() * 3 | 0) - 1);
    if (this.inBounds(nx, ny)) {
      const j = this.idx(nx, ny);
      if (this.cells[j] === 0) this.swap(i, j);
    }
  }

  /* Fire touching cell j: try to ignite it. Returns true if it is fuel. */
  fireTouch(j) {
    const o = this.cells[j];
    if (o === 0) return false;
    if (this.entityMap[j]) { this.entities?.damage(this.entityMap[j] - 1, 2, 'fire'); return false; }
    const oe = this.reg.elements[o];
    if (oe.flamm <= 0 || oe.tags.has('fireproof')) return false;
    if (this.burn[j] === 0 && this.rng() < oe.flamm) this.ignite(j);
    return true;
  }

  isFluid(j) {
    const o = this.cells[j];
    if (o === 0) return false;
    const c = this.reg.elements[o].cat;
    return c === CAT.LIQUID || c === CAT.GAS;
  }

  bumpStreak(i) {
    const el = this.elAt(i);
    if (el.explosive && el.explosive.byImpact) {
      if (this.aux[i] < 60000) this.aux[i]++;
    } else if (el.rest) {
      this.aux[i] = 0; // still moving: not settling yet
    }
  }

  landed(i, el) {
    // impact detonation (nitro)
    if (el.explosive && el.explosive.byImpact && this.aux[i] > 4) {
      const y = (i / this.w) | 0, x = i % this.w;
      this.queueExplosion(x, y, el.explosive.r);
      return;
    }
    this.aux[i] = el.explosive && el.explosive.byImpact ? 0 : this.aux[i];
    // settling (concrete, molten wax)
    if (el.rest) {
      this.aux[i]++;
      if (this.aux[i] >= el.rest.after) {
        const b = this.burn[i];
        this.setI(i, el.rest.intoId);
        this.burn[i] = b;
      }
    }
  }

  // ------------------------------------------------------------ burning

  ignite(i) {
    const el = this.elAt(i);
    if (el.flamm <= 0 || el.tags.has('fireproof') || this.burn[i] > 0) return;
    if (el.explosive && el.explosive.byFire) {
      // fuse-delay before detonation
      this.burn[i] = Math.max(1, el.burnTime);
      return;
    }
    this.burn[i] = el.burnTime;
  }

  stepBurn(i, x, y, el) {
    this.burn[i]--;
    if (el.explosive && el.explosive.byFire && this.burn[i] === 0) {
      this.queueExplosion(x, y, el.explosive.r);
      return true;
    }
    // spread to flammable neighbors + shed flames and smoke
    const w = this.w;
    const neigh = [];
    if (y > 0) neigh.push(i - w);
    if (y < this.h - 1) neigh.push(i + w);
    if (x > 0) neigh.push(i - 1);
    if (x < w - 1) neigh.push(i + 1);
    for (const j of neigh) {
      const o = this.cells[j];
      if (o === 0) {
        if (this.rng() < 0.12 && j === i - w) this.setI(j, this.FIRE);
        else if (this.rng() < el.burnSmoke * 0.05) this.setI(j, this.SMOKE);
        continue;
      }
      if (this.entityMap[j]) { this.entities?.damage(this.entityMap[j] - 1, 2, 'fire'); continue; }
      const oe = this.reg.elements[o];
      if (oe.flamm > 0 && this.burn[j] === 0 && this.rng() < oe.flamm * 0.35) this.ignite(j);
      // water & wet things put fires out
      if (oe.tags.has('wet') && this.rng() < 0.45) {
        this.burn[i] = 0;
        if (this.rng() < 0.3) this.setI(j, this.STEAM);
        return false;
      }
    }
    if (this.burn[i] === 0) {
      const y0 = (i / w) | 0;
      if (this.rng() < el.burnSmoke && y0 > 0 && this.cells[i - w] === 0) this.setI(i - w, this.SMOKE);
      this.setI(i, el.burnIntoId);
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------ reactions

  stepReactions(i, x, y, el) {
    const w = this.w;
    const neigh = [];
    if (y > 0) neigh.push(i - w);
    if (y < this.h - 1) neigh.push(i + w);
    if (x > 0) neigh.push(i - 1);
    if (x < w - 1) neigh.push(i + 1);

    for (const j of neigh) {
      const o = this.cells[j];

      // sinks eat neighbors
      if (el.sink && o !== 0 && !this.entityMap[j]) {
        const oe = this.reg.elements[o];
        if (el.sink === 'all' || (el.sink === 'liquid' && oe.cat === CAT.LIQUID) ||
            (el.sink === 'powder' && oe.cat === CAT.POWDER)) {
          this.setI(j, 0);
          continue;
        }
      }
      if (o === 0) continue;

      if (this.entityMap[j]) {
        // creatures take contact damage from hostile substances
        const eid = this.entityMap[j] - 1;
        if (el.corrosive > 0) this.entities?.damage(eid, 4, 'acid');
        if (el.tox > 0 && this.rng() < el.tox * 0.4) this.entities?.damage(eid, 2, 'poison');
        if (el.tags.has('hot') || el.tags.has('magma') || this.burn[i] > 0) this.entities?.damage(eid, 3, 'fire');
        if (el.tags.has('cryo')) this.entities?.damage(eid, 2, 'cold');
        if (el.tags.has('radioactive') && this.rng() < 0.1) this.entities?.damage(eid, 1, 'radiation');
        continue;
      }

      const oe = this.reg.elements[o];
      const hotN = oe.tags.has('hot') || oe.tags.has('magma') || this.burn[j] > 0 || this.charge[j] > 0;

      // ignition by hot neighbors
      if (hotN && el.flamm > 0 && this.burn[i] === 0 && !el.tags.has('fireproof') && this.rng() < el.flamm * 0.4) {
        this.ignite(i);
      }

      // heat/cold phase changes
      if (hotN && el.hotIntoId >= 0 && this.rng() < el.hotP) { this.morph(i, el.hotIntoId); return true; }
      if (oe.tags.has('magma') && el.magmaIntoId >= 0 && this.rng() < el.magmaP) { this.morph(i, el.magmaIntoId); return true; }
      const coldN = oe.tags.has('cold') || oe.tags.has('cryo');
      if (coldN && el.coldIntoId >= 0 && this.rng() < el.coldP) { this.morph(i, el.coldIntoId); return true; }
      if (oe.tags.has('cryo') && el.cryoIntoId >= 0 && this.rng() < el.cryoP) { this.morph(i, el.cryoIntoId); return true; }

      // corrosion (acid)
      if (el.corrosive > 0 && !oe.indestructible && !oe.tags.has('acidproof') && !oe.tags.has('glassy') && oe.corrosive === 0) {
        if (oe.tags.has('base')) {
          // neutralization -> salt + water
          this.setI(i, this.reg.id('salt water') > 0 ? this.reg.id('salt water') : 0);
          this.setI(j, this.SMOKE);
          return true;
        }
        let pr = el.corrosive * (oe.tags.has('organic') ? 0.5 :
                 oe.tags.has('metal') ? 0.25 : oe.tags.has('stone') ? 0.02 : 0.12);
        if (this.rng() < pr) {
          this.setI(j, this.rng() < 0.15 ? this.SMOKE : 0);
          if (this.rng() < 0.2) this.setI(i, 0); // acid is consumed
          continue;
        }
      }

      // toxics kill plants & other life
      if (el.tox > 0 && oe.tags.has('life') && this.rng() < el.tox * 0.15) this.setI(j, 0);

      // radiation kills/mutates life nearby
      if (el.tags.has('radioactive') && oe.tags.has('life') && this.rng() < 0.02) {
        this.setI(j, this.rng() < 0.5 ? 0 : this.ASH);
      }

      // dissolving (salt in water, sugar in water...)
      for (const d of el.dissolve) {
        const match = d.tag ? oe.tags.has(d.tag) : o === d.inId;
        if (match && this.rng() < d.p) {
          this.setI(i, d.intoId);
          if (d.otherIntoId >= 0) this.setI(j, d.otherIntoId);
          return true;
        }
      }

      // custom pair reactions
      for (const r of el.reactions) {
        const match = r.tag ? oe.tags.has(r.tag) : o === r.withId;
        if (match && this.rng() < r.p) {
          if (r.explode > 0) { this.queueExplosion(x, y, r.explode); return true; }
          if (r.otherId >= 0) this.setI(j, r.otherId);
          if (r.spawnId > 0) this.spawnNear(x, y, r.spawnId);
          if (r.selfId >= 0) { this.morph(i, r.selfId); return true; }
        }
      }

      // growth (plant through water, mold across organics...)
      if (el.grow && o !== el.id && oe.cat !== CAT.CREATURE) {
        const match = el.grow.ids.includes(o) || el.grow.tags.some(t => oe.tags.has(t));
        if (match && this.rng() < el.grow.p) this.setI(j, el.id);
      }
    }
    return false;
  }

  morph(i, id) {
    const em = this.entityMap[i];
    this.setI(i, id);
    this.entityMap[i] = em;
  }

  spawnNear(x, y, id) {
    for (let t = 0; t < 4; t++) {
      const nx = x + ((this.rng() * 3 | 0) - 1), ny = y + ((this.rng() * 3 | 0) - 1);
      if (!this.inBounds(nx, ny)) continue;
      const j = this.idx(nx, ny);
      if (this.cells[j] === 0) { this.setI(j, id); return; }
    }
  }

  stepEmit(i, x, y, el) {
    if (this.rng() > el.emit.rate) return;
    let targets;
    if (el.emit.dir === 'down') targets = [[0, 1], [-1, 1], [1, 1]];
    else if (el.emit.dir === 'up') targets = [[0, -1], [-1, -1], [1, -1]];
    else targets = [[0, 1], [0, -1], [-1, 0], [1, 0]];
    const [dx, dy] = targets[(this.rng() * targets.length) | 0];
    const nx = x + dx, ny = y + dy;
    if (!this.inBounds(nx, ny)) return;
    const j = this.idx(nx, ny);
    if (this.cells[j] === 0) this.setI(j, el.emit.whatId);
  }

  // ------------------------------------------------------------ explosions

  queueExplosion(x, y, r) {
    this.setI(this.idx(x, y), 0);
    this.explosionQueue.push([x, y, r]);
  }

  explodeNow(cx, cy, r) {
    const r2 = r * r;
    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= this.h) continue;
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= this.w) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) continue;
        const i = this.idx(x, y);
        if (this.entityMap[i]) { this.entities?.damage(this.entityMap[i] - 1, 60, 'blast'); continue; }
        const o = this.cells[i];
        if (o !== 0) {
          const oe = this.reg.elements[o];
          if (oe.indestructible) continue;
          if (oe.explosive && d2 > 1) {
            // chain reaction: neighbors detonate next frame -> shockwave
            this.explosionQueue.push([x, y, oe.explosive.r]);
            this.setI(i, 0);
            continue;
          }
        }
        const rr = this.rng();
        const edge = d2 / r2;
        if (rr < 0.55 - edge * 0.3) this.setI(i, this.FIRE);
        else if (rr < 0.7) this.setI(i, this.SMOKE);
        else this.setI(i, 0);
      }
    }
  }

  // ------------------------------------------------------------ brush

  paint(cx, cy, radius, id) {
    const r = Math.max(0, radius - 1);
    const r2 = r * r;
    const creature = id > 0 && this.reg.elements[id].cat === CAT.CREATURE;
    if (creature) {
      this.entities?.spawn(cx, cy, id);
      return;
    }
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        const x = cx + dx, y = cy + dy;
        if (!this.inBounds(x, y)) continue;
        const i = this.idx(x, y);
        if (this.entityMap[i]) continue;
        if (id === 0) { this.setI(i, 0); continue; }
        // classic behaviour: draw only over empty space (except walls/static)
        if (this.cells[i] === 0 || this.reg.elements[id].cat === CAT.STATIC) this.setI(i, id);
      }
    }
  }

  line(x0, y0, x1, y1, radius, id) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const steps = Math.max(dx, dy, 1);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      this.paint(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), radius, id);
    }
  }

  /* Cache commonly used ids after the registry is populated. */
  cacheIds() {
    this.FIRE = Math.max(0, this.reg.id('fire'));
    this.SMOKE = Math.max(0, this.reg.id('smoke'));
    this.STEAM = Math.max(0, this.reg.id('steam'));
    this.ASH = Math.max(0, this.reg.id('ash'));
    // precompute per-element "reactive" flag so inert cells skip the reaction pass
    for (const el of this.reg.elements) {
      el.reactive = !!(el.flamm > 0 || el.hotIntoId >= 0 || el.magmaIntoId >= 0 ||
        el.coldIntoId >= 0 || el.cryoIntoId >= 0 || el.dissolve.length ||
        el.reactions.length || el.grow || el.sink || el.corrosive > 0 ||
        el.tox > 0 || el.tags.has('radioactive'));
    }
  }

  // ------------------------------------------------------------ render

  render(imgData) {
    const data = imgData.data;
    const cells = this.cells, n = cells.length;
    const els = this.reg.elements;
    this.counts.fill(0);
    for (let i = 0; i < n; i++) {
      const id = cells[i];
      const o = i * 4;
      if (id === 0) {
        data[o] = 0; data[o + 1] = 0; data[o + 2] = 0; data[o + 3] = 255;
        continue;
      }
      this.counts[id]++;
      const el = els[id];
      let c;
      if (this.burn[i] > 0) {
        // burning cells flicker orange/red
        const f = this.rng();
        c = f < 0.4 ? [255, 106, 0] : f < 0.7 ? [255, 160, 32] : [224, 48, 0];
      } else if (this.charge[i] > 0) {
        c = [255, 255, 160];
      } else {
        const v = el.shimmer ? (this.rng() * el.colors.length) | 0
                             : (i * 2654435761 >>> 8) % el.colors.length;
        c = el.colors[v];
      }
      data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
    }
  }
}
