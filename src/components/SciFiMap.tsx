import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, Sky, Instances, Instance } from "@react-three/drei";
import { EffectComposer, Bloom, N8AO, Vignette, SMAA, BrightnessContrast, HueSaturation } from "@react-three/postprocessing";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import * as THREE from "three";
import * as T from "./textures";

type Mats = ReturnType<typeof buildMats>;
function buildMats() {
  const bump = T.corrugatedBump();
  const cont = (c: string, seed: number) => new THREE.MeshStandardMaterial({ map: T.corrugated(c, seed), bumpMap: bump, bumpScale: 3, metalness: 0.55, roughness: 0.55 });
  return {
    floor: new THREE.MeshStandardMaterial({ map: T.marble(), roughnessMap: T.marbleRough(), roughness: 0.6, metalness: 0.05 }),
    containers: [cont("#9a3a25", 2), cont("#1f4e7a", 3), cont("#3e6a3a", 4), cont("#b38a2a", 5), cont("#6c7378", 6), cont("#c45a1a", 7)],
    concrete: new THREE.MeshStandardMaterial({ map: T.concrete(), roughness: 0.9 }),
    metal: new THREE.MeshStandardMaterial({ map: T.metalPanel(), metalness: 0.8, roughness: 0.4 }),
    darkMetal: new THREE.MeshStandardMaterial({ map: T.metalPanel("#2b3037"), metalness: 0.85, roughness: 0.35 }),
    steel: new THREE.MeshStandardMaterial({ color: "#8d949c", metalness: 1, roughness: 0.25 }),
    frame: new THREE.MeshStandardMaterial({ color: "#23272c", metalness: 0.8, roughness: 0.5 }),
    hazard: new THREE.MeshStandardMaterial({ map: T.hazard(), roughness: 0.6, metalness: 0.2 }),
    grate: new THREE.MeshStandardMaterial({ color: "#5a6068", alphaMap: T.grate(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.9, roughness: 0.4 }),
    cyan: new THREE.MeshStandardMaterial({ color: "#8fe3ff", emissive: "#5fd0ff", emissiveIntensity: 3, toneMapped: false }),
    amber: new THREE.MeshStandardMaterial({ color: "#ffb060", emissive: "#ff8a2a", emissiveIntensity: 4, toneMapped: false }),
    red: new THREE.MeshStandardMaterial({ color: "#ff4040", emissive: "#ff2020", emissiveIntensity: 4, toneMapped: false }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#9fc6d8", metalness: 0.2, roughness: 0.05, transmission: 0, opacity: 0.55, transparent: true }),
    barrels: ["#2d5a8a", "#a33a2a", "#c9a227"].map((c) => new THREE.MeshStandardMaterial({ map: T.metalPanel(c), metalness: 0.6, roughness: 0.45 })),
    wood: new THREE.MeshStandardMaterial({ color: "#8a6a44", roughness: 0.85 }),
    sandbag: new THREE.MeshStandardMaterial({ color: "#8f8566", roughness: 1 }),
  };
}
const M = createContext<Mats>(null!);
const useM = () => useContext(M);
type V3 = [number, number, number];
const Box = ({ p, s, m, r }: { p: V3; s: V3; m: THREE.Material; r?: V3 }) => (
  <mesh position={p} rotation={r} material={m} castShadow receiveShadow><boxGeometry args={s} /></mesh>
);

function Container({ p, rot = 0, c = 0, open = false }: { p: V3; rot?: number; c?: number; open?: boolean }) {
  const m = useM(); const L = 6.06, H = 2.59, W = 2.44;
  const corners: V3[] = [];
  for (const x of [-1, 1]) for (const y of [0, 1]) for (const z of [-1, 1]) corners.push([x * (L / 2 - 0.1), y * (H - 0.2) + 0.1, z * (W / 2 - 0.1)]);
  return (
    <group position={p} rotation-y={rot}>
      <Box p={[0, H / 2, 0]} s={[L - 0.1, H - 0.1, W - 0.1]} m={m.containers[c % 6]!} />
      {/* frame rails */}
      {[0.06, H - 0.06].map((y) => [-1, 1].map((z) => <Box key={y + "" + z} p={[0, y, z * (W / 2 - 0.03)]} s={[L, 0.12, 0.08]} m={m.frame} />))}
      {corners.map((q, i) => <Box key={i} p={q} s={[0.2, 0.2, 0.2]} m={m.steel} />)}
      {[-1, 1].map((x) => [-1, 1].map((z) => <Box key={x + "" + z} p={[x * (L / 2 - 0.04), H / 2, z * (W / 2 - 0.04)]} s={[0.1, H, 0.1]} m={m.frame} />))}
      {/* doors with locking bars */}
      {!open && [-0.6, -0.2, 0.2, 0.6].map((z) => (
        <group key={z}>
          <Box p={[L / 2 + 0.03, H / 2, z]} s={[0.04, H - 0.3, 0.05]} m={m.steel} />
          <Box p={[L / 2 + 0.06, H * 0.45, z + 0.08]} s={[0.04, 0.05, 0.18]} m={m.steel} />
        </group>
      ))}
      {open && <Box p={[L / 2 + 0.6, H / 2, W / 2 + 0.1]} s={[1.2, H - 0.15, 0.06]} r={[0, -0.5, 0]} m={m.containers[c % 6]!} />}
    </group>
  );
}

function Barrel({ p, c = 0, tilt = 0 }: { p: V3; c?: number; tilt?: number }) {
  const m = useM();
  return (
    <group position={p} rotation-z={tilt}>
      <mesh position-y={0.45} material={m.barrels[c % 3]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.3, 0.9, 24]} /></mesh>
      {[0.15, 0.45, 0.75].map((y) => <mesh key={y} position-y={y} material={m.steel}><torusGeometry args={[0.305, 0.015, 6, 24]} /></mesh>)}
      <mesh position-y={0.905} rotation-x={-Math.PI / 2} material={m.frame}><circleGeometry args={[0.28, 24]} /></mesh>
    </group>
  );
}

function Crate({ p, s = 1, rot = 0 }: { p: V3; s?: number; rot?: number }) {
  const m = useM();
  return (
    <group position={p} rotation-y={rot} scale={s}>
      <Box p={[0, 0.5, 0]} s={[0.94, 0.94, 0.94]} m={m.wood} />
      {[[0, 0.03, 0], [0, 0.97, 0]].map((q, i) => [-1, 1].map((k) => <group key={i + "" + k}>
        <Box p={[q[0]!, q[1]!, k * 0.47]} s={[1, 0.08, 0.08]} m={m.frame} />
        <Box p={[k * 0.47, q[1]!, 0]} s={[0.08, 0.08, 1]} m={m.frame} />
      </group>))}
      {[-1, 1].map((x) => [-1, 1].map((z) => <Box key={x + "" + z} p={[x * 0.47, 0.5, z * 0.47]} s={[0.08, 1, 0.08]} m={m.frame} />))}
    </group>
  );
}

function ConcreteBlock({ p, s, rot = 0, stripe = false }: { p: V3; s: V3; rot?: number; stripe?: boolean }) {
  const m = useM();
  return (
    <group position={p} rotation-y={rot}>
      <Box p={[0, s[1] / 2, 0]} s={s} m={m.concrete} />
      <Box p={[0, s[1] + 0.03, 0]} s={[s[0] - 0.1, 0.06, s[2] - 0.1]} m={m.concrete} />
      {stripe && <Box p={[0, 0.25, s[2] / 2 + 0.005]} s={[s[0], 0.3, 0.01]} m={m.hazard} />}
    </group>
  );
}

function Jersey({ p, rot = 0, n = 4 }: { p: V3; rot?: number; n?: number }) {
  const m = useM();
  const shape = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-0.3, 0); s.lineTo(0.3, 0); s.lineTo(0.3, 0.1); s.lineTo(0.12, 0.3); s.lineTo(0.08, 0.85); s.lineTo(-0.08, 0.85); s.lineTo(-0.12, 0.3); s.lineTo(-0.3, 0.1); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 1.95, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }); }, []);
  return <group position={p} rotation-y={rot}>{Array.from({ length: n }, (_, i) => <mesh key={i} geometry={shape} material={m.concrete} position-z={i * 2 - n} castShadow receiveShadow />)}</group>;
}

