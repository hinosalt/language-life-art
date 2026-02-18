const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const pulseLine = document.getElementById("pulseLine");

const lexicon = {
  life: [
    "細胞",
    "呼吸",
    "体温",
    "鼓動",
    "群れ",
    "記憶",
    "幼生",
    "骨格",
    "まなざし",
    "器官",
  ],
  nature: [
    "潮汐",
    "雨粒",
    "大気",
    "光合成",
    "土壌",
    "海流",
    "火山灰",
    "季節風",
    "重力",
    "磁場",
  ],
  time: [
    "同時刻",
    "薄明",
    "夜明け",
    "長い夕暮れ",
    "深夜の層",
    "千年後の今",
    "一秒前の未来",
  ],
  relation: ["渾然一体", "重なり合い", "共鳴", "連結", "滲み", "循環", "抱擁", "融解", "同調"],
  verbs: ["溶ける", "脈打つ", "生成する", "響き合う", "漂う", "再帰する", "拡張する", "折り返す"],
  motion: ["さざ波", "偏光", "旋回", "乱流", "潮目", "反照", "屈折", "滑走", "滞留"],
  symbols: ["∞", "∴", "∵", "△", "◌", "◎", "⟡", "◐", "⋯"],
};

const englishWords = [
  "life",
  "erosion",
  "respiration",
  "resonance",
  "tidal memory",
  "one body",
  "evernow",
  "coexistence",
  "tender gravity",
];

