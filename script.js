const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");

const MAX_TEXT_NODES = 10;
const STRAND_COUNT = 30;

const lexicon = {
  ja: {
    life: ["細胞", "呼吸", "鼓動", "記憶", "体温", "群れ"],
    nature: ["潮汐", "大気", "海流", "重力", "土壌", "光"],
    relation: ["渾然一体", "共鳴", "循環", "融解", "同調"],
  },
  en: {
    life: ["breath", "pulse", "living body", "memory"],
    nature: ["tide", "atmosphere", "gravity", "ocean drift"],
    relation: ["entangled", "resonant", "coherent", "one"],
  },
  es: {
    life: ["latido", "respiracion", "memoria viva"],
    nature: ["marea", "gravedad", "atmosfera"],
    relation: ["entrelazado", "en resonancia", "sin frontera"],
  },
  fr: {
    life: ["souffle", "battement", "memoire"],
    nature: ["maree", "gravite", "atmosphere"],
    relation: ["entrelace", "coherent", "sans limite"],
  },
};

const languages = ["ja", "en", "es", "fr"];

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  hue: Math.random() * 360,
  lastTextSpawnAt: 0,
  focus: {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    speed: 0,
    influence: 0,
    lastMoveAt: 0,
    orbitA: Math.random() * Math.PI * 2,
    orbitB: Math.random() * Math.PI * 2,
  },
  texts: [],
  strands: [],
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makePhrase() {
  const lang = pick(languages);
  const w = lexicon[lang];
  const life = pick(w.life);
  const nature = pick(w.nature);
  const relation = pick(w.relation);

  if (lang === "ja") return `${life}と${nature}は${relation}`;
  if (lang === "en") return `${life} + ${nature} = ${relation}`;
  if (lang === "es") return `${life} con ${nature}, ${relation}`;
  return `${life} avec ${nature}, ${relation}`;
}

function randomPoint(margin = 0.1) {
  const mx = state.width * margin;
  const my = state.height * margin;
  return {
    x: rand(mx, Math.max(mx + 1, state.width - mx)),
    y: rand(my, Math.max(my + 1, state.height - my)),
  };
}

function spawnText(now) {
  const point = randomPoint(0.14);
  state.texts.push({
    text: makePhrase(),
    x: point.x,
    y: point.y,
    vx: rand(-0.025, 0.025),
    vy: rand(-0.02, 0.02),
    age: 0,
    ttl: rand(7000, 11000),
    size: rand(14, 26),
    hue: (state.hue + rand(-28, 28)) % 360,
    seed: Math.random() * Math.PI * 2,
  });

  if (state.texts.length > MAX_TEXT_NODES) {
    state.texts.shift();
  }

  state.lastTextSpawnAt = now;
}