function Ramp({ p, rot = 0, w = 3, l = 6, h = 2 }: { p: V3; rot?: number; w?: number; l?: number; h?: number }) {
  const m = useM();
  const geo = useMemo(() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(l, 0); s.lineTo(l, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }); g.translate(-l / 2, 0, -w / 2); return g; }, [w, l, h]);
  const ang = Math.atan2(h, l), len = Math.hypot(l, h);
  return (
    <group position={p} rotation-y={rot}>
      <mesh geometry={geo} material={m.metal} castShadow receiveShadow />
      {[-1, 1].map((k) => <Box key={k} p={[0, h / 2 + 0.04, k * (w / 2 - 0.1)]} s={[len, 0.08, 0.2]} r={[0, 0, ang]} m={m.hazard} />)}
      {Array.from({ length: 8 }, (_, i) => <Box key={i} p={[-l / 2 + (i + 0.5) * (l / 8), (i + 0.5) * (h / 8) + 0.03, 0]} s={[0.06, 0.04, w - 0.5]} r={[0, 0, ang]} m={m.steel} />)}
    </group>
  );
}

function Railing({ p, len, rot = 0 }: { p: V3; len: number; rot?: number }) {
  const m = useM(); const posts = Math.max(2, Math.round(len / 1.2) + 1);
  return (
    <group position={p} rotation-y={rot}>
      <mesh position-y={1} rotation-z={Math.PI / 2} material={m.steel}><cylinderGeometry args={[0.035, 0.035, len, 8]} /></mesh>
      <mesh position-y={0.5} rotation-z={Math.PI / 2} material={m.steel}><cylinderGeometry args={[0.025, 0.025, len, 8]} /></mesh>
      {Array.from({ length: posts }, (_, i) => <mesh key={i} position={[-len / 2 + (i * len) / (posts - 1), 0.5, 0]} material={m.steel} castShadow><cylinderGeometry args={[0.03, 0.03, 1, 8]} /></mesh>)}
    </group>
  );
}

