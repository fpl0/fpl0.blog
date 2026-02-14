/** Explorer Animation Engine — procedural walking scene. */

const PI2 = Math.PI * 2;
const SCREEN_X = 0.35,
  WALK_SPEED = 45,
  GROUND_Y = 0.8,
  MAX_DT = 0.1,
  FADE = 60,
  BUCKETS = 5;
const HEAD_R = 5.5,
  TORSO = 14,
  NECK = 3,
  U_LEG = 8,
  L_LEG = 7,
  U_ARM = 6,
  L_ARM = 5;

// [type, startMultiplier, minInterval, maxInterval]
const SPAWN_CFG = [
  ["star", 0, 50, 100],
  ["cloud", 0.4, 180, 350],
  ["mountain", 0.8, 400, 700],
  ["bird", 0.5, 200, 400],
  ["meteor", 0.8, 400, 800],
  ["balloon", 2.2, 600, 1000],
  ["ufo", 3, 900, 1800],
  ["whale", 3.8, 1400, 2500],
  ["jellyfish", 2.5, 800, 1400],
  ["grassTuft", 0, 30, 70],
  ["pebble", 0.2, 40, 90],
];
const TYPES = SPAWN_CFG.map((c) => c[0]);

function rand(a, b) {
  return a + Math.random() * (b - a);
}
function randInt(a, b) {
  return Math.floor(rand(a, b + 1));
}

function entityAlpha(sx, parallax, w, base) {
  const edge = w - sx;
  return base * (0.3 + 0.7 * parallax) * (edge > 0 && edge < FADE ? edge / FADE : 1);
}

function footPathX(t, hs) {
  if (t < 0.6) return hs * (1 - t / 0.3);
  const s = (t - 0.6) * 2.5;
  return hs * (6 * s * s - 4 * s * s * s - 1);
}
function footLiftY(t, max) {
  return t < 0.6 ? 0 : Math.sin((t - 0.6) * 2.5 * Math.PI) * max;
}

function legIK(hx, hy, fx, fy) {
  const dx = fx - hx,
    dy = fy - hy,
    d = Math.sqrt(dx * dx + dy * dy);
  const h = d * 0.5,
    b = h < U_LEG ? Math.sqrt(U_LEG ** 2 - h ** 2) : 0;
  const inv = d > 0.1 ? b / d : 0;
  return [(hx + fx) * 0.5 + dy * inv, (hy + fy) * 0.5 - dx * inv];
}

function armFK(shX, shY, sign, phase) {
  const ua = sign * Math.cos(phase - 0.3) * 0.45;
  const ex = shX + Math.sin(ua) * U_ARM,
    ey = shY + Math.cos(ua) * U_ARM;
  const fa = sign * Math.cos(phase - 0.6) * 0.45 * 0.65;
  return [ex, ey, ex + Math.sin(fa) * L_ARM, ey + Math.cos(fa) * L_ARM];
}

// Whale body: start[2] + 12 curves x [cp1x,cp1y,cp1_wag, cp2x,cp2y,cp2_wag, ex,ey,e_wag]
// prettier-ignore
const WHALE_BODY = [
  -0.95, 0.02, -0.92, -0.12, 0, -0.75, -0.32, 0, -0.45, -0.36, 0, -0.15, -0.38, 0, 0.2, -0.34, 0,
  0.45, -0.26, 0, 0.52, -0.24, 0, 0.55, -0.3, 0, 0.58, -0.24, 0, 0.72, -0.16, 0.25, 0.88, -0.06,
  0.5, 0.98, -0.02, 0.7, 1.06, -0.04, 0.85, 1.18, -0.18, 1, 1.28, -0.26, 1, 1.3, -0.22, 1, 1.26,
  -0.14, 0.9, 1.12, -0.04, 0.75, 1.06, 0, 0.7, 1.06, 0.02, 0.7, 1.12, 0.06, 0.75, 1.26, 0.16, 0.9,
  1.3, 0.24, 1, 1.28, 0.28, 1, 1.18, 0.2, 1, 1.06, 0.08, 0.85, 0.98, 0.04, 0.7, 0.85, 0.1, 0.25,
  0.65, 0.2, 0, 0.4, 0.28, 0, 0.1, 0.34, 0, -0.25, 0.36, 0, -0.55, 0.3, 0, -0.78, 0.24, 0, -0.92,
  0.14, 0, -0.95, 0.02, 0,
];
// Whale pectoral fin: start[2] + 2 curves x 9
// prettier-ignore
const WHALE_FIN = [
  -0.3, 0.2, -0.38, 0.32, 0, -0.52, 0.42, 0, -0.62, 0.38, 0, -0.58, 0.32, 0, -0.44, 0.26, 0, -0.3,
  0.2, 0,
];

