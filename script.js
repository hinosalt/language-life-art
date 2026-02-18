const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");
const pulseLine = document.getElementById("pulseLine");

const lexicon = {
  ja: {
    life: [
      "細胞",
      "呼吸",
      "体温",
      "鼓動",
      "群れ",
      "記憶",
      "器官",
      "まなざし",
      "骨格",
      "幼生",
      "神経",
      "血流",
      "胎動",
      "声帯",
      "皮膚",
      "睡眠",
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
      "氷河",
      "珊瑚礁",
      "地殻",
      "気圧",
      "雲海",
      "雷雲",
    ],
    time: ["同時刻", "薄明", "夜明け", "長い夕暮れ", "深夜の層", "千年後の今", "一秒前の未来", "永い現在"],
    relation: ["渾然一体", "重なり合い", "共鳴", "連結", "滲み", "循環", "抱擁", "融解", "同調", "抱合", "編み込み"],
    verb: ["溶ける", "脈打つ", "生成する", "響き合う", "漂う", "再帰する", "拡張する", "折り返す", "滞留する", "閃く"],
    motion: ["さざ波", "偏光", "旋回", "乱流", "潮目", "反照", "屈折", "滑走", "滞留", "放射", "収束"],
    connectors: ["ゆえに", "そして", "そのため", "だから", "したがって", "同時に", "それでも"],
    constants: ["永遠", "愛", "自然現象", "生命活動"],
  },
  en: {
    life: [
      "cell choir",
      "breath",
      "blood memory",
      "nervous rain",
      "shared body",
      "pulse",
      "sleep",
      "kinetic skin",
      "soft anatomy",
      "living lattice",
    ],
    nature: [
      "tide",
      "wind field",
      "river light",
      "magnetic dust",
      "climate drift",
      "forest weather",
      "gravity well",
      "ocean pressure",
      "storm pollen",
      "volcanic sky",
    ],
    time: [
      "this same second",
      "dawn layer",
      "midnight fold",
      "a future already here",
      "an endless now",
      "the returning hour",
    ],
    relation: [
      "entangled",
      "braided",
      "resonant",
      "coherent",
      "inseparable",
      "mutually luminous",
      "phase-locked",
    ],
    verb: ["folds", "drifts", "echoes", "recurves", "merges", "oscillates", "blooms", "returns", "circulates"],
    motion: ["ripple", "vortex", "spiral", "shear", "refraction", "orbit", "phase noise"],
    connectors: ["therefore", "meanwhile", "still", "thus", "and", "so"],
    constants: ["eternity", "love", "natural process", "living activity"],
  },
  es: {
    life: [
      "celula",
      "respiracion",
      "latido",
      "memoria viva",
      "cuerpo comun",
      "nervio",
      "piel",
      "sangre",
      "sueno",
    ],
    nature: [
      "marea",
      "atmosfera",
      "lluvia",
      "corriente marina",
      "gravedad",
      "viento estacional",
      "suelo humedo",
      "nube electrica",
    ],
    time: ["este mismo instante", "amanecer largo", "noche profunda", "presente infinito", "futuro inmediato"],
    relation: ["entrelazado", "fusionado", "sin frontera", "en resonancia", "en abrazo", "coexistente"],
    verb: ["late", "se mezcla", "se propaga", "gira", "regresa", "respira", "se transforma"],
    motion: ["oleaje", "espiral", "deriva", "flujo", "refraccion", "oscilacion"],
    connectors: ["por eso", "mientras", "asi", "todavia", "entonces"],
    constants: ["eternidad", "amor", "fenomeno natural", "actividad vital"],
  },
  fr: {
    life: [
      "cellule",
      "souffle",
      "battement",
      "memoire du corps",
      "peau vivante",
      "sang",
      "sommeil",
      "forme sensible",
    ],
    nature: ["maree", "atmosphere", "pluie", "courant marin", "gravite", "lumiere terrestre", "vent", "nuage"],
    time: ["ce meme instant", "aube continue", "nuit epaisse", "present perpetuel", "temps superpose"],
    relation: ["entrelace", "uni", "sans limite", "en resonance", "coherent", "indissociable"],
    verb: ["palpite", "se melange", "derive", "revient", "s'etend", "vibre", "circule"],
    motion: ["onde", "spirale", "orbite", "derive", "refraction", "pulsation"],
    connectors: ["alors", "ainsi", "pourtant", "et", "donc"],
    constants: ["eternite", "amour", "phenomene naturel", "activite vitale"],
  },
};

