// ---------- Python-compatible Mersenne Twister (random.Random(21)) ----------
class PyRandom {
  constructor(seed) {
    this.mt = new Array(624); this.i = 625;
    this.initGen(19650218);
    const key = [seed], kl = 1; let i = 1, j = 0;
    for (let k = Math.max(624, kl); k; k--) {
      const p = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = ((this.mt[i] ^ (((((p & 0xffff0000) >>> 16) * 1664525) << 16) + (p & 0xffff) * 1664525)) + key[j] + j) >>> 0;
      i++; j++;
      if (i >= 624) { this.mt[0] = this.mt[623]; i = 1; }
      if (j >= kl) j = 0;
    }
    for (let k = 623; k; k--) {
      const p = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
      this.mt[i] = ((this.mt[i] ^ (((((p & 0xffff0000) >>> 16) * 1566083941) << 16) + (p & 0xffff) * 1566083941)) - i) >>> 0;
      i++;
      if (i >= 624) { this.mt[0] = this.mt[623]; i = 1; }
    }
    this.mt[0] = 0x80000000; this.i = 624;
  }
  initGen(s) {
    this.mt[0] = s >>> 0;
    for (let k = 1; k < 624; k++) {
      const p = this.mt[k - 1] ^ (this.mt[k - 1] >>> 30);
      this.mt[k] = (((((p & 0xffff0000) >>> 16) * 1812433253) << 16) + (p & 0xffff) * 1812433253 + k) >>> 0;
    }
  }
  next32() {
    if (this.i >= 624) {
      const m = this.mt; let k;
      for (k = 0; k < 624; k++) {
        const y = (m[k] & 0x80000000) | (m[(k + 1) % 624] & 0x7fffffff);
        m[k] = (m[(k + 397) % 624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0)) >>> 0;
      }
      this.i = 0;
    }
    let y = this.mt[this.i++];
    y ^= y >>> 11; y ^= (y << 7) & 0x9d2c5680; y ^= (y << 15) & 0xefc60000; y ^= y >>> 18;
    return y >>> 0;
  }
  random() { const a = this.next32() >>> 5, b = this.next32() >>> 6; return (a * 67108864 + b) / 9007199254740992; }
  uniform(a, b) { return a + (b - a) * this.random(); }
}

// ---------- constants ----------
const FPS = 24, SPIN_SPEED = 0.6, TILT = 0.30, CAM_DIST = 4.0, NUM_HEARTS = 18, PIVOT_Y = 0.2;
const MESSAGE = "for you ♥";
const WHITE = [244, 248, 251, 254, 255, 231];
const PINK = [125, 162, 168, 205, 211, 218, 225];
const RED = [52, 88, 124, 160, 196, 203];
const PURPLE = [54, 91, 97, 134, 140, 183];
const YELLOW = [136, 178, 214, 220, 226, 229];
const ORANGE = [130, 166, 202, 208, 214, 216];
const GOLD_CENTER = [94, 136, 178, 214, 220];
const DARK_CENTER = [52, 58, 94, 130, 136];
const GREENS = [22, 28, 28, 34, 35, 71, 77, 114];
const PAPER = [101, 144, 187, 223, 230, 231];
const RIBBON = [88, 125, 161, 197, 204, 211];
const HEART_COLORS = [161, 197, 204, 205, 211, 218];
const MSG_COLORS = [161, 168, 205, 211, 218, 225, 218, 211, 205, 168];
const SHADE = ".:-=+*%@", PETAL_SHADE = "+*#%";
const _l = Math.hypot(-0.45, 0.6, 0.66);
const LX = -0.45 / _l, LY = 0.6 / _l, LZ = 0.66 / _l;
const DISC_TYPES = [
  [WHITE, GOLD_CENTER, 13], [PINK, GOLD_CENTER, 8], [RED, DARK_CENTER, 6],
  [PURPLE, GOLD_CENTER, 7], [YELLOW, DARK_CENTER, 12], [ORANGE, DARK_CENTER, 9],
];
const TULIP_COLORS = [RED, PINK, YELLOW];

