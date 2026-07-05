import { Registry, CAT } from './registry.js';
import { defineClassicElements, CLASSIC_PANEL } from './classic.js';
import { defineLibraryElements } from './library.js';
import { Engine } from './engine.js';
import { Entities } from './creatures.js';
import { GUIDELINES, generateParticle } from './ai.js';

// ------------------------------------------------------------------- setup

const GRID_W = 480, GRID_H = 320, SCALE = 2;

const reg = new Registry();
defineClassicElements(reg);
defineLibraryElements(reg);

const engine = new Engine(reg, GRID_W, GRID_H);
new Entities(engine);
engine.cacheIds();

const canvas = document.getElementById('game');
canvas.width = GRID_W * SCALE;
canvas.height = GRID_H * SCALE;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const off = document.createElement('canvas');
off.width = GRID_W; off.height = GRID_H;
const offCtx = off.getContext('2d');
const imgData = offCtx.createImageData(GRID_W, GRID_H);

// ---------------------------------------------------------------- streams

// The four classic ceiling streams: sand, water, salt, oil.
const streams = [
  { el: 'sand', x: 1 / 5 },
  { el: 'water', x: 2 / 5 },
  { el: 'salt', x: 3 / 5 },
  { el: 'oil', x: 4 / 5 }
];

function runStreams() {
  for (const s of streams) {
    if (!s.el) continue;
    const id = reg.id(s.el);
    if (id <= 0) continue;
    const cx = Math.round(GRID_W * s.x);
    for (let dx = -3; dx <= 3; dx++) {
      if (Math.random() < 0.35) {
        const i = engine.idx(cx + dx, 0);
        if (engine.cells[i] === 0) engine.setI(i, id);
      }
    }
  }
}

// ------------------------------------------------------------------- state

let selected = reg.id('sand');
let penSize = 4;
let speed = 1;
let paused = false;
let speedAcc = 0;

// ------------------------------------------------------------ UI: palette

const classicBox = document.getElementById('classic-buttons');
const libList = document.getElementById('lib-list');
const elDesc = document.getElementById('el-desc');
const aiCreated = document.getElementById('ai-created');

function selectElement(id) {
  selected = id;
  document.querySelectorAll('#classic-buttons button, #lib-list button, #ai-created button')
    .forEach(b => b.classList.toggle('sel', Number(b.dataset.id) === id));
  const el = reg.elements[id];
  elDesc.textContent = el ? `${el.name} — ${el.desc || 'no description'}` : '';
}

function makeElButton(el, withSwatch) {
  const b = document.createElement('button');
  b.dataset.id = el.id;
  b.type = 'button';
  if (withSwatch) {
    const sw = document.createElement('span');
    sw.className = 'swatch';
    const [r, g, bl] = el.colors[0];
    sw.style.background = `rgb(${r},${g},${bl})`;
    b.appendChild(sw);
  }
  b.appendChild(document.createTextNode(el.name.toUpperCase()));
  if (el.ai) b.classList.add('ai-made');
  b.addEventListener('click', () => selectElement(el.id));
  return b;
}

// classic panel: eraser + original elements
{
  const eraser = document.createElement('button');
  eraser.dataset.id = 0;
  eraser.textContent = 'ERASER';
  eraser.type = 'button';
  eraser.addEventListener('click', () => selectElement(0));
  classicBox.appendChild(eraser);
  for (const name of CLASSIC_PANEL) {
    const el = reg.get(name);
    if (el) classicBox.appendChild(makeElButton(el, false));
  }
}

// stream dropdowns
document.querySelectorAll('select.stream').forEach(sel => {
  const i = Number(sel.dataset.i);
  const options = ['off', 'sand', 'water', 'salt', 'oil', 'gunpowder', 'lava', 'snow',
    'gasoline', 'liquid nitrogen', 'sulfuric acid', 'honey', 'mercury', 'gravel', 'seed', 'nitro'];
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o.toUpperCase();
    sel.appendChild(opt);
  }
  sel.value = streams[i].el;
  sel.addEventListener('change', () => { streams[i].el = sel.value === 'off' ? null : sel.value; });
});