const state = {
  utterances: [],
  wisps: [],
  hueShift: Math.random() * 120,
  lastPhraseSpawn: 0,
  lastWispSpawn: 0,
  lastPointerBurst: 0,
  width: 0,
  height: 0,
  dpr: 1,
  pointer: {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    speed: 0,
    influence: 0,
    lastMoveAt: 0,
  },
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pointerMood() {
  if (state.pointer.speed > 0.8) return "乱流";
  if (state.pointer.speed > 0.48) return "旋回";
  if (state.pointer.speed > 0.25) return "さざ波";
  return "静かな潮目";
}

function generatePhrase() {
  const templates = [
    () =>
      `${pick(lexicon.life)}は${pick(lexicon.nature)}と${pick(lexicon.relation)}し、${pick(lexicon.time)}で${pick(
        lexicon.verbs
      )}。`,
    () =>
      `${pick(lexicon.motion)}の内側で${pick(lexicon.life)}が${pick(lexicon.verbs)}、${pick(
        lexicon.relation
      )}だけが残る。`,
    () =>
      `${pick(lexicon.time)}、${pick(lexicon.life)}と${pick(lexicon.life)}は同じ${pick(
        lexicon.nature
      )}を分かち合う。`,
    () => `生命活動は自然現象。${pick(lexicon.life)}も${pick(lexicon.nature)}も境界なく${pick(lexicon.verbs)}。`,
    () => `同時間を過ごす生命は${pick(lexicon.relation)}。だから永遠も愛もここにある。`,
    () => `${pick(lexicon.symbols)} カーソルの${pointerMood()}は${pick(lexicon.motion)}へ接続される。`,
    () => `${pick(englishWords)} loops into ${pick(englishWords)}, then becomes ${pick(englishWords)}.`,
  ];
  return pick(templates)();
}

function fragmentFromPhrase(phrase) {
  if (phrase.includes(" ")) {
    const words = phrase.split(/\s+/).filter(Boolean);
    const start = Math.floor(Math.random() * words.length);
    const length = Math.max(2, Math.floor(Math.random() * 4) + 1);
    return words.slice(start, start + length).join(" ");
  }

  const chars = Array.from(phrase);
  const start = Math.floor(Math.random() * Math.max(1, chars.length - 8));
  const len = Math.min(chars.length - start, 4 + Math.floor(Math.random() * 12));
  return chars.slice(start, start + len).join("");
}

function resize() {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const width = window.innerWidth;
  const height = window.innerHeight;

  state.width = width;
  state.height = height;
  state.dpr = dpr;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (state.pointer.x === 0 && state.pointer.y === 0) {
    state.pointer.x = width * 0.5;
    state.pointer.y = height * 0.5;
    state.pointer.targetX = state.pointer.x;
    state.pointer.targetY = state.pointer.y;
  }
}

function spawnUtterance(forcedPhrase, anchorWeight = 0) {
  const phrase = forcedPhrase || generatePhrase();
  const text = fragmentFromPhrase(phrase);

  const orbit = Math.min(state.width, state.height) * (0.1 + Math.random() * 0.42);
  const angle = Math.random() * Math.PI * 2;
  const centerX = state.width * 0.5;
  const centerY = state.height * 0.5;
  const anchorX = state.pointer.x;
  const anchorY = state.pointer.y;

  const mix = Math.min(1, Math.max(0, anchorWeight));
  const baseX = centerX * (1 - mix) + anchorX * mix;
  const baseY = centerY * (1 - mix) + anchorY * mix;

  const x = baseX + Math.cos(angle) * orbit * (0.55 + (1 - mix) * 0.45);
  const y = baseY + Math.sin(angle) * orbit * (0.55 + (1 - mix) * 0.45);

  state.utterances.push({
    source: phrase,
    text,
    x,
    y,
    vx: (Math.random() - 0.5) * 0.3 + (state.pointer.targetX - state.pointer.x) * 0.0008,
    vy: (Math.random() - 0.5) * 0.3 + (state.pointer.targetY - state.pointer.y) * 0.0008,
    age: 0,
    ttl: 3600 + Math.random() * 4200,
    size: 12 + Math.random() * 20 + mix * 4,
    hue: (state.hueShift + Math.random() * 90 + mix * 30) % 360,
    seed: Math.random() * Math.PI * 2,
  });

  pulseLine.textContent = phrase;

  if (state.utterances.length > 190) {
    state.utterances.splice(0, state.utterances.length - 190);
  }
}

function spawnWisp(anchorWeight = 0) {
  const mix = Math.min(1, Math.max(0, anchorWeight));
  const x = state.width * (0.5 - mix * 0.5) + state.pointer.x * mix + (Math.random() - 0.5) * 140;
  const y = state.height * (0.5 - mix * 0.5) + state.pointer.y * mix + (Math.random() - 0.5) * 140;

  state.wisps.push({
    x,
    y,
    r: 70 + Math.random() * 220,
    vx: (Math.random() - 0.5) * 0.08,
    vy: (Math.random() - 0.5) * 0.08,
    age: 0,
    ttl: 4600 + Math.random() * 5200,
    hue: (state.hueShift + 30 + Math.random() * 120 + mix * 24) % 360,
  });

  if (state.wisps.length > 38) {
    state.wisps.splice(0, state.wisps.length - 38);
  }
}

function updatePointer(dt, now) {
  const lerp = 1 - Math.pow(0.001, dt / 1000);
  state.pointer.x += (state.pointer.targetX - state.pointer.x) * lerp;
  state.pointer.y += (state.pointer.targetY - state.pointer.y) * lerp;

  if (now - state.pointer.lastMoveAt > 2200) {
    state.pointer.influence *= Math.pow(0.965, dt / 16);
    state.pointer.speed *= Math.pow(0.92, dt / 16);
  } else {
    state.pointer.influence *= Math.pow(0.985, dt / 16);
  }

  state.pointer.influence = Math.min(1, Math.max(0, state.pointer.influence));
  state.pointer.speed = Math.min(1, Math.max(0, state.pointer.speed));
  state.hueShift = (state.hueShift + 0.03 + state.pointer.influence * 0.18) % 360;
}

function update(dt, now) {
  updatePointer(dt, now);

  const spawnInterval = 360 - state.pointer.influence * 180;
  if (now - state.lastPhraseSpawn > spawnInterval) {
    state.lastPhraseSpawn = now;
    spawnUtterance(undefined, state.pointer.influence);
  }

  if (now - state.lastWispSpawn > 170) {
    state.lastWispSpawn = now;
    spawnWisp(state.pointer.influence);
  }

  if (state.pointer.speed > 0.65 && now - state.lastPointerBurst > 120) {
    state.lastPointerBurst = now;
    spawnUtterance(
      `カーソルの${pointerMood()}が${pick(lexicon.life)}を${pick(lexicon.relation)}へ押し戻す。`,
      1
    );
  }

  for (let i = state.wisps.length - 1; i >= 0; i -= 1) {
    const wisp = state.wisps[i];
    wisp.age += dt;
    wisp.x += wisp.vx * dt;
    wisp.y += wisp.vy * dt;

    if (wisp.x < -wisp.r) wisp.x = state.width + wisp.r;
    if (wisp.x > state.width + wisp.r) wisp.x = -wisp.r;
    if (wisp.y < -wisp.r) wisp.y = state.height + wisp.r;
    if (wisp.y > state.height + wisp.r) wisp.y = -wisp.r;

    if (wisp.age > wisp.ttl) state.wisps.splice(i, 1);
  }

  for (let i = state.utterances.length - 1; i >= 0; i -= 1) {
    const node = state.utterances[i];
    node.age += dt;

    const wave = Math.sin(now * 0.0005 + node.seed) * 0.6;
    node.vx += Math.cos(now * 0.0003 + node.seed) * 0.001;
    node.vy += Math.sin(now * 0.00026 + node.seed) * 0.001;
    node.x += node.vx * dt * 0.1 + wave + (state.pointer.x - state.width * 0.5) * 0.0003;
    node.y += node.vy * dt * 0.1 + Math.cos(now * 0.00038 + node.seed) * 0.35 + (state.pointer.y - state.height * 0.5) * 0.0003;

    if (node.x < -80) node.x = state.width + 80;
    if (node.x > state.width + 80) node.x = -80;
    if (node.y < -60) node.y = state.height + 60;
    if (node.y > state.height + 60) node.y = -60;

    if (node.age > node.ttl) state.utterances.splice(i, 1);
  }
}

function drawBackground(now) {
  const t = now * 0.00009;
  const hueA = (166 + Math.sin(t) * 24 + state.hueShift) % 360;
  const hueB = (39 + Math.cos(t * 1.2) * 18 + state.pointer.influence * 24) % 360;
  const hueC = (196 + Math.sin(t * 0.6) * 28 + state.pointer.influence * 18) % 360;

  const px = state.pointer.x;
  const py = state.pointer.y;
  const radial = ctx.createRadialGradient(
    state.width * 0.24,
    state.height * 0.16,
    state.width * 0.05,
    px * 0.6 + state.width * 0.4,
    py * 0.6 + state.height * 0.4,
    state.width * 0.95
  );
  radial.addColorStop(0, `hsla(${hueA}, 76%, 22%, 0.92)`);
  radial.addColorStop(0.5, `hsla(${hueC}, 64%, 11%, 0.92)`);
  radial.addColorStop(1, `hsla(${hueB}, 76%, 7%, 0.96)`);

  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `hsla(${hueA + 80}, 44%, 70%, ${0.02 + state.pointer.influence * 0.06})`;
  for (let i = 0; i < 8; i += 1) {
    const x = ((Math.sin(t * 0.8 + i) + 1) * 0.5) * state.width * (0.6 + state.pointer.influence * 0.4);
    const y = ((Math.cos(t * 1.1 + i * 0.66) + 1) * 0.5) * state.height;
    ctx.beginPath();
    ctx.arc(x, y, 70 + i * 28 + state.pointer.influence * 22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWisps() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const wisp of state.wisps) {
    const life = wisp.age / wisp.ttl;
    const alpha = Math.sin(Math.min(1, life) * Math.PI) * (0.16 + state.pointer.influence * 0.08);
    const grad = ctx.createRadialGradient(wisp.x, wisp.y, 0, wisp.x, wisp.y, wisp.r);
    grad.addColorStop(0, `hsla(${wisp.hue}, 72%, 62%, ${alpha})`);
    grad.addColorStop(1, `hsla(${(wisp.hue + 30) % 360}, 72%, 42%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, wisp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawConnections() {
  const maxNodes = Math.min(state.utterances.length, 120);
  const range = 16000 + state.pointer.influence * 12000;
  for (let i = 0; i < maxNodes; i += 1) {
    const a = state.utterances[i];
    for (let j = i + 1; j < maxNodes; j += 1) {
      const b = state.utterances[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > range) continue;

      const proximity = 1 - distSq / range;
      const alpha = (0.035 + state.pointer.influence * 0.04) * proximity;
      ctx.strokeStyle = `hsla(${(a.hue + b.hue) * 0.5}, 82%, 74%, ${alpha})`;
      ctx.lineWidth = 0.5 + proximity * (1.2 + state.pointer.influence);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

function drawUtterances() {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const node of state.utterances) {
    const life = node.age / node.ttl;
    const alpha = Math.sin(Math.min(1, life) * Math.PI) * 0.94;
    const breathing = 0.86 + 0.3 * Math.sin(node.age * 0.002 + node.seed);
    const fontSize = node.size * (breathing + state.pointer.influence * 0.15);
    ctx.font = `${fontSize}px "Zen Kaku Gothic New", sans-serif`;
    ctx.fillStyle = `hsla(${node.hue}, 82%, 88%, ${alpha * (0.82 + state.pointer.influence * 0.18)})`;
    ctx.fillText(node.text, node.x, node.y);
  }
}

function draw(now) {
  drawBackground(now);
  drawWisps();
  drawConnections();
  drawUtterances();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(48, now - last);
  last = now;
  update(dt, now);
  draw(now);
  requestAnimationFrame(frame);
}

function onPointerMove(event) {
  const dx = event.clientX - state.pointer.targetX;
  const dy = event.clientY - state.pointer.targetY;
  const velocity = Math.hypot(dx, dy);

  state.pointer.targetX = event.clientX;
  state.pointer.targetY = event.clientY;
  state.pointer.speed = Math.min(1, velocity / 24);
  state.pointer.influence = Math.min(1, state.pointer.influence * 0.7 + state.pointer.speed * 0.6);
  state.pointer.lastMoveAt = performance.now();
}

window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("resize", resize);

resize();
for (let i = 0; i < 24; i += 1) spawnUtterance();
for (let i = 0; i < 14; i += 1) spawnWisp();
requestAnimationFrame(frame);