// xterm 256-colour palette
const STD = ["#000000", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080", "#c0c0c0",
  "#808080", "#ff0000", "#00ff00", "#ffff00", "#0000ff", "#ff00ff", "#00ffff", "#ffffff"];
const LV = [0, 95, 135, 175, 215, 255];
function xterm(n) {
  if (n < 16) return STD[n];
  if (n >= 232) { const v = 8 + 10 * (n - 232); return `rgb(${v},${v},${v})`; }
  n -= 16; return `rgb(${LV[Math.floor(n / 36)]},${LV[Math.floor(n / 6) % 6]},${LV[n % 6]})`;
}

// ---------- helpers ----------
const norm = v => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
const clamp = b => Math.min(0.999, Math.max(0, b));

// ---------- scene ----------
function buildScene() {
  const rnd = new PyRandom(21), pts = [], neck = [0, -0.12, 0];
  const C = [0, 0.12, 0], D = 0.64, N = 10, golden = Math.PI * (3 - Math.sqrt(5)), heads = [];
  for (let i = 0; i < N; i++) {
    const el = (88 - 60 * Math.sqrt(i / (N - 1))) * Math.PI / 180, az = i * golden;
    const d = [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)];
    heads.push([add(C, d, D * rnd.uniform(0.92, 1.05)), norm(d)]);
  }
  const tulipSlots = [3, 8], flowers = [];
  let discI = 0;
  heads.forEach(([pos, axis], idx) => {
    const base = add(pos, axis, -0.03);
    for (let j = 0; j < 70; j++) {
      const t = j / 69;
      pts.push([base[0] + (neck[0] - base[0]) * t, base[1] + (neck[1] - base[1]) * t, base[2] + (neck[2] - base[2]) * t,
        axis[0], 0, axis[2], GREENS, -0.15, true, null]);
    }
    if (tulipSlots.includes(idx)) {
      const nT = tulipSlots.filter(k => k < idx).length;
      flowers.push([pos, "tulip", TULIP_COLORS[nT % 3], null, 0, 0.11, rnd.uniform(0, 6.28)]);
    } else {
      const [petals, center, nPet] = DISC_TYPES[discI % DISC_TYPES.length]; discI++;
      const R = rnd.uniform(0.12, 0.14), seed = rnd.uniform(0, 6.28);
      flowers.push([pos, "disc", petals, center, nPet, R, seed]);
    }
  });
  for (let i = 0; i < 8; i++) {
    const a = (i + 0.4) / 8 * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    const base = [0.26 * c, 0.30, 0.26 * s], d = norm([c, 0.15, s]), side = [-s, 0, c], n = norm(cross(side, d));
    const L = 0.30, W = 0.07;
    for (let ti = 0; ti < 32; ti++) {
      const t = ti / 31;
      for (let wi = -5; wi <= 5; wi++) {
        const w = wi / 5, curl = 0.025 * w * w, sw = W * Math.sin(Math.PI * t) * w;
        pts.push([base[0] + d[0] * L * t + side[0] * sw + n[0] * curl,
          base[1] + d[1] * L * t - 0.10 * t * t + n[1] * curl,
          base[2] + d[2] * L * t + side[2] * sw + n[2] * curl,
          n[0], n[1], n[2], GREENS, wi === 0 ? -0.25 : 0, true, null]);
      }
    }
  }
  const y0 = -0.20, y1 = 0.30, r0 = 0.06, r1 = 0.36, k = (r1 - r0) / (y1 - y0), rings = 50;
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1), r = r0 + (r1 - r0) * t, count = Math.max(8, Math.trunc(170 * r));
    for (let j = 0; j < count; j++) {
      const ph = (j + rnd.random()) / count * 2 * Math.PI, c = Math.cos(ph), s = Math.sin(ph);
      let y = y0 + (y1 - y0) * t;
      if (t > 0.9) y += 0.03 * Math.sin(9 * ph);
      const fold = 0.3 * (Math.abs(Math.sin(5 * ph)) - 0.6), nn = norm([c, -k, s]);
      pts.push([r * c, y, r * s, nn[0], nn[1], nn[2], PAPER, fold, false, null]);
    }
  }
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * 2 * Math.PI, sx = 0.025 * Math.cos(a), sz = 0.025 * Math.sin(a);
    for (let j = 0; j < 40; j++) {
      const t = j / 39;
      pts.push([sx * (1 + 1.2 * t), -0.20 - 0.30 * t, sz * (1 + 1.2 * t), Math.cos(a), 0, Math.sin(a), GREENS, -0.1, true, null]);
    }
  }
  const by = -0.12, br = r0 + k * (by - y0) + 0.01;
  for (let j = 0; j < 90; j++) {
    const ph = j / 90 * 2 * Math.PI;
    for (const dy of [-0.012, 0, 0.012])
      pts.push([br * Math.cos(ph), by + dy, br * Math.sin(ph), Math.cos(ph), 0, Math.sin(ph), RIBBON, 0, false, null]);
  }
  const knot = [0, by, br + 0.01];
  for (const side of [-1, 1]) {
    for (let j = 0; j < 70; j++) {
      const a = j / 70 * 2 * Math.PI, lx = side * (0.07 + 0.07 * Math.cos(a));
      const ly = 0.04 * Math.sin(a) + 0.02 * (0.07 + 0.07 * Math.cos(a)) / 0.14;
      for (const fill of [1.0, 0.7])
        pts.push([knot[0] + lx * fill, knot[1] + ly * fill, knot[2] + 0.01, side * 0.3, 0.2, 0.93, RIBBON, 0.1, true, null]);
    }
    for (let j = 0; j < 30; j++) {
      const t = j / 29;
      pts.push([knot[0] + side * 0.06 * t, knot[1] - 0.15 * t, knot[2] + 0.015, side * 0.2, 0, 0.98,
        RIBBON, -0.05 + 0.05 * Math.sin(t * 9), true, null]);
    }
  }
  for (const dx of [-0.01, 0, 0.01]) pts.push([dx, by, knot[2] + 0.02, 0, 0, 1, RIBBON, 0.2, true, "@"]);

  const babies = [];
  for (let i = 0; i < 90; i++) {
    const a = rnd.random() * 2 * Math.PI, el = rnd.uniform(0.3, 1.4), rr = rnd.uniform(0.40, 0.58);
    babies.push([rr * Math.cos(a) * Math.cos(el), C[1] + rr * Math.sin(el), rr * Math.sin(a) * Math.cos(el), rnd.uniform(0, 6.28)]);
  }
  const sparkles = [];
  for (let i = 0; i < 30; i++) {
    const a = rnd.random() * 2 * Math.PI, rr = rnd.uniform(0.75, 0.95);
    const x = rr * Math.cos(a), y = rnd.uniform(-0.3, 1.0), z = rr * Math.sin(a);
    const ph = rnd.uniform(0, 6.28), sp = rnd.uniform(1.5, 4.0);
    sparkles.push([x, y, z, ph, sp]);
  }
  return { pts, flowers, babies, sparkles };
}