function createStrands() {
  state.strands = [];
  const baseRadius = Math.min(state.width, state.height) * 0.26;

  for (let i = 0; i < STRAND_COUNT; i += 1) {
    state.strands.push({
      type: Math.random() < 0.56 ? "wave" : "dotted",
      angle: Math.random() * Math.PI * 2,
      spin: rand(-1.3, 1.3),
      radius: baseRadius * rand(0.45, 1.15),
      depth: rand(0.15, 1.75),
      phase: Math.random() * Math.PI * 2,
      speed: rand(0.0004, 0.00135),
      amp: rand(9, 28),
      width: rand(0.5, 1.8),
      hue: (state.hue + rand(-48, 58) + 360) % 360,
    });
  }
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

function updateFocus(dt, now) {
  const idle = now - state.focus.lastMoveAt > 1700;
  if (idle) {
    state.focus.tx = state.width * 0.5 + Math.sin(now * 0.00015 + state.focus.orbitA) * state.width * 0.2;
    state.focus.ty = state.height * 0.5 + Math.cos(now * 0.00017 + state.focus.orbitB) * state.height * 0.18;
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

function updateTexts(dt, now) {
  const spawnInterval = 1300 - state.focus.influence * 420;
  if (now - state.lastTextSpawnAt > spawnInterval) {
    spawnText(now);
  }

  for (let i = state.texts.length - 1; i >= 0; i -= 1) {
    const t = state.texts[i];
    t.age += dt;
    t.x += t.vx * dt + Math.sin(now * 0.0005 + t.seed) * 0.07;
    t.y += t.vy * dt + Math.cos(now * 0.00045 + t.seed) * 0.05;

    if (t.x < -120) t.x = state.width + 120;
    if (t.x > state.width + 120) t.x = -120;
    if (t.y < -70) t.y = state.height + 70;
    if (t.y > state.height + 70) t.y = -70;

    if (t.age > t.ttl) state.texts.splice(i, 1);
  }
}

function update(dt, now) {
  updateFocus(dt, now);
  updateTexts(dt, now);
  state.hue = (state.hue + 0.025 + state.focus.influence * 0.1) % 360;
}

function project(x, y, z) {
  const perspective = 1 / (1 + z * 0.9);
  return {
    x: state.focus.x + (x - state.focus.x) * perspective,
    y: state.focus.y + (y - state.focus.y) * perspective,
    scale: perspective,
  };
}

function drawBackground(now) {
  const t = now * 0.0001;
  const h1 = (state.hue + Math.sin(t) * 20 + 360) % 360;
  const h2 = (state.hue + 50 + Math.cos(t * 1.2) * 25 + 360) % 360;
  const h3 = (state.hue + 120 + Math.sin(t * 0.72) * 16 + 360) % 360;

  const grad = ctx.createRadialGradient(
    state.focus.x * 0.7 + state.width * 0.15,
    state.focus.y * 0.7 + state.height * 0.15,
    state.width * 0.05,
    state.width * 0.6,
    state.height * 0.7,
    state.width * 0.95
  );

  grad.addColorStop(0, `hsla(${h1}, 78%, 16%, 0.96)`);
  grad.addColorStop(0.55, `hsla(${h2}, 72%, 8%, 0.95)`);
  grad.addColorStop(1, `hsla(${h3}, 70%, 4%, 0.98)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawWaveStrand(strand, now, p1, p2, scale) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  const nx = -dy / len;
  const ny = dx / len;
  const segments = 10;
  const amp = strand.amp * scale * (0.62 + state.focus.influence * 0.75);
  const freq = 1.0 + scale * 1.9;

  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  for (let i = 1; i < segments; i += 1) {
    const t = i / segments;
    const bx = p1.x + dx * t;
    const by = p1.y + dy * t;
    const phase = now * strand.speed * 7 + strand.phase + t * Math.PI * 2 * freq;
    const envelope = 1 - Math.abs(0.5 - t) * 1.75;
    const offset = Math.sin(phase) * amp * envelope;
    ctx.lineTo(bx + nx * offset, by + ny * offset);
  }
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function drawDottedStrand(strand, now, p1, p2, scale) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  ctx.setLineDash([1.2 * scale + 0.5, 9 * scale + 2]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  const dots = 5;
  for (let i = 0; i < dots; i += 1) {
    const drift = (now * strand.speed * 0.18 + i / dots + strand.phase * 0.05) % 1;
    const t = drift < 0 ? drift + 1 : drift;
    const x = p1.x + dx * t;
    const y = p1.y + dy * t + Math.sin(now * strand.speed * 9 + i + strand.phase) * 5 * scale;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + scale * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStrands(now) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const strand of state.strands) {
    const orbit = strand.angle + now * strand.speed * strand.spin * 48;
    const z = strand.depth + Math.sin(now * strand.speed * 4 + strand.phase) * 0.4;
    const z2 = strand.depth + 0.52 + Math.cos(now * strand.speed * 5 + strand.phase) * 0.35;

    const ax = state.focus.x + Math.cos(orbit) * strand.radius;
    const ay = state.focus.y + Math.sin(orbit) * strand.radius * 0.72;
    const bx = ax + Math.cos(orbit + Math.PI * 0.62) * (72 + strand.radius * 0.8);
    const by = ay + Math.sin(orbit + Math.PI * 0.62) * (72 + strand.radius * 0.65);

    const p1 = project(ax, ay, z);
    const p2 = project(bx, by, z2);
    const scale = (p1.scale + p2.scale) * 0.5;

    const alpha = 0.07 + scale * 0.28 + state.focus.influence * 0.09;
    ctx.strokeStyle = `hsla(${strand.hue}, 88%, 74%, ${alpha})`;
    ctx.fillStyle = `hsla(${strand.hue}, 88%, 74%, ${alpha * 0.95})`;
    ctx.lineWidth = strand.width * (0.65 + scale * 1.25);

    if (strand.type === "wave") {
      drawWaveStrand(strand, now, p1, p2, scale);
    } else {
      drawDottedStrand(strand, now, p1, p2, scale);
    }
  }

  ctx.restore();
}

function drawTexts(now) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const node of state.texts) {
    const life = node.age / node.ttl;
    const fade = Math.sin(Math.min(1, life) * Math.PI);
    const wobble = 0.88 + Math.sin(now * 0.0012 + node.seed) * 0.08;
    const size = node.size * wobble;
    const alpha = 0.2 + fade * 0.42;

    ctx.font = `${size}px "Zen Kaku Gothic New", sans-serif`;
    ctx.fillStyle = `hsla(${node.hue}, 90%, 88%, ${alpha})`;
    ctx.fillText(node.text, node.x, node.y);
  }
}

function draw(now) {
  drawBackground(now);
  drawStrands(now);
  drawTexts(now);
}

function onPointerMove(event) {
  const dx = event.clientX - state.focus.tx;
  const dy = event.clientY - state.focus.ty;
  const speed = Math.hypot(dx, dy);

  state.focus.tx = event.clientX;
  state.focus.ty = event.clientY;
  state.focus.speed = clamp(speed / 28, 0, 1);
  state.focus.influence = clamp(state.focus.influence * 0.72 + state.focus.speed * 0.62, 0, 1);
  state.focus.lastMoveAt = performance.now();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(48, now - last);
  last = now;

  update(dt, now);
  draw(now);
  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", onPointerMove, { passive: true });

resize();
for (let i = 0; i < MAX_TEXT_NODES; i += 1) {
  spawnText(performance.now());
}
requestAnimationFrame(frame);

