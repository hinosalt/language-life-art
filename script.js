const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const cursor = document.getElementById("cursor");
const textLayer = document.getElementById("textLayer");
const glitchCenter = document.getElementById("glitchCenter");

const MAX_FLOATING_TEXTS = 10;
const STRANDS = 42;

const floatingPhrases = [
  "同時間の呼吸",
  "渾然一体の波形",
  "生命は自然現象",
  "永遠も愛も存在する",
  "one body / one tide",
  "between pulse and wind",
  "memoria viva",
  "souffle en resonance",
  "entangled now",
  "phase of tenderness",
  "重力に抱かれる記憶",
  "潮汐のなかの体温",
];

const centerWords = ["ECHO", "VOID", "PULSE", "LOVE", "LIFE", "∞", "WAVE", "記憶"];

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  hue: Math.random() * 360,
  lastTextSpawnAt: 0,
  lastCenterShiftAt: 0,
  floatingEls: [],
  strands: [],
  focus: {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    influence: 0,
    speed: 0,
    lastMoveAt: 0,
    orbitA: Math.random() * Math.PI * 2,
    orbitB: Math.random() * Math.PI * 2,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function resize() {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.dpr = dpr;

  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (state.focus.x === 0 && state.focus.y === 0) {
    state.focus.x = state.width * 0.5;
    state.focus.y = state.height * 0.5;
    state.focus.tx = state.focus.x;
    state.focus.ty = state.focus.y;
  }

  createStrands();
}

function createStrands() {
  state.strands = [];
  const base = Math.min(state.width, state.height) * 0.24;
  for (let i = 0; i < STRANDS; i += 1) {
    state.strands.push({
      type: Math.random() < 0.58 ? "wave" : "dotted",
      radius: base * rand(0.38, 1.25),
      angle: Math.random() * Math.PI * 2,
      spin: rand(-1.2, 1.2),
      depth: rand(0.1, 1.8),
      phase: Math.random() * Math.PI * 2,
      speed: rand(0.00045, 0.0014),
      amp: rand(8, 30),
      width: rand(0.5, 1.7),
      hueOffset: rand(-44, 60),
    });
  }
}

function spawnFloatingText() {
  const el = document.createElement("div");
  el.className = "floating-text";
  el.textContent = pick(floatingPhrases);
  el.style.left = `${rand(7, 82)}%`;
  el.style.top = `${rand(18, 80)}%`;
  el.style.fontSize = `${rand(0.9, 2.0)}rem`;
  el.style.fontWeight = `${Math.round(rand(200, 420))}`;
  el.style.letterSpacing = `${rand(0.01, 0.08)}em`;
  el.style.color = `hsla(${(state.hue + rand(-40, 60) + 360) % 360}, 80%, 82%, ${rand(0.35, 0.75)})`;
  el.style.transform = `rotate(${rand(-7, 7)}deg)`;

  textLayer.appendChild(el);
  state.floatingEls.push(el);

  if (state.floatingEls.length > MAX_FLOATING_TEXTS) {
    const old = state.floatingEls.shift();
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  setTimeout(() => {
    const idx = state.floatingEls.indexOf(el);
    if (idx >= 0) state.floatingEls.splice(idx, 1);
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 9000);
}

function shiftCenterWord(now) {
  if (now - state.lastCenterShiftAt < 3600) return;
  state.lastCenterShiftAt = now;
  glitchCenter.textContent = pick(centerWords);
  glitchCenter.style.animation = "none";
  glitchCenter.offsetHeight;
  glitchCenter.style.animation = "glitch-pulse 9s ease-in-out infinite";
}

function project(x, y, z) {
  const perspective = 1 / (1 + z * 0.85);
  return {
    x: state.focus.x + (x - state.focus.x) * perspective,
    y: state.focus.y + (y - state.focus.y) * perspective,
    scale: perspective,
  };
}

function drawBackground(now) {
  const t = now * 0.0001;
  const h1 = (state.hue + Math.sin(t) * 24 + 360) % 360;
  const h2 = (state.hue + 58 + Math.cos(t * 1.23) * 18 + 360) % 360;
  const h3 = (state.hue + 142 + Math.sin(t * 0.67) * 20 + 360) % 360;

  const grad = ctx.createRadialGradient(
    state.focus.x * 0.72 + state.width * 0.14,
    state.focus.y * 0.72 + state.height * 0.14,
    state.width * 0.05,
    state.width * 0.62,
    state.height * 0.72,
    state.width * 0.96
  );
  grad.addColorStop(0, `hsla(${h1}, 82%, 16%, 0.98)`);
  grad.addColorStop(0.5, `hsla(${h2}, 74%, 8%, 0.97)`);
  grad.addColorStop(1, `hsla(${h3}, 72%, 3%, 0.99)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawWave(strand, now, p1, p2, scale) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  const nx = -dy / len;
  const ny = dx / len;
  const seg = 11;
  const amp = strand.amp * scale * (0.64 + state.focus.influence * 0.72);
  const freq = 1 + scale * 2;

  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  for (let i = 1; i < seg; i += 1) {
    const t = i / seg;
    const bx = p1.x + dx * t;
    const by = p1.y + dy * t;
    const phase = now * strand.speed * 8 + strand.phase + t * Math.PI * 2 * freq;
    const envelope = 1 - Math.abs(0.5 - t) * 1.82;
    const offset = Math.sin(phase) * amp * envelope;
    ctx.lineTo(bx + nx * offset, by + ny * offset);
  }
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function drawDotted(strand, now, p1, p2, scale) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  ctx.setLineDash([1.2 * scale + 0.5, 8.5 * scale + 2]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    const drift = (now * strand.speed * 0.21 + i / 5 + strand.phase * 0.05) % 1;
    const t = drift < 0 ? drift + 1 : drift;
    const x = p1.x + dx * t;
    const y = p1.y + dy * t + Math.sin(now * strand.speed * 9 + strand.phase + i) * 4.5 * scale;
    ctx.beginPath();
    ctx.arc(x, y, 1.1 + scale * 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStrands(now) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const strand of state.strands) {
    const orbit = strand.angle + now * strand.speed * strand.spin * 54;
    const z1 = strand.depth + Math.sin(now * strand.speed * 4.2 + strand.phase) * 0.44;
    const z2 = strand.depth + 0.58 + Math.cos(now * strand.speed * 5.1 + strand.phase) * 0.36;

    const ax = state.focus.x + Math.cos(orbit) * strand.radius;
    const ay = state.focus.y + Math.sin(orbit) * strand.radius * 0.74;
    const bx = ax + Math.cos(orbit + Math.PI * 0.63) * (78 + strand.radius * 0.75);
    const by = ay + Math.sin(orbit + Math.PI * 0.63) * (78 + strand.radius * 0.62);

    const p1 = project(ax, ay, z1);
    const p2 = project(bx, by, z2);
    const scale = (p1.scale + p2.scale) * 0.5;

    const hue = (state.hue + strand.hueOffset + 360) % 360;
    const alpha = 0.08 + scale * 0.3 + state.focus.influence * 0.09;

    ctx.strokeStyle = `hsla(${hue}, 88%, 72%, ${alpha})`;
    ctx.fillStyle = `hsla(${hue}, 88%, 72%, ${alpha})`;
    ctx.lineWidth = strand.width * (0.64 + scale * 1.2);

    if (strand.type === "wave") {
      drawWave(strand, now, p1, p2, scale);
    } else {
      drawDotted(strand, now, p1, p2, scale);
    }
  }

  ctx.restore();
}

function updateFocus(dt, now) {
  const idle = now - state.focus.lastMoveAt > 1600;
  if (idle) {
    state.focus.tx = state.width * 0.5 + Math.sin(now * 0.00016 + state.focus.orbitA) * state.width * 0.18;
    state.focus.ty = state.height * 0.5 + Math.cos(now * 0.00018 + state.focus.orbitB) * state.height * 0.16;
    state.focus.speed *= Math.pow(0.93, dt / 16);
    state.focus.influence *= Math.pow(0.985, dt / 16);
  } else {
    state.focus.influence *= Math.pow(0.992, dt / 16);
  }

  const ease = 1 - Math.pow(0.001, dt / 1000);
  state.focus.x += (state.focus.tx - state.focus.x) * ease;
  state.focus.y += (state.focus.ty - state.focus.y) * ease;
  state.focus.speed = clamp(state.focus.speed, 0, 1);
  state.focus.influence = clamp(state.focus.influence, 0, 1);
}

function update(dt, now) {
  updateFocus(dt, now);

  const textInterval = 1200 - state.focus.influence * 350;
  if (now - state.lastTextSpawnAt > textInterval) {
    state.lastTextSpawnAt = now;
    spawnFloatingText();
  }

  shiftCenterWord(now);
  state.hue = (state.hue + 0.022 + state.focus.influence * 0.11) % 360;
}

function draw(now) {
  drawBackground(now);
  drawStrands(now);
}

function onPointerMove(event) {
  const dx = event.clientX - state.focus.tx;
  const dy = event.clientY - state.focus.ty;
  const speed = Math.hypot(dx, dy);

  state.focus.tx = event.clientX;
  state.focus.ty = event.clientY;
  state.focus.speed = clamp(speed / 26, 0, 1);
  state.focus.influence = clamp(state.focus.influence * 0.68 + state.focus.speed * 0.66, 0, 1);
  state.focus.lastMoveAt = performance.now();

  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
}

function onPointerDown() {
  cursor.classList.add("active");
  state.focus.influence = clamp(state.focus.influence + 0.35, 0, 1);
  spawnFloatingText();
  spawnFloatingText();
}

function onPointerUp() {
  cursor.classList.remove("active");
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(50, now - last);
  last = now;
  update(dt, now);
  draw(now);
  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointerup", onPointerUp, { passive: true });

resize();
for (let i = 0; i < 4; i += 1) spawnFloatingText();
requestAnimationFrame(frame);