// ---------- hearts ----------
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function updateHearts(hearts, dt) {
  while (hearts.length < NUM_HEARTS)
    hearts.push([Math.random(), 1 + Math.random(), 0.03 + Math.random() * 0.05, Math.random() * 6.28, pick(HEART_COLORS)]);
  for (const h of hearts) {
    h[1] -= h[2] * dt;
    if (h[1] < 0) { h[0] = Math.random(); h[1] = 1; h[4] = pick(HEART_COLORS); }
  }
}

// ---------- render ----------
function render(scene, t, cols, rows, hearts) {
  const { pts, flowers, babies, sparkles } = scene;
  const chars = Array.from({ length: rows }, () => Array(cols).fill(" "));
  const colors = Array.from({ length: rows }, () => Array(cols).fill(0));
  const zbuf = Array.from({ length: rows }, () => Array(cols).fill(-1e9));
  const viewRows = rows - 2;
  const scale = Math.max(1, Math.min((viewRows - 2) / 1.45, (cols - 2) / 2.7));
  const sxScale = scale * 2, cx = cols / 2, cy = 1 + 0.78 * scale;
  const ang = t * SPIN_SPEED, ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(TILT), st = Math.sin(TILT);

  const projectF = (x, y, z) => {
    const xr = x * ca - z * sa, zr = x * sa + z * ca, yp = y - PIVOT_Y;
    const yt = yp * ct - zr * st, zt = yp * st + zr * ct, f = CAM_DIST / (CAM_DIST - zt);
    return [cx + xr * f * sxScale, cy - yt * f * scale, zt, f];
  };
  const project = (x, y, z) => { const p = projectF(x, y, z); return [Math.trunc(p[0]), Math.trunc(p[1]), p[2]]; };
  const plot = (col, row, z, ch, color) => {
    if (row >= 0 && row < viewRows && col >= 0 && col < cols && z > zbuf[row][col]) {
      zbuf[row][col] = z; chars[row][col] = ch; colors[row][col] = color;
    }
  };

  for (const [x, y, , phase, color] of hearts) {
    let col = Math.trunc((x + 0.015 * Math.sin(t * 1.2 + phase)) * cols);
    col = ((col % cols) + cols) % cols;
    plot(col, Math.trunc(y * viewRows), -50, "♥", color);
  }
  for (const [x, y, z, nx, ny, nz, pal, tone, two, ov] of pts) {
    const [col, row, zt] = project(x, y, z);
    const nxr = nx * ca - nz * sa, nzr = nx * sa + nz * ca, nyt = ny * ct - nzr * st, nzt = ny * st + nzr * ct;
    let dot = nxr * LX + nyt * LY + nzt * LZ;
    if (two && dot < 0) dot = -dot * 0.55;
    const b = clamp(0.25 + 0.75 * Math.max(0, dot) + tone);
    const ch = ov || SHADE[Math.floor(b * SHADE.length)];
    plot(col, row, zt, ch, pal[Math.floor(b * pal.length)]);
  }
  for (const [[x, y, z], kind, pal, cpal, nPet, R, seed] of flowers) {
    const [fx, fy, zt, f] = projectF(x, y, z);
    const rx = R * f * sxScale, ry = R * f * scale;
    const dim = -0.4 * (1 - Math.min(1, Math.max(0, (zt + 0.6) / 1.2)));
    const rot = seed + ang * 0.7;
    for (let row = Math.trunc(fy - ry) - 1; row < Math.trunc(fy + ry) + 2; row++) {
      const dy = (row + 0.5 - fy) / ry;
      for (let col = Math.trunc(fx - rx) - 1; col < Math.trunc(fx + rx) + 2; col++) {
        const dx = (col + 0.5 - fx) / rx;
        if (kind === "disc") {
          const s = Math.sqrt(dx * dx + dy * dy);
          if (s > 1) continue;
          if (s < 0.3) {
            const b = clamp(0.55 - 0.35 * dx - 0.35 * dy + dim);
            plot(col, row, zt + 0.06, s < 0.17 ? "@" : "o", cpal[Math.floor(b * cpal.length)]);
            continue;
          }
          const ph = Math.atan2(dy, dx);
          const reach = 0.32 + 0.68 * Math.pow(Math.abs(Math.cos(nPet * (ph + rot) / 2)), 0.7);
          if (s > reach) continue;
          const edge = s > reach - 0.14 ? -0.22 : 0;
          const b = clamp(0.62 - 0.22 * dx - 0.28 * dy + 0.12 * s + edge + dim);
          plot(col, row, zt + 0.04 * (1 - s), PETAL_SHADE[Math.floor(b * 4)], pal[Math.floor(b * pal.length)]);
        } else {
          const v = (1 - dy) / 2;
          if (v < 0 || v > 1) continue;
          const hw = 0.62 * Math.sin(Math.PI * 0.5 * Math.min(1, v * 1.5 + 0.05));
          if (hw <= 0 || Math.abs(dx) > hw) continue;
          const xn = dx / hw;
          if (v > 0.72 + 0.28 * Math.pow(Math.cos(1.5 * Math.PI * xn), 2)) continue;
          const seam = Math.abs(Math.abs(xn) - 0.33) < 0.12 && v > 0.3 ? -0.25 : 0;
          const b = clamp(0.55 - 0.3 * xn + 0.1 * v + seam + dim);
          plot(col, row, zt + 0.03, PETAL_SHADE[Math.floor(b * 4)], pal[Math.floor(b * pal.length)]);
        }
      }
    }
  }
  for (const [x, y, z, phase] of babies) {
    const [col, row, zt] = project(x, y, z), star = Math.sin(t * 2 + phase) > 0.6;
    plot(col, row, zt + 0.02, star ? "*" : "·", star ? 231 : 255);
  }
  for (const [x, y, z, phase, speed] of sparkles) {
    const [col, row, zt] = project(x, y, z), tw = Math.sin(t * speed + phase);
    if (tw > 0.85) plot(col, row, zt, "*", 231);
    else if (tw > 0.4) plot(col, row, zt, "+", 225);
    else if (tw > 0) plot(col, row, zt, "·", 218);
  }
  const msg = [...MESSAGE], mrow = rows - 2, start = Math.max(0, Math.floor((cols - msg.length) / 2)), shift = Math.trunc(t * 6);
  msg.forEach((ch, i) => { if (start + i < cols) { chars[mrow][start + i] = ch; colors[mrow][start + i] = MSG_COLORS[(i + shift) % MSG_COLORS.length]; } });
  return { chars, colors };
}