function Stairs({ p, rot = 0, steps = 10, rise = 0.25, run = 0.3, w = 2 }: { p: V3; rot?: number; steps?: number; rise?: number; run?: number; w?: number }) {
  const m = useM(); const H = steps * rise, D = steps * run, pad = 2.5;
  return (
    <group position={p} rotation-y={rot}>
      {Array.from({ length: steps }, (_, i) => (
        <group key={i}>
          <Box p={[0, (i + 1) * rise - 0.03, i * run + run / 2]} s={[w, 0.06, run]} m={m.darkMetal} />
          <Box p={[0, (i + 1) * rise - 0.005, i * run + 0.04]} s={[w, 0.012, 0.05]} m={m.hazard} />
        </group>
      ))}
      {[-1, 1].map((k) => <Box key={k} p={[k * (w / 2 + 0.04), H / 2, D / 2]} s={[0.08, 0.3, Math.hypot(H, D)]} r={[-Math.atan2(H, D), 0, 0]} m={m.frame} />)}
      {[-1, 1].map((k) => <Railing key={"r" + k} p={[k * (w / 2 + 0.04), H / 2, D / 2]} len={Math.hypot(H, D)} rot={Math.PI / 2} />).map((r, i) => <group key={i} rotation-x={0}>{r}</group>)}
      {/* landing platform */}
      <Box p={[0, H / 2, D + pad / 2]} s={[w + 1, H, pad]} m={m.concrete} />
      <Box p={[0, H + 0.04, D + pad / 2]} s={[w + 1.02, 0.08, pad + 0.02]} m={m.darkMetal} />
      <Railing p={[0, H, D + pad]} len={w + 1} />
      <Box p={[0, H + 0.1, D + 0.05]} s={[w, 0.02, 0.06]} m={m.cyan} />
    </group>
  );
}

