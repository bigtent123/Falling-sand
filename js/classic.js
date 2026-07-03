/*
 * The classic falling-sand element set, recreating the behaviour of the
 * original game: the four ceiling streams (sand / water / salt / oil) plus
 * the drawable tools (plant, fire, torch, spout, wall, wax, nitro, napalm,
 * gunpowder, C-4, concrete, fuse, ice, lava, stone, void...).
 */

export function defineClassicElements(reg) {
  // --- support products first so later refs resolve -------------------
  reg.define({
    name: 'Smoke', cat: 'gas', colors: ['#3c3c3c', '#4a4a4a', '#2e2e2e'],
    density: 0.0008, decay: { life: [40, 160], into: '' }, tags: []
  });
  reg.define({
    name: 'Steam', cat: 'gas', colors: ['#b8c4cc', '#cdd7dd', '#a5b2ba'],
    density: 0.0006, decay: { life: [180, 420], into: 'water' },
    cryoInto: 'water', cryoP: 1, tags: ['wet']
  });
  reg.define({
    name: 'Ash', cat: 'powder', colors: ['#9a9a92', '#87877f', '#75756d'],
    density: 0.6, tags: []
  });

  // --- the four streams ------------------------------------------------
  reg.define({
    name: 'Sand', cat: 'powder', colors: ['#eecc80', '#e0c080', '#d4b06a', '#c9a75f'],
    density: 1.6, tags: ['stone'],
    magmaInto: 'glass', magmaP: 0.02, // vitrifies under extreme heat
    desc: 'Classic falling sand. Piles up, sinks in water.'
  });
  reg.define({
    name: 'Water', cat: 'liquid', colors: ['#2048ff', '#2c54ff', '#1a3ef0'],
    density: 1.0, tags: ['wet'],
    hotInto: 'steam', hotP: 0.08, coldInto: 'ice', coldP: 0.02, cryoInto: 'ice', cryoP: 0.9,
    desc: 'Flows, extinguishes fire, freezes and boils.'
  });
  reg.define({
    name: 'Salt', cat: 'powder', colors: ['#f8f8f8', '#efefef', '#e4e4e8'],
    density: 1.2, tags: ['salty'],
    dissolve: [{ in: 'water', into: '', otherInto: 'salt water', p: 0.35 }],
    desc: 'Dissolves in water, melts ice.'
  });
  reg.define({
    name: 'Oil', cat: 'liquid', colors: ['#5c4a1e', '#514018', '#463712'],
    density: 0.9, tags: ['organic'],
    flamm: 0.45, burnTime: 260, burnInto: '', burnSmoke: 0.5,
    desc: 'Floats on water, burns fiercely.'
  });
  reg.define({
    name: 'Salt Water', cat: 'liquid', colors: ['#4f78ff', '#5a80f8', '#4468e8'],
    density: 1.05, tags: ['wet', 'salty'],
    hotInto: 'steam', hotP: 0.07, cryoInto: 'ice', cryoP: 0.7,
    reactions: [{ with: '#hot', p: 0.02, self: 'steam', spawn: 'salt' }],
    desc: 'Denser than fresh water. Boiling it leaves salt behind.'
  });

  // --- energy ----------------------------------------------------------
  reg.define({
    name: 'Fire', cat: 'energy', colors: ['#ff6a00', '#ffa020', '#ffd040', '#e03000'],
    density: 0.0005, glow: true, tags: ['hot'],
    decay: { life: [24, 70], into: '' },
    reactions: [{ with: '#wet', p: 0.9, self: '', other: null }],
    desc: 'Rises and flickers, ignites anything flammable.'
  });
  reg.define({
    name: 'Lava', cat: 'liquid', colors: ['#ff4400', '#ff6a10', '#e83800', '#c93000'],
    density: 2.8, viscosity: 0.75, glow: true, tags: ['hot', 'magma'],
    coldInto: 'stone', coldP: 0.4, cryoInto: 'stone', cryoP: 1,
    reactions: [{ with: '#wet', p: 0.65, self: 'stone', other: 'steam' }],
    desc: 'Molten rock. Ignites, melts metal, cools into stone on water.'
  });

  // --- static tools ------------------------------------------------------
  reg.define({
    name: 'Wall', cat: 'static', colors: ['#808080', '#8a8a8a', '#767676'],
    tags: ['stone', 'fireproof', 'acidproof'], desc: 'Indestructible barrier.'
  });
  reg.define({
    name: 'Torch', cat: 'static', colors: ['#b04000', '#c25010'],
    tags: ['hot', 'fireproof'], emit: { what: 'fire', rate: 0.4, dir: 'all' },
    desc: 'Never stops burning.'
  });
  reg.define({
    name: 'Spout', cat: 'static', colors: ['#7090b0', '#7d9cba'],
    tags: ['fireproof'], emit: { what: 'water', rate: 0.35, dir: 'down' },
    desc: 'Endless water source.'
  });
  reg.define({
    name: 'Oil Well', cat: 'static', colors: ['#4a3c14', '#55461a'],
    tags: ['fireproof'], emit: { what: 'oil', rate: 0.25, dir: 'down' },
    desc: 'Endless oil source.'
  });
  reg.define({
    name: 'Void', cat: 'static', colors: ['#1c1024', '#241430'],
    tags: ['fireproof', 'acidproof'], sink: 'all',
    desc: 'Consumes everything that touches it.'
  });

  // --- plant -------------------------------------------------------------
  reg.define({
    name: 'Plant', cat: 'static', colors: ['#10a010', '#20b020', '#0c8c0c'],
    tags: ['organic', 'life'],
    flamm: 0.55, burnTime: 60, burnInto: '', burnSmoke: 0.3,
    grow: { on: ['water'], p: 0.35 },
    reactions: [{ with: '#salty', p: 0.015, self: '', other: null },
                { with: '#toxic', p: 0.05, self: '', other: null }],
    desc: 'Grows through water. Burns. Salt kills it.'
  });

  // --- wax / candle ------------------------------------------------------
  reg.define({
    name: 'Wax', cat: 'static', colors: ['#f0e6c8', '#e8dcba', '#dfd2ac'],
    tags: ['organic'],
    flamm: 0.03, burnTime: 700, burnInto: '', burnSmoke: 0.1,
    hotInto: 'falling wax', hotP: 0.18,
    desc: 'Burns slowly like a candle, melts near heat.'
  });
  reg.define({
    name: 'Falling Wax', cat: 'liquid', colors: ['#e6d8ae', '#ddcda0'],
    density: 0.95, viscosity: 0.6, tags: ['organic'],
    flamm: 0.03, burnTime: 500, burnInto: '',
    rest: { after: 70, into: 'wax' },
    desc: 'Molten wax. Solidifies when it settles.'
  });

  // --- explosives ----------------------------------------------------------
  reg.define({
    name: 'Gunpowder', cat: 'powder', colors: ['#3a3a3a', '#464646', '#2e2e2e'],
    density: 1.7, tags: ['explosive'],
    flamm: 0.85, burnTime: 4, burnInto: '',
    explosive: { r: 7, byFire: true, byImpact: false, byShock: true },
    desc: 'Blows up at the slightest spark.'
  });
  reg.define({
    name: 'Nitro', cat: 'liquid', colors: ['#30d030', '#28c028', '#3adf3a'],
    density: 1.6, tags: ['explosive'],
    flamm: 0.9, burnTime: 2, burnInto: '',
    explosive: { r: 9, byFire: true, byImpact: true, byShock: true },
    desc: 'Unstable liquid explosive. Detonates on hard impact.'
  });
  reg.define({
    name: 'Napalm', cat: 'liquid', colors: ['#d0682a', '#c85e22', '#dd7434'],
    density: 0.9, viscosity: 0.4, tags: ['organic', 'sticky'],
    flamm: 0.95, burnTime: 900, burnInto: '', burnSmoke: 0.7,
    desc: 'Sticky fuel that burns and burns and burns.'
  });
  reg.define({
    name: 'C-4', cat: 'static', colors: ['#f0e0b0', '#e8d8a4'],
    tags: ['explosive'],
    flamm: 0.2, burnTime: 3, burnInto: '',
    explosive: { r: 13, byFire: true, byImpact: false, byShock: true },
    desc: 'Stable plastic explosive. Needs flame or shock, not impact.'
  });
  reg.define({
    name: 'Fuse', cat: 'static', colors: ['#9a7850', '#8d6c46'],
    tags: ['organic'],
    flamm: 1, burnTime: 6, burnInto: '', burnSmoke: 0.05,
    desc: 'Carries a flame along a line.'
  });

  // --- building ------------------------------------------------------------
  reg.define({
    name: 'Concrete', cat: 'powder', colors: ['#a8a8a8', '#9d9d9d', '#b2b2b2'],
    density: 2.2, tags: ['stone'],
    rest: { after: 90, into: 'wall' },
    desc: 'Pours like powder, then sets rock solid.'
  });
  reg.define({
    name: 'Stone', cat: 'solid', colors: ['#7a7a7a', '#707070', '#848484'],
    density: 2.6, tags: ['stone'],
    magmaInto: 'lava', magmaP: 0.003,
    desc: 'Falls straight down in solid chunks.'
  });
  reg.define({
    name: 'Ice', cat: 'static', colors: ['#a8d8f8', '#bce2fa', '#98ccf0'],
    tags: ['cold', 'wet'],
    hotInto: 'water', hotP: 0.35,
    reactions: [{ with: '#salty', p: 0.06, self: 'water', other: null }],
    desc: 'Freezes nearby water. Melts near heat, salt eats through it.'
  });
  reg.define({
    name: 'Glass', cat: 'static', colors: ['#c2dce4', '#cfe6ec', '#b4d2dc'],
    tags: ['glassy', 'acidproof'],
    magmaInto: 'molten glass', magmaP: 0.01,
    desc: 'Made by super-heating sand. Acid-proof.'
  });
  reg.define({
    name: 'Molten Glass', cat: 'liquid', colors: ['#ffb060', '#ffc070'],
    density: 2.5, viscosity: 0.8, glow: true, tags: ['hot'],
    rest: { after: 60, into: 'glass' },
    desc: 'Glowing liquid glass. Hardens as it cools.'
  });

  reg.resolveAll();
}

/* Names used for the classic panel buttons, in original panel order. */
export const CLASSIC_PANEL = [
  'sand', 'water', 'salt', 'oil',
  'fire', 'plant', 'spout', 'wall',
  'torch', 'gunpowder', 'wax', 'falling wax',
  'nitro', 'napalm', 'c-4', 'concrete',
  'fuse', 'ice', 'lava', 'stone',
  'oil well', 'void', 'glass', 'steam'
];