// ---------- main loop ----------
const stage = document.getElementById("stage"), canvas = document.getElementById("screen"), ctx = canvas.getContext("2d");
const scene = buildScene(), hearts = [], FONT = 16;
let cw, chh, cols, rows, SW = 0, SH = 0;
function resize() {
  const dpr = window.devicePixelRatio || 1, W = stage.clientWidth, H = stage.clientHeight; SW = W; SH = H;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = `${FONT}px "Courier New", Menlo, Consolas, monospace`;
  cw = ctx.measureText("M").width; chh = cw * 2;   // terminal cells are ~1:2
  cols = Math.max(20, Math.floor(W / cw) - 1); rows = Math.max(12, Math.floor(H / chh) - 1);
}
addEventListener("resize", resize); new ResizeObserver(resize).observe(stage); resize();
const colorCache = {}, css = n => colorCache[n] || (colorCache[n] = xterm(n));
let t0 = performance.now(), last = t0, lastDraw = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (now - lastDraw < 1000 / FPS - 1) return;
  lastDraw = now;
  const dt = (now - last) / 1000; last = now;
  updateHearts(hearts, dt);
  const { chars, colors } = render(scene, (now - t0) / 1000, cols, rows, hearts);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, SW, SH);
  ctx.font = `${FONT}px "Courier New", Menlo, Consolas, monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const ox = (SW - cols * cw) / 2;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const ch = chars[r][c];
    if (ch === " ") continue;
    ctx.fillStyle = css(colors[r][c]);
    ctx.fillText(ch, ox + (c + 0.5) * cw, (r + 0.5) * chh);
  }
}
requestAnimationFrame(frame);

// ---------- music ----------
const audio = document.getElementById("music"), startEl = document.getElementById("start");
function begin() { audio.play().catch(() => {}); startEl.classList.add("hide"); }
startEl.addEventListener("click", begin);
audio.play().then(() => startEl.classList.add("hide")).catch(() => {});