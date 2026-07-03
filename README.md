# Falling Sand Game — with an AI Particle Lab

A faithful recreation of the classic falling sand game (four ceiling streams,
drawable elements, the bottom-right control panel with live particle counters)
extended with:

- **~295 elements** — the full classic set plus hundreds of real-world
  materials: metals, acids, gases, foods, plants, explosives, cryogenics and
  living creatures.
- **An AI particle lab** — type any prompt ("cat", "molten uranium",
  "explosive rainbow dust") and a new particle is generated *following strict
  guidelines* so it always plugs into the world's physics.

## Running

No build step, no dependencies. Serve the folder statically (ES modules
require http://, not file://):

```bash
npm start            # python3 -m http.server 8000
# then open http://localhost:8000
```

## Playing

- **Draw** with the left mouse button; **right-click erases**.
- The four streams at the top pour sand / water / salt / oil, exactly like the
  original — change them with the dropdowns in the panel.
- The classic panel (bottom-right) has the original elements, pen size,
  speed control, Clear Screen and live element counters.
- The **Element Library** below the canvas has every element, searchable and
  filterable by state of matter.

## Physics

The engine is a cellular automaton in the style of the original game:
bottom-up scan with alternating direction, swap-based movement.

- **Powders** pile up, slide diagonally, and sink through lighter liquids.
- **Liquids** fall, disperse, and stratify by real density (mercury below
  water below oil; pumice floats).
- **Gases** rise or pool depending on density vs air (hydrogen rises,
  CO2 sinks and smothers fire).
- **Fire** spreads over anything with a flammability, produces smoke, and is
  extinguished by water. Explosives chain-detonate in shockwaves.
- A tag-based reaction layer produces realistic chemistry: acids corrode
  metal but not gold or glass (only aqua regia dissolves gold), sodium
  explodes in water, thermite burns into molten iron, liquid nitrogen
  flash-freezes, baking soda neutralizes vinegar into CO2, salt melts ice,
  styrofoam vanishes in acetone, electricity arcs along conductors and
  electrolyzes water...
- **Creatures** (cat, bird, fish, human...) are multi-cell entities that
  walk, fly, swim, climb, flee from what they fear, eat what they like, drown,
  burn to ash, and dissolve in acid.

## The AI particle lab

Type a prompt and press Generate. Two paths:

1. **LLM (optional)** — add an API key in "AI settings" and the prompt is sent
   to any OpenAI-compatible chat API. The model receives the guidelines
   (see below) and must answer with a single JSON particle spec.
2. **Built-in synthesizer (default, offline)** — a lexicon of animals,
   materials and modifiers plus a deterministic word-hash fallback, so *any*
   prompt yields a particle with no key at all.

Either way the candidate spec passes through a validator that enforces
**the guidelines**: whitelisted categories/tags/behaviors, clamped numeric
ranges, and verified element references. Because every field maps onto the
engine's generic physics, generated particles automatically interact
sensibly — a prompted "cat" walks around, flees fire, hates water and burns
to ash; a prompted "toxic purple gas" rises, poisons creatures and kills
plants. The full guidelines text is shown in-game under
"Particle guidelines".

## Tests

```bash
npm test
```

Headless Node suite (47 checks) covering the classic physics (sand sinks,
oil floats, plants grow, gunpowder chains), the library chemistry, the
creature layer and the AI generator/validator, plus a performance smoke test.

## Project layout

| File | Purpose |
| --- | --- |
| `js/registry.js` | Element definition schema, normalization, tag whitelist |
| `js/classic.js` | The original game's element set |
| `js/library.js` | ~270 additional real-world elements (data-driven) |
| `js/engine.js` | Cellular automaton: movement, burning, reactions, explosions |
| `js/creatures.js` | Multi-cell living entities (walk/fly/swim/flee/burn) |
| `js/ai.js` | Guidelines, validator, offline synthesizer, LLM client |
| `js/main.js` | UI wiring, streams, brush, counters, game loop |
| `test/run-tests.mjs` | Headless test suite |