function Tower({ p, h = 14 }: { p: V3; h?: number }) {
  const m = useM(); const legs: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]; const r = 1.6;
  const braces = Math.floor(h / 3);
  return (
    <group position={p}>
      <Box p={[0, 0.2, 0]} s={[4.4, 0.4, 4.4]} m={m.concrete} />
      {legs.map(([x, z], i) => <Box key={i} p={[x * r, h / 2, z * r]} s={[0.3, h, 0.3]} m={m.darkMetal} />)}
      {Array.from({ length: braces }, (_, b) => legs.map(([x, z], i) => {
        const [nx, nz] = legs[(i + 1) % 4]!; const y = 1.5 + b * 3;
        const mx = ((x + nx) / 2) * r, mz = ((z + nz) / 2) * r; const along = x === nx ? Math.PI / 2 : 0;
        return <group key={b + "-" + i} position={[mx, y, mz]} rotation-y={along}>
          <Box p={[0, 0, 0]} s={[r * 2, 0.12, 0.12]} r={[0, 0, 0.75]} m={m.frame} />
          <Box p={[0, 0, 0]} s={[r * 2, 0.12, 0.12]} r={[0, 0, -0.75]} m={m.frame} />
          <Box p={[0, 1.5, 0]} s={[r * 2, 0.15, 0.15]} m={m.steel} />
        </group>;
      }))}
      {/* ladder */}
      {[-0.25, 0.25].map((x) => <Box key={x} p={[x, h / 2, r + 0.35]} s={[0.05, h, 0.05]} m={m.steel} />)}
      {Array.from({ length: Math.floor(h / 0.35) }, (_, i) => <Box key={i} p={[0, 0.3 + i * 0.35, r + 0.35]} s={[0.5, 0.03, 0.03]} m={m.steel} />)}
      {/* cabin */}
      <Box p={[0, h + 0.1, 0]} s={[5, 0.2, 5]} m={m.darkMetal} />
      <Box p={[0, h + 1.4, 0]} s={[3.4, 2.4, 3.4]} m={m.metal} />
      {[0, 1, 2, 3].map((i) => <mesh key={i} rotation-y={(i * Math.PI) / 2}><mesh position={[0, h + 1.6, 1.71]} material={m.glass}><planeGeometry args={[2.8, 1]} /></mesh></mesh>)}
      <Box p={[0, h + 2.7, 0]} s={[4, 0.2, 4]} m={m.darkMetal} />
      {[0, 1, 2, 3].map((i) => <group key={i} rotation-y={(i * Math.PI) / 2}><Railing p={[0, h + 0.2, 2.45]} len={5} /></group>)}
      <Box p={[0, h + 0.22, 2.45]} s={[5, 0.04, 0.04]} m={m.cyan} />
      <mesh position-y={h + 4} material={m.steel}><cylinderGeometry args={[0.05, 0.08, 2.6, 8]} /></mesh>
      <mesh position-y={h + 5.35} material={m.red}><sphereGeometry args={[0.14, 16, 16]} /></mesh>
      <mesh position={[1.3, h + 3.2, 0]} rotation-z={0.5} material={m.steel}><sphereGeometry args={[0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <pointLight position={[0, h + 1, 0]} color="#ffb070" intensity={6} distance={8} />
    </group>
  );
}

function Catwalk({ a, b, y }: { a: [number, number]; b: [number, number]; y: number }) {
  const m = useM(); const dx = b[0] - a[0], dz = b[1] - a[1]; const len = Math.hypot(dx, dz);
  return (
    <group position={[(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2]} rotation-y={-Math.atan2(dz, dx)}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} material={m.grate} receiveShadow castShadow><planeGeometry args={[len, 1.4]} /></mesh>
      {[-0.7, 0.7].map((z) => <Box key={z} p={[0, 0, z]} s={[len, 0.15, 0.08]} m={m.frame} />)}
      {[-0.7, 0.7].map((z) => <Railing key={"r" + z} p={[0, 0, z]} len={len} />)}
    </group>
  );
}

function Lamp({ p, rot = 0 }: { p: V3; rot?: number }) {
  const m = useM();
  return (
    <group position={p} rotation-y={rot}>
      <mesh position-y={3} material={m.darkMetal} castShadow><cylinderGeometry args={[0.07, 0.1, 6, 10]} /></mesh>
      <Box p={[0.6, 6, 0]} s={[1.3, 0.08, 0.08]} m={m.darkMetal} />
      <Box p={[1.15, 5.92, 0]} s={[0.5, 0.1, 0.25]} m={m.frame} />
      <Box p={[1.15, 5.86, 0]} s={[0.44, 0.02, 0.2]} m={m.amber} />
      <pointLight position={[1.15, 5.6, 0]} color="#ffb070" intensity={18} distance={12} decay={1.6} />
    </group>
  );
}

function Sandbags({ p, rot = 0 }: { p: V3; rot?: number }) {
  const m = useM(); const bags: V3[] = [];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - row; i++) bags.push([-1.4 + i * 0.56 + row * 0.28, 0.12 + row * 0.22, 0]);
  return <group position={p} rotation-y={rot}>{bags.map((q, i) => <mesh key={i} position={q} scale={[0.3, 0.12, 0.2]} material={m.sandbag} castShadow receiveShadow><sphereGeometry args={[1, 12, 8]} /></mesh>)}</group>;
}