// ------------------------------------------------------------ UI: library

const libSearch = document.getElementById('lib-search');
const libCat = document.getElementById('lib-cat');

function refreshLibrary() {
  const q = libSearch.value.trim().toLowerCase();
  const cat = libCat.value;
  libList.innerHTML = '';
  let shown = 0;
  for (const el of reg.paletteList()) {
    if (el.id === 0) continue;
    if (q && !el.key.includes(q)) continue;
    if (cat !== 'all') {
      if (cat === 'ai') { if (!el.ai) continue; }
      else if (el.cat !== Number(cat)) continue;
    }
    libList.appendChild(makeElButton(el, true));
    shown++;
    if (shown > 400) break;
  }
  document.getElementById('element-count').textContent =
    `(${reg.paletteList().length - 1} elements)`;
  selectElement(selected);
}

libSearch.addEventListener('input', refreshLibrary);
libCat.addEventListener('change', refreshLibrary);
refreshLibrary();

// ------------------------------------------------------------ UI: controls

document.getElementById('pen-size').addEventListener('change', e => { penSize = Number(e.target.value); });
document.getElementById('speed').addEventListener('change', e => { speed = Number(e.target.value); });
document.getElementById('clear-btn').addEventListener('click', () => engine.clear());
const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
});

// --------------------------------------------------------- panel minimize

const panel = document.getElementById('panel');
const panelToggle = document.getElementById('panel-toggle');
let panelMinimized = localStorage.getItem('fsg-panel-min') === '1';

function setPanelMinimized(min) {
  panelMinimized = min;
  panel.classList.toggle('panel-minimized', min);
  panelToggle.textContent = min ? '+' : '−';
  panelToggle.title = min ? 'Expand panel' : 'Minimize panel';
  panelToggle.setAttribute('aria-expanded', String(!min));
  localStorage.setItem('fsg-panel-min', min ? '1' : '0');
}

panelToggle.addEventListener('click', e => {
  e.stopPropagation();
  setPanelMinimized(!panelMinimized);
});
panel.addEventListener('click', () => {
  if (panelMinimized) setPanelMinimized(false);
});
setPanelMinimized(panelMinimized);

// ------------------------------------------------------------ UI: AI lab

const aiPrompt = document.getElementById('ai-prompt');
const aiGenerate = document.getElementById('ai-generate');
const aiStatus = document.getElementById('ai-status');
document.getElementById('ai-guidelines').textContent = GUIDELINES;

const aiEndpoint = document.getElementById('ai-endpoint');
const aiKey = document.getElementById('ai-key');
const aiModel = document.getElementById('ai-model');

function loadAISettings() {
  try {
    const s = JSON.parse(localStorage.getItem('fsg-ai-settings') || '{}');
    aiEndpoint.value = s.endpoint || '';
    aiKey.value = s.apiKey || '';
    aiModel.value = s.model || '';
    return s;
  } catch { return {}; }
}
loadAISettings();

document.getElementById('ai-save').addEventListener('click', () => {
  localStorage.setItem('fsg-ai-settings', JSON.stringify({
    endpoint: aiEndpoint.value.trim(), apiKey: aiKey.value.trim(), model: aiModel.value.trim()
  }));
  aiStatus.className = '';
  aiStatus.textContent = 'Settings saved.';
});