const symbols = ["∞", "∴", "∵", "△", "◌", "◎", "⟡", "◐", "⋯", "≋", "≈"];
const languageOrder = ["ja", "en", "es", "fr"];
const modes = ["proposition", "chain", "equation", "chorus", "vow"];

const state = {
  utterances: [],
  wisps: [],
  phraseMemory: [],
  hueShift: Math.random() * 120,
  lastPhraseSpawn: 0,
  lastWispSpawn: 0,
  width: 0,
  height: 0,
  dpr: 1,
  orbitA: Math.random() * Math.PI * 2,
  orbitB: Math.random() * Math.PI * 2,
  focus: {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    momentum: 0,
    influence: 0,
    lastMoveAt: 0,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function mix(a, b, t) {
  return a * (1 - t) + b * t;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickWeighted(items) {
  let sum = 0;
  for (const item of items) sum += item.w;
  let remainder = Math.random() * sum;
  for (const item of items) {
    remainder -= item.w;
    if (remainder <= 0) return item.v;
  }
  return items[items.length - 1].v;
}

function phraseTone() {
  return Math.random();
}

function phraseCadence() {
  return Math.random();
}

function chooseLanguage(now) {
  const orbit = (Math.sin(now * 0.00008 + state.orbitA) + 1) * 0.5;
  const index = Math.floor(orbit * languageOrder.length) % languageOrder.length;
  const base = languageOrder[index];
  const hybridChance = 0.18 + state.focus.influence * 0.22;
  if (Math.random() < hybridChance) return "hybrid";
  return base;
}

function chooseMode() {
  return pickWeighted([
    { v: "proposition", w: 2.6 },
    { v: "chain", w: 1.9 },
    { v: "equation", w: 1.2 },
    { v: "chorus", w: 1.25 },
    { v: "vow", w: 1.35 },
  ]);
}

function words(lang) {
  return lexicon[lang];
}

function composeByLanguage(lang, mode) {
  const w = words(lang);
  const life = pick(w.life);
  const lifeB = pick(w.life);
  const nature = pick(w.nature);
  const time = pick(w.time);
  const relation = pick(w.relation);
  const relationB = pick(w.relation);
  const verb = pick(w.verb);
  const motion = pick(w.motion);
  const connector = pick(w.connectors);
  const constant = pick(w.constants);
  const symbol = pick(symbols);

  if (lang === "ja") {
    const templates = {
      proposition: [
        `${life}は${nature}へ${verb}、${time}に${relation}へ変わる。`,
        `${time}、${life}と${lifeB}は${nature}の縁で${relation}する。`,
        `${constant}としての${life}は${nature}と${relation}し続ける。`,
      ],
      chain: [
        `${life} -> ${motion} -> ${nature} -> ${relation} -> ${time}`,
        `${nature}が${verb}、${connector}${life}は${relation}し、${time}が開く。`,
      ],
      equation: [
        `${symbol} ${life} + ${nature} = ${relation} @ ${time}`,
        `${constant} = ${nature}の速度 / ${life}の位相`,
      ],
      chorus: [
        `同時間を過ごす生命は${relation}、だから永遠も愛も存在する。`,
        `生命活動は自然現象。境界は${motion}にほどけ、愛だけが残る。`,
      ],
      vow: [
        `${time}、${life}は${nature}を拒まず、${relationB}として在り続ける。`,
        `${connector}${life}は${nature}と同じ現在を呼吸する。`,
      ],
    };
    return pick(templates[mode]);
  }

  if (lang === "en") {
    const templates = {
      proposition: [
        `${life} ${verb} through ${nature}; in ${time}, every form becomes ${relation}.`,
        `At ${time}, ${life} and ${lifeB} stay ${relation} inside ${nature}.`,
        `${constant} means ${life} never leaves ${nature}.`,
      ],
      chain: [
        `${life} -> ${motion} -> ${nature} -> ${relation} -> ${time}`,
        `${nature} ${verb}, ${connector} ${life} turns ${relation}.`,
      ],
      equation: [
        `${symbol} ${life} + ${nature} = ${relation} @ ${time}`,
        `${constant} = velocity(${nature}) / phase(${life})`,
      ],
      chorus: [
        `Life is a natural process; shared time makes one body, therefore eternity and love remain.`,
        `${life} keeps ${relationB}; love is not metaphor but structure.`,
      ],
      vow: [
        `In ${time}, ${life} does not separate from ${nature}; it stays ${relation}.`,
        `${connector} every pulse remembers one planet, one breath, one drift.`,
      ],
    };
    return pick(templates[mode]);
  }

  if (lang === "es") {
    const templates = {
      proposition: [
        `${life} ${verb} con ${nature}; en ${time}, toda forma queda ${relation}.`,
        `En ${time}, ${life} y ${lifeB} respiran la misma ${nature}.`,
        `${constant}: ${life} no se separa de ${nature}.`,
      ],
      chain: [
        `${life} -> ${motion} -> ${nature} -> ${relation} -> ${time}`,
        `${nature} ${verb}, ${connector} ${life} entra en ${relation}.`,
      ],
      equation: [
        `${symbol} ${life} + ${nature} = ${relation} @ ${time}`,
        `${constant} = ritmo(${nature}) / fase(${life})`,
      ],
      chorus: [
        `La vida es ${pick(w.constants)}, y el tiempo compartido sostiene eternidad y amor.`,
        `${life} en ${relationB}; ninguna frontera persiste.`,
      ],
      vow: [
        `${time}: ${life} no huye de ${nature}, se queda en ${relation}.`,
        `${connector} todo latido vuelve al mismo mar.`,
      ],
    };
    return pick(templates[mode]);
  }

  const templates = {
    proposition: [
      `${life} ${verb} avec ${nature}; dans ${time}, chaque forme devient ${relation}.`,
      `Dans ${time}, ${life} et ${lifeB} gardent la meme ${nature}.`,
      `${constant}: ${life} ne quitte jamais ${nature}.`,
    ],
    chain: [
      `${life} -> ${motion} -> ${nature} -> ${relation} -> ${time}`,
      `${nature} ${verb}, ${connector} ${life} reste ${relation}.`,
    ],
    equation: [
      `${symbol} ${life} + ${nature} = ${relation} @ ${time}`,
      `${constant} = flux(${nature}) / phase(${life})`,
    ],
    chorus: [
      `La vie est un phenomene naturel; le temps partage garde l'eternite et l'amour.`,
      `${life} devient ${relationB}; la frontiere tombe.`,
    ],
    vow: [
      `${time}: ${life} ne se separe pas de ${nature}, il demeure ${relation}.`,
      `${connector} chaque battement revient a la meme terre.`,
    ],
  };
  return pick(templates[mode]);
}

function pickMemory() {
  if (state.phraseMemory.length === 0) return null;
  const index = Math.floor(Math.random() * state.phraseMemory.length);
  return state.phraseMemory[index];
}

function splitClauses(text) {
  const clauses = text
    .split(/[。.!?;:|]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return clauses.length > 0 ? clauses : [text];
}

function mutateFromMemory() {
  const base = pickMemory();
  if (!base) return null;

  if (base.lang === "hybrid") {
    const bridgeA = composeByLanguage(pick(languageOrder), pick(modes));
    const bridgeB = composeByLanguage(pick(languageOrder), pick(modes));
    return `${pick(splitClauses(base.text))} ${pick(["::", "->", "≈"])} ${pick(splitClauses(bridgeA))} ${pick([
      "|",
      "~",
    ])} ${pick(splitClauses(bridgeB))}`;
  }

  if (base.lang === "ja") {
    const extension = `${pick(lexicon.ja.connectors)}${pick(lexicon.ja.life)}は${pick(lexicon.ja.nature)}と${pick(
      lexicon.ja.relation
    )}する。`;
    return `${base.text.replace(/[。.!?]+$/g, "")}。${extension}`;
  }

  if (base.lang === "en") {
    const extension = `${pick(lexicon.en.connectors)} ${pick(lexicon.en.life)} ${pick(lexicon.en.verb)} into ${pick(
      lexicon.en.relation
    )}.`;
    return `${base.text.replace(/[.?!]+$/g, "")}; ${extension}`;
  }

  if (base.lang === "es") {
    const extension = `${pick(lexicon.es.connectors)} ${pick(lexicon.es.life)} ${pick(
      lexicon.es.verb
    )} con ${pick(lexicon.es.nature)}.`;
    return `${base.text.replace(/[.?!]+$/g, "")}; ${extension}`;
  }

  const extension = `${pick(lexicon.fr.connectors)} ${pick(lexicon.fr.life)} ${pick(lexicon.fr.verb)} avec ${pick(
    lexicon.fr.nature
  )}.`;
  return `${base.text.replace(/[.?!]+$/g, "")}; ${extension}`;
}

function braidFromMemory() {
  if (state.phraseMemory.length < 2) return null;
  const first = pickMemory();
  let second = pickMemory();
  let guard = 0;
  while (second && first && second.text === first.text && guard < 6) {
    second = pickMemory();
    guard += 1;
  }
  if (!first || !second) return null;

  const clauseA = pick(splitClauses(first.text));
  const clauseB = pick(splitClauses(second.text));
  const bridge = pick([" | ", " // ", " ~ ", " -> "]);
  return `${clauseA}${bridge}${clauseB}`;
}

function nextPhrase(now) {
  const mode = chooseMode();
  const language = chooseLanguage(now);

  let text = "";
  let lang = language;
  if (Math.random() < 0.2 + state.focus.influence * 0.24) {
    const braided = braidFromMemory();
    if (braided) {
      text = braided;
      lang = "hybrid";
    }
  }

  if (!text && Math.random() < 0.16 + state.focus.influence * 0.2) {
    const mutated = mutateFromMemory();
    if (mutated) {
      text = mutated;
      const source = pickMemory();
      lang = source ? source.lang : language;
    }
  }

  if (!text) {
    if (language === "hybrid") {
      const a = pick(languageOrder);
      let b = pick(languageOrder);
      let safety = 0;
      while (b === a && safety < 5) {
        b = pick(languageOrder);
        safety += 1;
      }
      const left = composeByLanguage(a, mode);
      const right = composeByLanguage(b, pick(modes));
      text = `${pick(splitClauses(left))} ${pick(["::", "|", "≈", "->"])} ${pick(splitClauses(right))}`;
      lang = "hybrid";
    } else {
      text = composeByLanguage(language, mode);
      lang = language;
    }
  }

  const recent = state.phraseMemory.slice(-18).map((item) => item.text);
  let attempts = 0;
  while (recent.includes(text) && attempts < 5) {
    text = composeByLanguage(pick(languageOrder), pick(modes));
    attempts += 1;
  }

  return {
    text,
    lang,
    mode,
    tone: phraseTone(),
    cadence: phraseCadence(),
    flux: Math.random(),
  };
}

function fragmentFromPhrase(phrase) {
  if (Math.random() < 0.18) return phrase;

  const clauses = splitClauses(phrase);
  if (clauses.length > 1 && Math.random() < 0.6) return pick(clauses);

  if (/\s/.test(phrase)) {
    const words = phrase.split(/\s+/).filter(Boolean);
    const start = Math.floor(Math.random() * words.length);
    const count = 2 + Math.floor(Math.random() * 5);
    return words.slice(start, start + count).join(" ");
  }

  const chars = Array.from(phrase);
  const start = Math.floor(Math.random() * Math.max(1, chars.length - 10));
  const len = Math.min(chars.length - start, 7 + Math.floor(Math.random() * 18));
  return chars.slice(start, start + len).join("");
}

function rememberPhrase(phrase) {
  state.phraseMemory.push(phrase);
  if (state.phraseMemory.length > 120) {
    state.phraseMemory.splice(0, state.phraseMemory.length - 120);
  }
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

  if (state.focus.x === 0 && state.focus.y === 0) {
    state.focus.x = width * 0.5;
    state.focus.y = height * 0.5;
    state.focus.targetX = state.focus.x;
    state.focus.targetY = state.focus.y;
  }
}

function spawnUtterance(now, anchorWeight = 0) {
  const phrase = nextPhrase(now);
  const text = fragmentFromPhrase(phrase.text);
  rememberPhrase(phrase);
  pulseLine.textContent = phrase.text;

  const orbit = Math.min(state.width, state.height) * (0.08 + Math.random() * 0.45);
  const angle = Math.random() * Math.PI * 2;
  const centerX = state.width * 0.5;
  const centerY = state.height * 0.5;

  const mixRate = clamp(anchorWeight, 0, 1);
  const baseX = mix(centerX, state.focus.x, mixRate);
  const baseY = mix(centerY, state.focus.y, mixRate);
  const x = baseX + Math.cos(angle) * orbit * (0.55 + (1 - mixRate) * 0.45);
  const y = baseY + Math.sin(angle) * orbit * (0.55 + (1 - mixRate) * 0.45);

  state.utterances.push({
    source: phrase.text,
    text,
    lang: phrase.lang,
    mode: phrase.mode,
    tone: phrase.tone,
    cadence: phrase.cadence,
    flux: phrase.flux,
    x,
    y,
    vx: (Math.random() - 0.5) * 0.35 + (state.focus.targetX - state.focus.x) * 0.0008,
    vy: (Math.random() - 0.5) * 0.35 + (state.focus.targetY - state.focus.y) * 0.0008,
    age: 0,
    ttl: 3900 + Math.random() * 5600,
    size: 11 + Math.random() * 22 + mixRate * 4,
    hue: (state.hueShift + Math.random() * 120 + mixRate * 24) % 360,
    seed: Math.random() * Math.PI * 2,
  });

  if (state.utterances.length > 240) {
    state.utterances.splice(0, state.utterances.length - 240);
  }
}

function spawnWisp(anchorWeight = 0) {
  const mixRate = clamp(anchorWeight, 0, 1);
  const x = mix(state.width * 0.5, state.focus.x, mixRate) + (Math.random() - 0.5) * 180;
  const y = mix(state.height * 0.5, state.focus.y, mixRate) + (Math.random() - 0.5) * 180;

  state.wisps.push({
    x,
    y,
    r: 80 + Math.random() * 240,
    vx: (Math.random() - 0.5) * 0.11,
    vy: (Math.random() - 0.5) * 0.11,
    age: 0,
    ttl: 5000 + Math.random() * 5600,
    hue: (state.hueShift + 20 + Math.random() * 140 + mixRate * 22) % 360,
  });

  if (state.wisps.length > 46) {
    state.wisps.splice(0, state.wisps.length - 46);
  }
}

function updateFocus(dt, now) {
  if (now - state.focus.lastMoveAt > 2200) {
    state.focus.targetX = state.width * 0.5 + Math.sin(now * 0.00014 + state.orbitA) * state.width * 0.18;
    state.focus.targetY = state.height * 0.5 + Math.cos(now * 0.00016 + state.orbitB) * state.height * 0.2;
    state.focus.momentum *= Math.pow(0.94, dt / 16);
    state.focus.influence *= Math.pow(0.986, dt / 16);
  } else {
    state.focus.influence *= Math.pow(0.994, dt / 16);
  }

  const ease = 1 - Math.pow(0.001, dt / 1000);
  state.focus.x += (state.focus.targetX - state.focus.x) * ease;
  state.focus.y += (state.focus.targetY - state.focus.y) * ease;

  state.focus.momentum = clamp(state.focus.momentum, 0, 1);
  state.focus.influence = clamp(state.focus.influence, 0, 1);
  state.hueShift = (state.hueShift + 0.025 + state.focus.influence * 0.2) % 360;
}

function update(dt, now) {
  updateFocus(dt, now);

  const phraseInterval = 340 - state.focus.influence * 170;
  if (now - state.lastPhraseSpawn > phraseInterval) {
    state.lastPhraseSpawn = now;
    spawnUtterance(now, state.focus.influence);
  }

  const wispInterval = 190 - state.focus.influence * 70;
  if (now - state.lastWispSpawn > wispInterval) {
    state.lastWispSpawn = now;
    spawnWisp(state.focus.influence);
  }

  if (state.focus.momentum > 0.68 && Math.random() < 0.35) {
    spawnUtterance(now, 1);
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

    const phase = now * 0.00045 + node.seed;
    node.vx += Math.cos(phase) * 0.0012;
    node.vy += Math.sin(phase * 1.13) * 0.0012;
    node.x += node.vx * dt * 0.1 + Math.sin(phase * 2.7) * 0.52 + (state.focus.x - state.width * 0.5) * 0.00035;
    node.y += node.vy * dt * 0.1 + Math.cos(phase * 2.2) * 0.42 + (state.focus.y - state.height * 0.5) * 0.00035;

    if (node.x < -90) node.x = state.width + 90;
    if (node.x > state.width + 90) node.x = -90;
    if (node.y < -80) node.y = state.height + 80;
    if (node.y > state.height + 80) node.y = -80;

    if (node.age > node.ttl) state.utterances.splice(i, 1);
  }
}

function drawBackground(now) {
  const t = now * 0.00009;
  const hueA = (166 + Math.sin(t) * 24 + state.hueShift) % 360;
  const hueB = (39 + Math.cos(t * 1.2) * 18 + state.focus.influence * 20) % 360;
  const hueC = (196 + Math.sin(t * 0.6) * 30 + state.focus.influence * 16) % 360;

  const radial = ctx.createRadialGradient(
    state.width * 0.22,
    state.height * 0.16,
    state.width * 0.05,
    state.focus.x * 0.58 + state.width * 0.42,
    state.focus.y * 0.58 + state.height * 0.42,
    state.width * 0.95
  );
  radial.addColorStop(0, `hsla(${hueA}, 74%, 22%, 0.93)`);
  radial.addColorStop(0.5, `hsla(${hueC}, 66%, 10%, 0.93)`);
  radial.addColorStop(1, `hsla(${hueB}, 78%, 6%, 0.96)`);

  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `hsla(${hueA + 80}, 44%, 70%, ${0.02 + state.focus.influence * 0.06})`;
  for (let i = 0; i < 10; i += 1) {
    const x = ((Math.sin(t * 0.8 + i) + 1) * 0.5) * state.width * (0.6 + state.focus.influence * 0.4);
    const y = ((Math.cos(t * 1.1 + i * 0.66) + 1) * 0.5) * state.height;
    ctx.beginPath();
    ctx.arc(x, y, 72 + i * 24 + state.focus.influence * 20, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWisps() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const wisp of state.wisps) {
    const life = wisp.age / wisp.ttl;
    const alpha = Math.sin(Math.min(1, life) * Math.PI) * (0.15 + state.focus.influence * 0.09);
    const grad = ctx.createRadialGradient(wisp.x, wisp.y, 0, wisp.x, wisp.y, wisp.r);
    grad.addColorStop(0, `hsla(${wisp.hue}, 74%, 60%, ${alpha})`);
    grad.addColorStop(1, `hsla(${(wisp.hue + 32) % 360}, 72%, 42%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(wisp.x, wisp.y, wisp.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function connectionStyle(a, b, proximity, now) {
  const harmony = Math.sin(a.seed * 2.2 + b.seed * 1.8 + now * 0.0005 + (a.cadence - b.cadence) * 2.5);
  const toneGap = Math.abs(a.tone - b.tone);
  const sameLanguage = a.lang === b.lang;

  if (sameLanguage && toneGap < 0.24 && proximity > 0.45) return "line";
  if (harmony > 0.22 || Math.abs(a.flux - b.flux) > 0.36) return "wave";
  return "graph";
}

function drawStraightConnection(a, b) {
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawGraphConnection(a, b, now) {
  const bend = Math.sin(now * 0.0011 + a.seed * 4 - b.seed * 3) * 18;
  const split = 0.35 + ((Math.sin(a.seed + b.seed) + 1) * 0.5) * 0.3;
  const mx = mix(a.x, b.x, split);

  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(mx, a.y + bend);
  ctx.lineTo(mx, b.y - bend * 0.65);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawWaveConnection(a, b, proximity, now) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  const nx = -dy / len;
  const ny = dx / len;
  const steps = clamp(Math.floor(len / 70), 4, 9);
  const amp = Math.min(26, 4 + len * 0.07) * (0.4 + proximity * 0.8);
  const freq = 1.2 + ((a.cadence + b.cadence) * 0.5) * 2.2;

  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);

  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const bx = a.x + dx * t;
    const by = a.y + dy * t;
    const envelope = 1 - Math.abs(0.5 - t) * 1.85;
    const phase = t * Math.PI * 2 * freq + now * 0.004 + a.seed - b.seed;
    const offset = Math.sin(phase) * amp * envelope;
    ctx.lineTo(bx + nx * offset, by + ny * offset);
  }

  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawConnections(now) {
  const maxNodes = Math.min(state.utterances.length, 120);
  const range = 20000 + state.focus.influence * 16000;
  const maxEdges = 320;
  let edges = 0;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < maxNodes && edges < maxEdges; i += 1) {
    const a = state.utterances[i];
    for (let j = i + 1; j < maxNodes && edges < maxEdges; j += 1) {
      const b = state.utterances[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > range) continue;

      const proximity = 1 - distSq / range;
      const gate = 0.24 + proximity * 0.56 + state.focus.influence * 0.16;
      const signature = Math.abs(Math.sin(a.seed * 11.7 + b.seed * 13.1));
      if (signature > gate) continue;

      const style = connectionStyle(a, b, proximity, now);
      const alpha = (0.028 + state.focus.influence * 0.032) * proximity;
      const hue = (a.hue * 0.48 + b.hue * 0.52 + proximity * 22) % 360;

      ctx.strokeStyle = `hsla(${hue}, 80%, 74%, ${alpha})`;
      ctx.lineWidth = 0.45 + proximity * (1.15 + state.focus.influence * 0.7);

      if (style === "line") {
        drawStraightConnection(a, b);
      } else if (style === "graph") {
        drawGraphConnection(a, b, now);
      } else {
        drawWaveConnection(a, b, proximity, now);
      }

      edges += 1;
    }
  }

  ctx.restore();
}

function drawUtterances(now) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const node of state.utterances) {
    const life = node.age / node.ttl;
    const alpha = Math.sin(Math.min(1, life) * Math.PI) * 0.94;
    const breathing = 0.86 + 0.3 * Math.sin(now * 0.002 + node.seed + node.age * 0.0014);
    const fontSize = node.size * (breathing + state.focus.influence * 0.14);
    const family = node.lang === "ja" ? '"Zen Kaku Gothic New", sans-serif' : '"Cormorant Garamond", serif';

    ctx.font = `${fontSize}px ${family}`;
    ctx.fillStyle = `hsla(${node.hue}, 82%, 88%, ${alpha * (0.82 + state.focus.influence * 0.18)})`;
    ctx.fillText(node.text, node.x, node.y);
  }
}

function draw(now) {
  drawBackground(now);
  drawWisps();
  drawConnections(now);
  drawUtterances(now);
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
  const dx = event.clientX - state.focus.targetX;
  const dy = event.clientY - state.focus.targetY;
  const speed = Math.hypot(dx, dy);

  state.focus.targetX = event.clientX;
  state.focus.targetY = event.clientY;
  state.focus.momentum = clamp(speed / 24, 0, 1);
  state.focus.influence = clamp(state.focus.influence * 0.68 + state.focus.momentum * 0.65, 0, 1);
  state.focus.lastMoveAt = performance.now();
}

window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("resize", resize);

resize();
for (let i = 0; i < 26; i += 1) spawnUtterance(performance.now(), 0.2);
for (let i = 0; i < 16; i += 1) spawnWisp(0.2);
requestAnimationFrame(frame);