function PerimeterWall() {
  const m = useM(); const sides: [V3, number][] = [[[0, 0, -25], 0], [[0, 0, 25], 0], [[-25, 0, 0], Math.PI / 2], [[25, 0, 0], Math.PI / 2]];
  return <>{sides.map(([p, r], i) => (
    <group key={i} position={p} rotation-y={r}>
      <Box p={[0, 1.5, 0]} s={[50.6, 3, 0.6]} m={m.concrete} />
      {Array.from({ length: 10 }, (_, k) => <Box key={k} p={[-22.5 + k * 5, 1.6, 0]} s={[0.4, 3.2, 0.8]} m={m.darkMetal} />)}
      <Box p={[0, 3.05, 0]} s={[50.6, 0.1, 0.7]} m={m.darkMetal} />
      <Box p={[0, 2.6, 0.31 * (i % 2 ? -1 : 1) * (i < 2 ? 1 : -1)]} s={[50, 0.05, 0.02]} m={m.cyan} />
      <Box p={[0, 0.2, 0]} s={[50.6, 0.4, 0.64]} m={m.hazard} />
    </group>))}</>;
}

function Bunker({ p, rot = 0 }: { p: V3; rot?: number }) {
  const m = useM();
  return (
    <group position={p} rotation-y={rot}>
      <Box p={[0, 1.6, -2]} s={[7, 3.2, 0.4]} m={m.concrete} />
      <Box p={[-3.3, 1.6, 0]} s={[0.4, 3.2, 4.4]} m={m.concrete} />
      <Box p={[3.3, 1.6, 0]} s={[0.4, 3.2, 4.4]} m={m.concrete} />
      <Box p={[-2, 1.6, 2]} s={[3, 3.2, 0.4]} m={m.concrete} />
      <Box p={[2.6, 1.6, 2]} s={[1.8, 3.2, 0.4]} m={m.concrete} />
      <Box p={[0.6, 2.8, 2]} s={[2.2, 0.8, 0.4]} m={m.concrete} />
      <Box p={[0, 3.3, 0]} s={[7.4, 0.25, 4.8]} m={m.darkMetal} />
      <Box p={[-2, 2.2, 2.21]} s={[1.6, 0.4, 0.02]} m={m.frame} />
      <Box p={[0.6, 2.38, 2.21]} s={[2.2, 0.04, 0.02]} m={m.amber} />
      <mesh position={[2, 3.9, 0]} material={m.steel} castShadow><cylinderGeometry args={[0.5, 0.5, 1, 16]} /></mesh>
      <Box p={[-1.5, 3.6, -1]} s={[1.5, 0.5, 1]} m={m.metal} />
    </group>
  );
}

