import * as THREE from "three";

type Ctx = CanvasRenderingContext2D;
function rng(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
let SCALE = 1, ANISO = 8;
export function setTextureQuality(scale: number, aniso: number) { SCALE = scale; ANISO = aniso; }
function make(baseSize: number, draw: (g: Ctx, s: number, r: () => number) => void, seed = 3, srgb = true, rep: [number, number] = [1, 1]) {
  const size = Math.max(64, Math.round(baseSize * SCALE));
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.save(); g.scale(size / baseSize, size / baseSize); draw(g, baseSize, rng(seed)); g.restore();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = ANISO; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function grime(g: Ctx, s: number, r: () => number, n: number, a: number, col = "0,0,0") {
  for (let i = 0; i < n; i++) {
    const x = r() * s, y = r() * s, rad = 4 + r() * s * 0.08;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${col},${a * r()})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}
function speckle(g: Ctx, s: number, r: () => number, n: number, a: number) {
  for (let i = 0; i < n; i++) { const v = r() > 0.5 ? 255 : 0; g.fillStyle = `rgba(${v},${v},${v},${a * r()})`; g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2); }
}

export function marble() {
  return make(2048, (g, s, r) => {
    const tile = s / 4;
    for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) {
      const shade = 168 + r() * 18;
      g.fillStyle = `rgb(${shade},${shade + 1},${shade + 4})`; g.fillRect(tx * tile, ty * tile, tile, tile);
      g.save(); g.beginPath(); g.rect(tx * tile, ty * tile, tile, tile); g.clip();
      for (let i = 0; i < 18; i++) {
        g.strokeStyle = `rgba(${70 + r() * 50},${75 + r() * 50},${90 + r() * 50},${0.05 + r() * 0.25})`;
        g.lineWidth = 0.4 + r() * 2.5; g.beginPath();
        let x = tx * tile + r() * tile, y = ty * tile + r() * tile; g.moveTo(x, y);
        for (let k = 0; k < 30; k++) { x += (r() - 0.35) * 30; y += (r() - 0.5) * 30; g.lineTo(x, y); }
        g.stroke();
      }
      g.restore();
    }
    speckle(g, s, r, 40000, 0.06);
    grime(g, s, r, 60, 0.08);
    g.strokeStyle = "rgba(30,34,40,0.8)"; g.lineWidth = 4;
    for (let i = 0; i <= 4; i++) { const p = i * tile; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, s); g.moveTo(0, p); g.lineTo(s, p); g.stroke(); }
  }, 11, true, [5, 5]);
}
export function marbleRough() {
  return make(1024, (g, s, r) => {
    g.fillStyle = "#2a2a2a"; g.fillRect(0, 0, s, s);
    grime(g, s, r, 120, 0.5, "200,200,200");
    g.strokeStyle = "#ffffff"; g.lineWidth = 6;
    for (let i = 0; i <= 4; i++) { const p = (i * s) / 4; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, s); g.moveTo(0, p); g.lineTo(s, p); g.stroke(); }
  }, 5, false, [5, 5]);
}

export function corrugated(base: string, seed: number) {
  return make(1024, (g, s, r) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    const ribs = 24;
    for (let i = 0; i < ribs; i++) {
      const x = (i / ribs) * s, w = s / ribs;
      const gr = g.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, "rgba(0,0,0,0.35)"); gr.addColorStop(0.3, "rgba(255,255,255,0.12)");
      gr.addColorStop(0.6, "rgba(0,0,0,0.05)"); gr.addColorStop(1, "rgba(0,0,0,0.35)");
      g.fillStyle = gr; g.fillRect(x, 0, w, s);
    }
    grime(g, s, r, 90, 0.35, "90,45,20");
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(80,40,15,${0.2 + r() * 0.4})`; const x = r() * s; g.fillRect(x, s * (0.7 + r() * 0.3), 1 + r() * 3, -r() * s * 0.4); }
    speckle(g, s, r, 15000, 0.12);
    g.fillStyle = "rgba(255,255,255,0.7)"; g.font = "bold 70px monospace";
    g.fillText(`SX-${Math.floor(r() * 9000 + 1000)}`, 60, 120);
    g.font = "bold 34px monospace"; g.fillText("MAX GROSS 30,480 KG", 60, 170);
  }, seed);
}
export function corrugatedBump() {
  return make(512, (g, s) => {
    const ribs = 24;
    for (let i = 0; i < ribs; i++) {
      const x = (i / ribs) * s, w = s / ribs;
      const gr = g.createLinearGradient(x, 0, x + w, 0);
      gr.addColorStop(0, "#000"); gr.addColorStop(0.25, "#fff"); gr.addColorStop(0.75, "#fff"); gr.addColorStop(1, "#000");
      g.fillStyle = gr; g.fillRect(x, 0, w, s);
    }
  }, 1, false);
}

export function concrete(rep: [number, number] = [1, 1]) {
  return make(1024, (g, s, r) => {
    g.fillStyle = "#8d8e8c"; g.fillRect(0, 0, s, s);
    speckle(g, s, r, 80000, 0.15);
    grime(g, s, r, 140, 0.25);
    grime(g, s, r, 40, 0.15, "255,255,255");
    g.strokeStyle = "rgba(40,40,40,0.5)"; g.lineWidth = 1;
    for (let i = 0; i < 8; i++) { g.beginPath(); let x = r() * s, y = r() * s; g.moveTo(x, y); for (let k = 0; k < 12; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    for (const p of [s * 0.2, s * 0.8]) for (const q of [s * 0.2, s * 0.8]) { g.fillStyle = "rgba(30,30,30,0.6)"; g.beginPath(); g.arc(p, q, 10, 0, 7); g.fill(); }
  }, 21, true, rep);
}

export function metalPanel(base = "#4b525b", rep: [number, number] = [1, 1]) {
  return make(1024, (g, s, r) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    speckle(g, s, r, 30000, 0.08);
    for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(255,255,255,${r() * 0.05})`; g.beginPath(); const y = r() * s; g.moveTo(0, y); g.lineTo(s, y + (r() - 0.5) * 6); g.stroke(); }
    const n = 2, p = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.strokeStyle = "rgba(0,0,0,0.7)"; g.lineWidth = 5; g.strokeRect(i * p + 4, j * p + 4, p - 8, p - 8);
      g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 2; g.strokeRect(i * p + 9, j * p + 9, p - 18, p - 18);
      for (const [a, b] of [[20, 20], [p - 20, 20], [20, p - 20], [p - 20, p - 20]]) { g.fillStyle = "rgba(0,0,0,0.6)"; g.beginPath(); g.arc(i * p + a!, j * p + b!, 6, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.arc(i * p + a! - 1, j * p + b! - 1, 3, 0, 7); g.fill(); }
    }
    grime(g, s, r, 50, 0.3);
  }, 33, true, rep);
}

export function hazard() {
  return make(256, (g, s) => {
    g.fillStyle = "#e8b00f"; g.fillRect(0, 0, s, s);
    g.fillStyle = "#151515";
    for (let i = -s; i < s * 2; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 32, 0); g.lineTo(i + 32 - s, s); g.lineTo(i - s, s); g.fill(); }
  }, 1, true, [4, 1]);
}

export function grate() {
  const t = make(256, (g, s) => {
    g.clearRect(0, 0, s, s); g.fillStyle = "#fff";
    for (let i = 0; i < 8; i++) { g.fillRect(i * 32, 0, 6, s); g.fillRect(0, i * 32, s, 6); }
  }, 1, false, [6, 1]);
  return t;
}