async function runGenerate() {
  const prompt = aiPrompt.value.trim();
  if (!prompt) return;
  aiGenerate.disabled = true;
  aiStatus.className = '';
  aiStatus.textContent = 'Generating...';
  try {
    const settings = {
      endpoint: aiEndpoint.value.trim(), apiKey: aiKey.value.trim(), model: aiModel.value.trim()
    };
    const result = await generateParticle(prompt, settings, reg);
    if (!result.ok) {
      aiStatus.className = 'err';
      aiStatus.textContent = 'Generation failed: ' + result.errors.join(', ');
      return;
    }
    const id = reg.define(result.spec);
    reg.resolveAll();
    engine.cacheIds();
    const el = reg.elements[id];
    aiStatus.className = '';
    aiStatus.innerHTML = '';
    aiStatus.appendChild(document.createTextNode(
      `Created "${el.name}" (${result.source === 'llm' ? 'AI model' : 'built-in generator'}) — selected, start drawing!`));
    for (const w of result.warnings) {
      const s = document.createElement('span');
      s.className = 'warn';
      s.textContent = '! ' + w;
      aiStatus.appendChild(s);
    }
    aiCreated.appendChild(makeElButton(el, true));
    refreshLibrary();
    selectElement(id);
  } catch (err) {
    aiStatus.className = 'err';
    aiStatus.textContent = 'Error: ' + err.message;
  } finally {
    aiGenerate.disabled = false;
  }
}

aiGenerate.addEventListener('click', runGenerate);
aiPrompt.addEventListener('keydown', e => { if (e.key === 'Enter') runGenerate(); });

// ------------------------------------------------------------------ input

let drawing = false, erasing = false, lastX = -1, lastY = -1;

function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return [
    Math.floor((e.clientX - r.left) / r.width * GRID_W),
    Math.floor((e.clientY - r.top) / r.height * GRID_H)
  ];
}

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  drawing = true;
  erasing = e.button === 2;
  const [x, y] = canvasPos(e);
  lastX = x; lastY = y;
  engine.paint(x, y, erasing ? Math.max(penSize, 4) : penSize, erasing ? 0 : selected);
});
canvas.addEventListener('pointermove', e => {
  if (!drawing) return;
  const [x, y] = canvasPos(e);
  const id = erasing ? 0 : selected;
  // creatures spawn on click only, not on drag
  if (id > 0 && reg.elements[id].cat === CAT.CREATURE) { lastX = x; lastY = y; return; }
  engine.line(lastX, lastY, x, y, erasing ? Math.max(penSize, 4) : penSize, id);
  lastX = x; lastY = y;
});
window.addEventListener('pointerup', () => { drawing = false; });

// ---------------------------------------------------------------- counters

const countersBox = document.getElementById('counters');
let fps = 0, fpsFrames = 0, fpsLast = performance.now();

function refreshCounters() {
  const lines = [];
  let total = 0;
  const top = [];
  for (let id = 1; id < reg.count(); id++) {
    const c = engine.counts[id];
    if (c === 0) continue;
    total += c;
    top.push([c, id]);
  }
  top.sort((a, b) => b[0] - a[0]);
  lines.push(`<div class="cline"><span class="cname">FPS</span><span>${fps}</span></div>`);
  lines.push(`<div class="cline"><span class="cname">TOTAL</span><span>${total}</span></div>`);
  for (const [c, id] of top.slice(0, 10)) {
    const el = reg.elements[id];
    const [r, g, b] = el.colors[0];
    lines.push(`<div class="cline"><span class="cname" style="color:rgb(${Math.max(r, 90)},${Math.max(g, 90)},${Math.max(b, 90)})">${el.name.toUpperCase()}</span><span>${c}</span></div>`);
  }
  countersBox.innerHTML = lines.join('');
}

// -------------------------------------------------------------------- loop

function frame() {
  if (!paused) {
    speedAcc += speed;
    while (speedAcc >= 1) {
      speedAcc -= 1;
      runStreams();
      engine.update();
    }
  }
  engine.render(imgData);
  offCtx.putImageData(imgData, 0, 0);
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height);

  fpsFrames++;
  const now = performance.now();
  if (now - fpsLast > 500) {
    fps = Math.round(fpsFrames * 1000 / (now - fpsLast));
    fpsFrames = 0;
    fpsLast = now;
    refreshCounters();
  }
  requestAnimationFrame(frame);
}

selectElement(selected);
requestAnimationFrame(frame);

// debug/testing hook
window.__debug = () => {
  let total = 0;
  for (let id = 1; id < reg.count(); id++) total += engine.counts[id];
  return { total, entities: engine.entities.count(), fps, elements: reg.count() };
};