function World() {
  const mats = useMemo(buildMats, []);
  return (
    <M.Provider value={mats}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow material={mats.floor}><planeGeometry args={[50, 50]} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} material={mats.concrete} receiveShadow><planeGeometry args={[300, 300]} /></mesh>
      <PerimeterWall />

      {/* container yard NW */}
      <Container p={[-17, 0, -18]} c={0} />
      <Container p={[-17, 0, -15.4]} c={1} />
      <Container p={[-17, 2.59, -16.7]} rot={0.08} c={3} />
      <Container p={[-9, 0, -20]} rot={Math.PI / 2} c={2} open />
      <Catwalk a={[-14, -16.7]} b={[-9, -16.7]} y={2.6} />
      {/* containers mid / SE */}
      <Container p={[12, 0, 8]} rot={0.6} c={4} />
      <Container p={[10, 0, -5]} c={5} />
      <Container p={[10, 2.59, -5]} rot={-0.12} c={1} />
      <Container p={[-12, 0, 15]} rot={-0.4} c={1} />
      <Container p={[17, 0, 17]} rot={Math.PI / 2} c={0} />

      {/* central plaza */}
      <ConcreteBlock p={[0, 0, 0]} s={[5, 0.8, 5]} stripe />
      <ConcreteBlock p={[0, 0.8, 0]} s={[2.4, 1.6, 2.4]} />
      <Box p={[0, 2.5, 0]} s={[1.2, 0.2, 1.2]} m={mats.cyan} />
      <Ramp p={[0, 0, 4.9]} rot={-Math.PI / 2} w={2.5} l={4.8} h={0.8} />
      <Jersey p={[-6, 0, 2]} n={3} />
      <Jersey p={[6, 0, -2]} rot={Math.PI / 2} n={4} />

      {/* cover blocks */}
      <ConcreteBlock p={[5, 0, 5]} s={[1.5, 1.5, 1.5]} rot={0.3} />
      <ConcreteBlock p={[-4, 0, -6]} s={[6, 1.1, 1]} stripe />
      <ConcreteBlock p={[3, 0, 17]} s={[2, 1, 2]} />
      <ConcreteBlock p={[5.5, 0, 18]} s={[2, 2, 2]} />
      <ConcreteBlock p={[-20, 0, -4]} s={[3, 1.2, 1]} rot={Math.PI / 2} stripe />

      <Bunker p={[17, 0, -16]} rot={Math.PI} />
      <Ramp p={[17, 0, -9]} rot={Math.PI / 2} h={3.3} l={7} />
      <Ramp p={[-5, 0, 18]} />
      <Ramp p={[6, 0, -14]} rot={Math.PI} h={1.5} />

      <Stairs p={[-19, 0, 3]} />
      <Stairs p={[2, 0, -21]} rot={Math.PI} steps={8} />

      <Tower p={[-21, 0, -21]} />
      <Tower p={[21, 0, 21]} h={18} />
      <Tower p={[21.5, 0, -22]} h={10} />
      <Tower p={[-21, 0, 21]} h={12} />

      {/* props */}
      {[[-13, 0, -12, 0], [-12.3, 0, -12.2, 1], [-12.7, 0, -11.5, 2], [8, 0, -8, 1], [14, 0, 4, 2], [13.4, 0, 4.4, 0], [-8, 0, 12, 1]].map(([x, y, z, c], i) => <Barrel key={i} p={[x!, y!, z!]} c={c!} />)}
      <Barrel p={[9, 0.3, -9]} c={0} tilt={Math.PI / 2} />
      <Crate p={[-6, 0, 9]} rot={0.2} /><Crate p={[-5, 0, 9.3]} rot={-0.1} /><Crate p={[-5.5, 1, 9.1]} s={0.8} rot={0.5} />
      <Crate p={[14, 0, -11]} s={1.2} /><Crate p={[8, 0, 13]} rot={0.7} />
      <Sandbags p={[-2, 0, 10]} /><Sandbags p={[12, 0, -1]} rot={Math.PI / 2} /><Sandbags p={[-14, 0, 6]} rot={0.4} />

      <Lamp p={[-8, 0, -8]} rot={Math.PI / 4} />
      <Lamp p={[8, 0, 8]} rot={(-3 * Math.PI) / 4} />
      <Lamp p={[-8, 0, 6]} rot={-Math.PI / 4} />
      <Lamp p={[7, 0, -10]} rot={(3 * Math.PI) / 4} />
    </M.Provider>
  );
}

export default function SciFiMap() {
  const [ready, setReady] = useState(false);
  return (
    <div className="fixed inset-0 bg-background" data-scene-ready={ready ? "" : undefined}>
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [2, 24, 40], fov: 45 }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.9, antialias: false }}
        onCreated={() => setTimeout(() => setReady(true), 300)}>
        <Sky sunPosition={[60, 18, 40]} turbidity={6} rayleigh={1.4} mieCoefficient={0.006} mieDirectionalG={0.85} />
        <fog attach="fog" args={["#c8b9a6", 60, 180]} />
        <hemisphereLight args={["#cfe0ff", "#6b5a48", 0.5]} />
        <directionalLight castShadow position={[30, 24, 20]} intensity={3.2} color="#ffe2bf"
          shadow-mapSize={[4096, 4096]} shadow-bias={-0.0003} shadow-normalBias={0.03}
          shadow-camera-left={-34} shadow-camera-right={34} shadow-camera-top={34} shadow-camera-bottom={-34} shadow-camera-far={120} />
        <Environment resolution={256}>
          <Lightformer intensity={1.5} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} color="#dfe8ff" />
          <Lightformer intensity={2.5} color="#ffd2a0" position={[30, 6, 20]} scale={[20, 6, 1]} />
          <Lightformer intensity={0.8} color="#8fb0d8" position={[-20, 3, -10]} rotation-y={Math.PI / 2} scale={[40, 3, 1]} />
        </Environment>
        <World />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.08} minDistance={4} maxDistance={80} target={[0, 1, 0]} enableDamping />
        <EffectComposer multisampling={0}>
          <N8AO halfRes aoRadius={1.5} intensity={2.5} distanceFalloff={1} />
          <Bloom mipmapBlur intensity={0.6} luminanceThreshold={1} />
          <HueSaturation saturation={0.08} />
          <BrightnessContrast contrast={0.08} />
          <SMAA />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] tracking-[0.2em] text-foreground/80 drop-shadow">
        SECTOR-07 · 50×50 M<br />DRAG TO ORBIT · PINCH TO ZOOM
      </div>
    </div>
  );
}