function drawBzPath(c, x, cy, s, tw, d) {
  const v = (j) => d[j] ?? 0;
  c.beginPath();
  c.moveTo(x + s * v(0), cy + s * v(1));
  for (let i = 2; i < d.length; i += 9)
    c.bezierCurveTo(
      x + s * v(i),
      cy + s * v(i + 1) + tw * v(i + 2),
      x + s * v(i + 3),
      cy + s * v(i + 4) + tw * v(i + 5),
      x + s * v(i + 6),
      cy + s * v(i + 7) + tw * v(i + 8),
    );
  c.closePath();
}

export function createExplorerEngine(options) {
  const { ctx, getColor, isMobile } = options;
  let { width, height, reducedMotion } = options;
  let baseGroundY = height * GROUND_Y,
    worldOffset = 0,
    walkPhase = 0,
    time = 0,
    wind = 0;
  const sm = isMobile ? 1.5 : 1;

  function readColors() {
    return {
      bg: getColor("--color-bg"),
      text: getColor("--color-text"),
      textMuted: getColor("--color-text-muted"),
      primary: getColor("--color-primary"),
      border: getColor("--color-border"),
      surface: getColor("--color-surface"),
    };
  }
  let colors = readColors();

  // Entity caps — mobile / desktop
  const C = isMobile
    ? {
        star: 18,
        cloud: 4,
        mountain: 10,
        bird: 6,
        ufo: 2,
        meteor: 1,
        balloon: 1,
        whale: 1,
        jellyfish: 1,
        grassTuft: 12,
        pebble: 6,
      }
    : {
        star: 30,
        cloud: 6,
        mountain: 12,
        bird: 8,
        ufo: 3,
        meteor: 2,
        balloon: 2,
        whale: 1,
        jellyfish: 2,
        grassTuft: 20,
        pebble: 10,
      };

  // Pre-allocated buffers for star alpha bucketing
  const starBuf = new Float64Array(C.star * 3),
    starAlphas = new Float64Array(C.star);

  // Free lists for object pooling
  const free = {};
  for (const t of TYPES) free[t] = [];

  // --- Entity creators (pop-or-default pooling) ---

  function createStar(wX) {
    const e = free.star.pop() || { parallax: 0.1 };
    e.worldX = wX;
    e.y = rand(height * 0.05, height * 0.45);
    e.size = 0.5 + Math.random() ** 2.5 * 2.8;
    e.twinkleOffset = rand(0, PI2);
    e.twinkleSpeed = rand(0.8, 2.5);
    return e;
  }

  function createCloud(wX) {
    const r = rand(6, 18),
      path = new Path2D();
    const radii = [
      r * rand(0.8, 0.95),
      r * rand(0.9, 1),
      r * rand(0.8, 0.95),
      r * rand(0.7, 0.9),
      r * rand(0.65, 0.85),
    ];
    const offsets = [
      [-r * 1.1, 0],
      [0, 0],
      [r * 1.1, 0],
      [-r * 0.5, -r * 0.7],
      [r * 0.4, -r * 0.65],
    ];
    for (let i = 0; i < 5; i++) {
      const cr = radii[i] ?? 0,
        off = offsets[i];
      if (!off) continue;
      path.moveTo(off[0] + cr, off[1]);
      path.arc(off[0], off[1], cr, 0, PI2);
    }
    const e = free.cloud.pop() || { parallax: 0.15 };
    e.worldX = wX;
    e.y = rand(height * 0.1, height * 0.35);
    e.path = path;
    e.driftSpeed = rand(1, 4);
    e.baseOpacity = rand(0.15, 0.25);
    return e;
  }

  function buildMtnPath(h, wL, wR, cLDx, cLDy, cRDx, cRDy) {
    const p = new Path2D();
    p.moveTo(-wL, 0);
    p.quadraticCurveTo(-wL * 0.5 + cLDx, -cLDy, 0, -h);
    p.quadraticCurveTo(wR * 0.5 + cRDx, -cRDy, wR, 0);
    p.closePath();
    return p;
  }

  function createMountain(wX, h, wL, wR) {
    const cLDx = rand(-0.15, 0.15) * wL,
      cLDy = rand(0.3, 0.6) * h;
    const cRDx = rand(-0.15, 0.15) * wR,
      cRDy = rand(0.3, 0.6) * h;
    const e = free.mountain.pop() || { parallax: 0.2 };
    e.worldX = wX;
    e.y = baseGroundY;
    e.peakHeight = h;
    e.leftWidth = wL;
    e.rightWidth = wR;
    e.path = buildMtnPath(h, wL, wR, cLDx, cLDy, cRDx, cRDy);
    return e;
  }

  function spawnMountainCluster(cX) {
    const n = randInt(3, 5),
      tmp = [];
    for (let i = 0; i < n; i++) {
      if (mountains.length + tmp.length >= C.mountain) break;
      const c = 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2 + 0.5);
      const h = Math.min(rand(55, 115) + c * rand(20, 50), baseGroundY * 0.85);
      tmp.push(
        createMountain(cX + (i - (n - 1) / 2) * rand(30, 55), h, rand(25, 65), rand(25, 65)),
      );
    }
    tmp.sort((a, b) => b.peakHeight - a.peakHeight);
    for (const p of tmp) mountains.push(p);
  }

  function createBird(wX) {
    const e = free.bird.pop() || { parallax: 0.5 };
    e.worldX = wX;
    e.y = rand(height * 0.1, height * 0.4);
    e.velocity = rand(10, 20);
    e.flapPhase = rand(0, PI2);
    e.wingspan = rand(5, 16);
    e.formationOffsetX = 0;
    e.formationOffsetY = 0;
    return e;
  }

  function spawnBirdGroup(screenX) {
    const wX = toWorldX(screenX, 0.5);
    const groupSize = Math.random() < 0.3 ? randInt(2, 3) : 1;
    const leader = createBird(wX);
    leader.worldX = wX;
    birds.push(leader);
    for (let i = 1; i < groupSize; i++) {
      if (birds.length >= C.bird) break;
      const f = createBird(wX);
      f.worldX = wX;
      f.y = leader.y;
      f.velocity = leader.velocity;
      f.formationOffsetX = -rand(12, 20) * i;
      f.formationOffsetY = (i % 2 === 0 ? -1 : 1) * rand(6, 12) * i;
      birds.push(f);
    }
  }

  function createUfo(wX) {
    const e = free.ufo.pop() || { parallax: 0.6 };
    e.worldX = wX;
    e.y = rand(height * 0.08, height * 0.25);
    e.size = rand(0.6, 1.4);
    e.hoverPhase = rand(0, PI2);
    e.hasTractorBeam = Math.random() > 0.5;
    return e;
  }

  function createMeteor(wX) {
    const e = free.meteor.pop() || { parallax: 0.05 };
    e.worldX = wX;
    e.y = rand(height * 0.02, height * 0.2);
    e.angle = rand(0.15, 0.4);
    e.speed = rand(200, 350);
    e.life = 2;
    e.maxLife = 2;
    e.tailLen = rand(25, 80);
    return e;
  }

  function createBalloon(wX) {
    const e = free.balloon.pop() || { parallax: 0.35 };
    e.worldX = wX;
    e.y = rand(height * 0.08, height * 0.3);
    e.size = rand(8, 20);
    e.driftSpeed = rand(4, 12);
    e.swayPhase = rand(0, PI2);
    return e;
  }

  function createWhale(wX) {
    const s = rand(40, 95),
      minY = s * 0.42 + 4,
      maxY = height * 0.45 - s * 0.42;
    const e = free.whale.pop() || { parallax: 0.55 };
    e.worldX = wX;
    e.y = rand(Math.max(minY, height * 0.12), Math.max(minY, maxY));
    e.size = s;
    e.velocity = 0;
    e.bobPhase = rand(0, PI2);
    return e;
  }

  function createJellyfish(wX) {
    const tc = randInt(3, 5);
    const e = free.jellyfish.pop() || { parallax: 0.4 };
    e.worldX = wX;
    e.y = rand(height * 0.1, height * 0.4);
    e.size = rand(6, 16);
    e.pulsePhase = rand(0, PI2);
    e.driftSpeed = rand(2, 6);
    e.tentacleCount = tc;
    e.tentaclePhases = Array.from({ length: tc }, () => rand(0, PI2));
    return e;
  }

  function createGrassTuft(wX) {
    const bc = randInt(2, 3);
    const e = free.grassTuft.pop() || { parallax: 1 };
    e.worldX = wX;
    e.y = baseGroundY;
    e.bladeCount = bc;
    e.bladeHeight = rand(3, 11);
    e.bladeAngles = Array.from({ length: bc }, () => rand(-0.4, 0.4));
    return e;
  }

  function createPebble(wX) {
    const e = free.pebble.pop() || { parallax: 1 };
    e.worldX = wX;
    e.y = baseGroundY + rand(1, 3);
    e.radius = rand(0.8, 3.5);
    return e;
  }

  // --- Entity arrays & pool registry ---
  const stars = [],
    clouds = [],
    mountains = [],
    birds = [],
    ufos = [];
  const meteors = [],
    balloons = [],
    whales = [],
    jfish = [],
    grassTufts = [],
    pebbles = [];
  const pools = {
    star: stars,
    cloud: clouds,
    mountain: mountains,
    bird: birds,
    ufo: ufos,
    meteor: meteors,
    balloon: balloons,
    whale: whales,
    jellyfish: jfish,
    grassTuft: grassTufts,
    pebble: pebbles,
  };
  const creators = {
    star: createStar,
    cloud: createCloud,
    ufo: createUfo,
    meteor: createMeteor,
    balloon: createBalloon,
    whale: createWhale,
    jellyfish: createJellyfish,
    grassTuft: createGrassTuft,
    pebble: createPebble,
  };

  // --- Spawn logic ---
  const spawners = {};
  for (const [type, start, min, max] of SPAWN_CFG)
    spawners[type] = { next: width * start, min: min * sm, max: max * sm };

  function toWorldX(screenX, parallax) {
    return screenX + worldOffset * parallax;
  }

  function spawnEntity(type, screenX) {
    if (type === "mountain") {
      spawnMountainCluster(toWorldX(screenX, 0.2));
      return;
    }
    if (type === "bird") {
      spawnBirdGroup(screenX);
      return;
    }
    const creator = creators[type];
    if (!creator) return;
    const e = creator(0);
    e.worldX = toWorldX(screenX, e.parallax);
    pools[type].push(e);
  }

  function trySpawn(type) {
    const sp = spawners[type],
      rightEdge = worldOffset + width;
    if (rightEdge < sp.next) return;
    if (pools[type].length >= C[type]) {
      sp.next = rightEdge + rand(sp.min, sp.max);
      return;
    }
    spawnEntity(type, width + rand(20, 80));
    sp.next = rightEdge + rand(sp.min, sp.max);
  }

  // --- Culling (swap-and-pop with recycling) ---
  function sX(wx, p) {
    return wx - worldOffset * p;
  }

  function cull(arr, fl, alive) {
    let i = 0;
    while (i < arr.length) {
      const e = arr[i];
      if (!e) {
        i++;
        continue;
      }
      if (sX(e.worldX, e.parallax) < -200 || (alive && !alive(e))) {
        fl.push(e);
        const last = arr[arr.length - 1];
        if (last !== undefined) arr[i] = last;
        arr.pop();
      } else i++;
    }
  }

  function cullAll() {
    for (const t of TYPES) cull(pools[t], free[t], t === "meteor" ? (m) => m.life > 0 : undefined);
  }

  // --- Drawing ---

  function collectVisibleStars() {
    let vis = 0;
    for (const e of stars) {
      const x = sX(e.worldX, e.parallax);
      if (x < -10 || x > width + 10) continue;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * e.twinkleSpeed + e.twinkleOffset));
      starBuf[vis * 3] = x;
      starBuf[vis * 3 + 1] = e.y;
      starBuf[vis * 3 + 2] = e.size;
      starAlphas[vis] = entityAlpha(x, e.parallax, width, tw);
      vis++;
    }
    return vis;
  }

  function drawStarBucket(lo, hi, isLast, vis) {
    ctx.globalAlpha = (lo + hi) * 0.5;
    let has = false;
    ctx.beginPath();
    for (let j = 0; j < vis; j++) {
      const a = starAlphas[j] ?? 0;
      if (a >= lo && (isLast || a < hi)) {
        const sx = starBuf[j * 3] ?? 0,
          sy = starBuf[j * 3 + 1] ?? 0,
          sr = starBuf[j * 3 + 2] ?? 0;
        ctx.moveTo(sx + sr, sy);
        ctx.arc(sx, sy, sr, 0, PI2);
        has = true;
      }
    }
    if (has) ctx.fill();
  }

  function drawStars() {
    ctx.fillStyle = colors.textMuted;
    const vis = collectVisibleStars();
    for (let b = 0; b < BUCKETS; b++)
      drawStarBucket(b / BUCKETS, (b + 1) / BUCKETS, b === BUCKETS - 1, vis);
    ctx.globalAlpha = 1;
  }

  function drawClouds() {
    ctx.fillStyle = colors.textMuted;
    for (const e of clouds) {
      const x = sX(e.worldX, e.parallax);
      if (x < -60 || x > width + 60) continue;
      ctx.globalAlpha = entityAlpha(x, e.parallax, width, e.baseOpacity);
      ctx.save();
      ctx.translate(x, e.y);
      ctx.fill(e.path);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawMeteors() {
    for (const e of meteors) {
      const x = sX(e.worldX, e.parallax),
        opacity = e.life / e.maxLife;
      const ms = e.tailLen / 50;
      const tdx = Math.cos(e.angle) * e.tailLen * 1.5,
        tdy = Math.sin(e.angle) * e.tailLen * 1.5;
      const alpha = entityAlpha(x, e.parallax, width, opacity);
      ctx.strokeStyle = colors.primary;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.5 + ms;
      ctx.globalAlpha = alpha * 0.4;
      ctx.beginPath();
      ctx.moveTo(x, e.y);
      ctx.lineTo(x + tdx, e.y - tdy);
      ctx.stroke();
      ctx.lineWidth = 1 + ms * 0.7;
      ctx.globalAlpha = alpha * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, e.y);
      ctx.lineTo(x + tdx * 0.5, e.y - tdy * 0.5);
      ctx.stroke();
      ctx.fillStyle = colors.primary;
      ctx.globalAlpha = alpha * 0.4;
      ctx.beginPath();
      ctx.arc(x, e.y, 2 + ms * 2, 0, PI2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, e.y, 1 + ms, 0, PI2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawWhales() {
    for (const e of whales) {
      const x = sX(e.worldX, e.parallax);
      if (x < -120 || x > width + 120) continue;
      const bob = Math.sin(e.bobPhase) * 4,
        cy = e.y + bob,
        s = e.size;
      const tailWag = Math.sin(e.bobPhase * 1.6) * s * 0.08;
      const alpha = entityAlpha(x, e.parallax, width, 1);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = colors.textMuted;
      ctx.globalAlpha = alpha * 0.7;
      drawBzPath(ctx, x, cy, s, tailWag, WHALE_BODY);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.55;
      drawBzPath(ctx, x, cy, s, 0, WHALE_FIN);
      ctx.fill();
      ctx.strokeStyle = colors.surface;
      ctx.globalAlpha = alpha * 0.3;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let g = 0; g < 3; g++) {
        const gy = cy + s * (0.12 + g * 0.06),
          gs = x - s * (0.55 - g * 0.1),
          ge = x + s * (0.1 - g * 0.04);
        ctx.moveTo(gs, gy);
        ctx.quadraticCurveTo((gs + ge) * 0.5, gy + s * 0.03, ge, gy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawJellyfish() {
    for (const e of jfish) {
      const x = sX(e.worldX, e.parallax);
      if (x < -30 || x > width + 30) continue;
      const s = e.size,
        pulse = Math.sin(e.pulsePhase) * 0.15;
      const bellW = s * (0.7 + pulse),
        bellH = s * (0.55 - pulse * 0.3);
      const alpha = entityAlpha(x, e.parallax, width, 0.55);
      ctx.fillStyle = colors.primary;
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.ellipse(x, e.y, bellW, bellH, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.ellipse(x, e.y, bellW * 1.02, bellH * 0.3, 0, 0, Math.PI);
      ctx.stroke();
      ctx.strokeStyle = colors.textMuted;
      ctx.lineWidth = 0.6;
      ctx.lineCap = "round";
      ctx.globalAlpha = alpha * 0.45;
      const tentSpacing = (bellW * 2) / (e.tentacleCount + 1);
      for (let t = 0; t < e.tentacleCount; t++) {
        const tPhase = e.tentaclePhases[t] ?? 0;
        const tx = x - bellW + tentSpacing * (t + 1),
          tentLen = s * rand(0.8, 1.4);
        const sway = Math.sin(tPhase + time * 1.5) * s * 0.15 + wind * 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, e.y);
        ctx.quadraticCurveTo(tx + sway, e.y + tentLen * 0.5, tx + sway * 0.6, e.y + tentLen);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawBalloons() {
    for (const e of balloons) {
      const x = sX(e.worldX, e.parallax);
      if (x < -30 || x > width + 30) continue;
      const sway = Math.sin(e.swayPhase) * 3 + wind * 2,
        s = e.size;
      const alpha = entityAlpha(x, e.parallax, width, 0.6),
        bx = x + sway;
      ctx.fillStyle = colors.primary;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(bx, e.y, s * 0.6, s * 0.75, 0, 0, PI2);
      ctx.fill();
      ctx.strokeStyle = colors.textMuted;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = alpha * 0.83;
      const basketY = e.y + s;
      ctx.beginPath();
      ctx.moveTo(bx - s * 0.3, e.y + s * 0.6);
      ctx.lineTo(bx - 3, basketY);
      ctx.moveTo(bx + s * 0.3, e.y + s * 0.6);
      ctx.lineTo(bx + 3, basketY);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.rect(bx - 4, basketY, 8, 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawMountains() {
    for (const e of mountains) {
      const x = sX(e.worldX, e.parallax);
      if (x + e.rightWidth < -10 || x - e.leftWidth > width + 10) continue;
      ctx.globalAlpha = entityAlpha(x, e.parallax, width, 1);
      ctx.save();
      ctx.translate(x, e.y);
      ctx.fillStyle = colors.border;
      ctx.fill(e.path);
      ctx.strokeStyle = colors.textMuted;
      ctx.lineWidth = 1;
      ctx.stroke(e.path);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawGroundLine() {
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(0, baseGroundY);
    ctx.lineTo(width, baseGroundY);
    ctx.stroke();
  }

  function addBlades(x, y, e) {
    for (let j = 0; j < e.bladeCount; j++) {
      const angle = (e.bladeAngles[j] ?? 0) + wind * 0.3;
      const bx = x + (j - (e.bladeCount - 1) * 0.5) * 3;
      ctx.moveTo(bx, y);
      ctx.lineTo(bx + Math.sin(angle) * e.bladeHeight, y - Math.cos(angle) * e.bladeHeight);
    }
  }

  function batchGrassTufts() {
    let has = false;
    for (const e of grassTufts) {
      const x = sX(e.worldX, e.parallax);
      if (x < -15 || x > width + 15) continue;
      if (width - x >= FADE) {
        addBlades(x, e.y, e);
        has = true;
      }
    }
    return has;
  }

  function drawFadingGrassTufts() {
    for (const e of grassTufts) {
      const x = sX(e.worldX, e.parallax);
      if (x < -15 || x > width + 15 || width - x >= FADE) continue;
      ctx.globalAlpha = entityAlpha(x, e.parallax, width, 0.45);
      ctx.beginPath();
      addBlades(x, e.y, e);
      ctx.stroke();
    }
  }

  function drawGrassTufts() {
    ctx.strokeStyle = colors.textMuted;
    ctx.lineWidth = 0.8;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    if (batchGrassTufts()) ctx.stroke();
    drawFadingGrassTufts();
    ctx.globalAlpha = 1;
  }

  function batchPebbles() {
    let has = false;
    for (const e of pebbles) {
      const x = sX(e.worldX, e.parallax);
      if (x < -5 || x > width + 5) continue;
      if (width - x >= FADE) {
        ctx.moveTo(x + e.radius, e.y);
        ctx.arc(x, e.y, e.radius, 0, PI2);
        has = true;
      }
    }
    return has;
  }

  function drawFadingPebbles() {
    for (const e of pebbles) {
      const x = sX(e.worldX, e.parallax);
      if (x < -5 || x > width + 5 || width - x >= FADE) continue;
      ctx.globalAlpha = entityAlpha(x, e.parallax, width, 0.4);
      ctx.beginPath();
      ctx.arc(x, e.y, e.radius, 0, PI2);
      ctx.fill();
    }
  }

  function drawPebbles() {
    ctx.fillStyle = colors.textMuted;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    if (batchPebbles()) ctx.fill();
    drawFadingPebbles();
    ctx.globalAlpha = 1;
  }

  function drawBirds() {
    for (const e of birds) {
      const x = sX(e.worldX, e.parallax) + e.formationOffsetX,
        y = e.y + e.formationOffsetY;
      if (x < -20 || x > width + 20) continue;
      const sinPhase = Math.sin(e.flapPhase);
      const flap = Math.sign(sinPhase) * Math.abs(sinPhase) ** 0.7 * 0.6;
      const ws = e.wingspan,
        bodyRise = Math.max(0, -sinPhase) * 1.5;
      ctx.strokeStyle = colors.textMuted;
      ctx.lineWidth = 0.8 + ws * 0.06;
      ctx.lineCap = "round";
      ctx.globalAlpha = entityAlpha(x, e.parallax, width, 0.7);
      ctx.beginPath();
      ctx.moveTo(x - ws, y - bodyRise - flap * ws * 0.5);
      ctx.lineTo(x, y - bodyRise);
      ctx.lineTo(x + ws, y - bodyRise - flap * ws * 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawUfos() {
    for (const e of ufos) {
      const x = sX(e.worldX, e.parallax);
      if (x < -40 || x > width + 40) continue;
      const s = e.size,
        hoverY = e.y + Math.sin(e.hoverPhase) * 4 * s;
      const alpha = entityAlpha(x, e.parallax, width, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors.primary;
      ctx.beginPath();
      ctx.ellipse(x, hoverY, 16 * s, 6 * s, 0, 0, PI2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, hoverY - 5 * s, 8 * s, Math.PI, 0);
      ctx.fill();
      if (e.hasTractorBeam) {
        ctx.globalAlpha = alpha * 0.15;
        ctx.beginPath();
        ctx.moveTo(x - 10 * s, hoverY + 6 * s);
        ctx.lineTo(x + 10 * s, hoverY + 6 * s);
        ctx.lineTo(x + 22 * s, baseGroundY);
        ctx.lineTo(x - 22 * s, baseGroundY);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // --- Stickman ---

  function drawStickman() {
    const stickX = width * SCREEN_X,
      feetY = baseGroundY - 1,
      legRoom = U_LEG + L_LEG - 2;
    let hipX, hipY, shX, shY, nkX, nkY, hdX, hdY, lk, rk, lf, rf, la, ra;

    if (reducedMotion) {
      hipX = stickX;
      hipY = feetY - legRoom;
      shY = hipY - TORSO;
      nkY = shY - NECK;
      hdY = nkY - HEAD_R;
      shX = nkX = hdX = stickX;
      const knY = hipY + U_LEG - 1,
        armY = shY + U_ARM + L_ARM * 0.5;
      lf = [stickX - 2, feetY];
      rf = [stickX + 2, feetY];
      lk = [stickX - 1.5, knY];
      rk = [stickX + 1.5, knY];
      la = [stickX - 1.5, shY + U_ARM, stickX - 2, armY];
      ra = [stickX + 1.5, shY + U_ARM, stickX + 2, armY];
    } else {
      const leftT = (walkPhase % PI2) / PI2,
        rightT = (leftT + 0.5) % 1;
      const bob = Math.abs(Math.sin(walkPhase * 2)) * 1.2;
      const twist = Math.sin(walkPhase) * 1,
        lean = Math.sin(0.03);
      hipX = stickX;
      hipY = feetY - legRoom - bob;
      shY = hipY - TORSO;
      nkY = shY - NECK;
      hdY = nkY - HEAD_R - bob * 0.15;
      shX = stickX + lean * TORSO + twist;
      nkX = stickX + lean * (TORSO + NECK) + twist * 0.5;
      hdX = stickX + lean * (TORSO + NECK + HEAD_R) + twist * 0.25;
      const lfx = hipX + footPathX(leftT, 6),
        lfy = feetY - footLiftY(leftT, 6);
      const rfx = hipX + footPathX(rightT, 6),
        rfy = feetY - footLiftY(rightT, 6);
      lf = [lfx, lfy];
      rf = [rfx, rfy];
      lk = legIK(hipX, hipY, lfx, lfy);
      rk = legIK(hipX, hipY, rfx, rfy);
      la = armFK(shX, shY, -1, walkPhase);
      ra = armFK(shX, shY, 1, walkPhase);
    }

    ctx.strokeStyle = colors.text;
    ctx.fillStyle = colors.text;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(hdX, hdY, HEAD_R, 0, PI2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(nkX, nkY);
    ctx.lineTo(hipX, hipY);
    ctx.moveTo(shX, shY);
    ctx.lineTo(la[0], la[1]);
    ctx.lineTo(la[2], la[3]);
    ctx.moveTo(shX, shY);
    ctx.lineTo(ra[0], ra[1]);
    ctx.lineTo(ra[2], ra[3]);
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(lk[0], lk[1]);
    ctx.lineTo(lf[0], lf[1]);
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(rk[0], rk[1]);
    ctx.lineTo(rf[0], rf[1]);
    ctx.stroke();
  }

  // --- Seed (initial scene) ---

  function seedSky() {
    const starCount = isMobile ? 14 : 20;
    for (let i = 0; i < starCount; i++)
      stars.push(createStar(width * (i / starCount) + rand(0, width / starCount)));
    const cloudCount = isMobile ? 3 : 4;
    for (let i = 0; i < cloudCount; i++)
      clouds.push(createCloud(width * rand(i / cloudCount, (i + 0.7) / cloudCount)));
    balloons.push(createBalloon(width * rand(0.55, 0.8)));
  }

  function seedBirds() {
    const b1 = createBird(width * rand(0.25, 0.4));
    b1.flapPhase = rand(0, PI2);
    birds.push(b1);
    const leader = createBird(width * rand(0.65, 0.85));
    leader.flapPhase = rand(0, PI2);
    birds.push(leader);
    if (birds.length < C.bird) {
      const f = createBird(leader.worldX);
      f.flapPhase = rand(0, PI2);
      f.y = leader.y;
      f.velocity = leader.velocity;
      f.formationOffsetX = -rand(12, 18);
      f.formationOffsetY = rand(6, 10);
      birds.push(f);
    }
  }

  function seedGround() {
    spawnMountainCluster(width * rand(0.2, 0.35));
    spawnMountainCluster(width * rand(0.7, 0.9));
    const grassCount = isMobile ? 8 : 12;
    for (let i = 0; i < grassCount; i++)
      grassTufts.push(
        createGrassTuft(width * (i / grassCount) + rand(0, (width / grassCount) * 0.8)),
      );
    const pebbleCount = isMobile ? 4 : 6;
    for (let i = 0; i < pebbleCount; i++)
      pebbles.push(createPebble(width * (i / pebbleCount) + rand(0, (width / pebbleCount) * 0.8)));
  }

  function seed() {
    for (const t of TYPES) {
      pools[t].length = 0;
      free[t].length = 0;
    }
    seedSky();
    seedBirds();
    seedGround();
  }

  // --- Update ---

  function tickFlyers(d) {
    for (const e of birds) {
      e.worldX += (e.velocity + wind * 5) * d;
      e.flapPhase += d * 6;
    }
    for (const e of ufos) e.hoverPhase += d * 2;
    for (const e of meteors) {
      e.worldX -= Math.cos(e.angle) * e.speed * d;
      e.y += Math.sin(e.angle) * e.speed * d;
      e.life -= d * 1.5;
    }
  }

  function tickDrifters(d) {
    for (const e of balloons) {
      e.worldX += (e.driftSpeed + wind * 3) * d;
      e.swayPhase += d * 1.5;
    }
    for (const e of whales) {
      e.worldX += e.velocity * d;
      e.bobPhase += d * 1.2;
    }
    for (const e of jfish) {
      e.worldX += (e.driftSpeed + wind * 2) * d;
      e.pulsePhase += d * 2.5;
    }
    for (const e of clouds) e.worldX += (e.driftSpeed + wind * 2) * d;
  }

  function update(dt) {
    if (reducedMotion) return;
    const d = Math.min(dt, MAX_DT);
    time += d;
    worldOffset += WALK_SPEED * d;
    walkPhase += d * 5;
    wind = Math.sin(time * 0.2) * 0.3 + Math.sin(time * 0.07) * 0.2;
    tickFlyers(d);
    tickDrifters(d);
    for (const t of TYPES) trySpawn(t);
    cullAll();
  }

  // --- Public API ---

  function draw() {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    drawStars();
    drawMeteors();
    drawClouds();
    drawWhales();
    drawJellyfish();
    drawBalloons();
    drawMountains();
    drawGroundLine();
    drawPebbles();
    drawGrassTufts();
    drawBirds();
    drawUfos();
    drawStickman();
  }

  function resize(w, h) {
    width = w;
    height = h;
    baseGroundY = height * GROUND_Y;
  }
  function onThemeChange() {
    colors = readColors();
  }
  function setReducedMotion(enabled) {
    reducedMotion = enabled;
    if (enabled) {
      worldOffset = 0;
      walkPhase = 0;
      time = 0;
      wind = 0;
      seed();
    }
  }

  seed();
  return { update, draw, resize, onThemeChange, setReducedMotion };
}
