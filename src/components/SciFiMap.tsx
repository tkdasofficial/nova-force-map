import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { useMemo, useState } from "react";
import * as THREE from "three";

function marbleTexture() {
  const s = 1024, c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#d9dbe0"; g.fillRect(0, 0, s, s);
  let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = `rgba(${90 + r() * 40},${95 + r() * 40},${110 + r() * 40},${0.08 + r() * 0.2})`;
    g.lineWidth = 0.5 + r() * 3;
    g.beginPath(); let x = r() * s, y = r() * s; g.moveTo(x, y);
    for (let k = 0; k < 40; k++) { x += (r() - 0.3) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); }
    g.stroke();
  }
  // tile seams every 2.5m (texture covers 10m)
  g.strokeStyle = "rgba(40,45,55,0.5)"; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { const p = (i * s) / 4; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, s); g.moveTo(0, p); g.lineTo(s, p); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const metal = { color: "#3a4048", metalness: 0.85, roughness: 0.35 };
const ACCENT = "#ff8a2a";

function Container({ p, rot = 0, color }: { p: [number, number, number]; rot?: number; color: string }) {
  return (
    <group position={p} rotation-y={rot}>
      <mesh castShadow receiveShadow position-y={1.3}>
        <boxGeometry args={[6, 2.6, 2.4]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.5} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} castShadow position={[-2.75 + i * 0.55, 1.3, 1.22]}>
          <boxGeometry args={[0.12, 2.4, 0.06]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 2.45, 1.26]}>
        <boxGeometry args={[5.8, 0.05, 0.02]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function Block({ p, s, c = "#5b6470" }: { p: [number, number, number]; s: [number, number, number]; c?: string }) {
  return (
    <mesh castShadow receiveShadow position={[p[0], p[1] + s[1] / 2, p[2]]}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} metalness={0.5} roughness={0.4} />
    </mesh>
  );
}

function Slope({ p, rot = 0, w = 3, l = 6, h = 2 }: { p: [number, number, number]; rot?: number; w?: number; l?: number; h?: number }) {
  const geo = useMemo(() => {
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(l, 0); sh.lineTo(l, h); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false });
    g.translate(-l / 2, 0, -w / 2); return g;
  }, [w, l, h]);
  return (
    <mesh geometry={geo} castShadow receiveShadow position={p} rotation-y={rot}>
      <meshStandardMaterial color="#6d7680" metalness={0.6} roughness={0.3} />
    </mesh>
  );
}

function Stairs({ p, rot = 0, steps = 8 }: { p: [number, number, number]; rot?: number; steps?: number }) {
  return (
    <group position={p} rotation-y={rot}>
      {Array.from({ length: steps }, (_, i) => (
        <mesh key={i} castShadow receiveShadow position={[0, (i + 1) * 0.15, i * 0.35]}>
          <boxGeometry args={[2.5, (i + 1) * 0.3, 0.35]} />
          <meshStandardMaterial {...metal} color="#4a525c" />
        </mesh>
      ))}
      <mesh position={[0, steps * 0.3 + 0.01, steps * 0.35 + 1.0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.02, 2]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, steps * 0.15, steps * 0.35 + 1.0]}>
        <boxGeometry args={[2.5, steps * 0.3, 2]} />
        <meshStandardMaterial {...metal} color="#4a525c" />
      </mesh>
    </group>
  );
}

function Tower({ p, h = 14 }: { p: [number, number, number]; h?: number }) {
  return (
    <group position={p}>
      <mesh castShadow receiveShadow position-y={h / 2}>
        <cylinderGeometry args={[1.2, 1.8, h, 8]} />
        <meshStandardMaterial {...metal} color="#2f353d" />
      </mesh>
      {[0.3, 0.6, 0.9].map((f) => (
        <mesh key={f} position-y={h * f}>
          <torusGeometry args={[1.85 - f * 0.6, 0.06, 8, 32]} />
          <meshStandardMaterial color="#7fd6ff" emissive="#7fd6ff" emissiveIntensity={2.5} />
        </mesh>
      ))}
      <mesh castShadow position-y={h + 0.6}>
        <cylinderGeometry args={[2.4, 2.4, 1.2, 8]} />
        <meshStandardMaterial {...metal} color="#565e68" />
      </mesh>
      <mesh position-y={h + 2.5}>
        <coneGeometry args={[0.15, 3, 6]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <pointLight position-y={h + 4.2} color={ACCENT} intensity={8} distance={10} />
      <mesh position-y={h + 4.1}><sphereGeometry args={[0.2]} /><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={4} /></mesh>
    </group>
  );
}

function Walls() {
  const segs: [number, number, number, number][] = [[0, -25, 50, 0], [0, 25, 50, 0], [-25, 0, 50, Math.PI / 2], [25, 0, 50, Math.PI / 2]];
  return (
    <>
      {segs.map(([x, z, l, r], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={r}>
          <mesh castShadow receiveShadow position-y={0.6}><boxGeometry args={[l, 1.2, 0.4]} /><meshStandardMaterial {...metal} color="#272c33" /></mesh>
          <mesh position-y={1.22}><boxGeometry args={[l, 0.04, 0.42]} /><meshStandardMaterial color="#7fd6ff" emissive="#7fd6ff" emissiveIntensity={1.5} /></mesh>
        </group>
      ))}
    </>
  );
}

function World() {
  const tex = useMemo(() => marbleTexture(), []);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial map={tex} roughness={0.15} metalness={0.1} />
      </mesh>
      <Walls />
      <Container p={[-15, 0, -15]} color="#8a3b2a" />
      <Container p={[-15, 2.6, -15]} rot={0.15} color="#2c4a6b" />
      <Container p={[-8, 0, -18]} rot={Math.PI / 2} color="#3d5a3a" />
      <Container p={[14, 0, 10]} rot={0.6} color="#6b6b6b" />
      <Container p={[10, 0, -6]} color="#8a6a2a" />
      <Container p={[-12, 0, 14]} rot={-0.4} color="#2c4a6b" />
      <Block p={[0, 0, 0]} s={[4, 1, 4]} c="#454c55" />
      <Block p={[0, 1, 0]} s={[2, 1.5, 2]} c="#6d7680" />
      <Block p={[5, 0, 4]} s={[1.5, 1.5, 1.5]} />
      <Block p={[-4, 0, 5]} s={[1.2, 2.5, 1.2]} />
      <Block p={[-3, 0, -6]} s={[6, 0.8, 1]} />
      <Block p={[18, 0, -16]} s={[5, 3, 5]} c="#3a4048" />
      <Block p={[4, 0, 16]} s={[2, 1, 2]} />
      <Block p={[7, 0, 18]} s={[2, 2, 2]} />
      <Slope p={[18, 0, -9]} rot={Math.PI / 2} h={3} />
      <Slope p={[-5, 0, 18]} />
      <Slope p={[8, 0, -14]} rot={Math.PI} h={1.5} />
      <Stairs p={[-18, 0, 2]} />
      <Stairs p={[2, 0, -20]} rot={Math.PI} steps={6} />
      <Tower p={[-20, 0, -20]} />
      <Tower p={[20, 0, 20]} h={18} />
      <Tower p={[20, 0, -22]} h={10} />
      <Tower p={[-20, 0, 20]} h={12} />
    </>
  );
}

export default function SciFiMap() {
  const [ready, setReady] = useState(false);
  return (
    <div className="fixed inset-0 bg-background" data-scene-ready={ready ? "" : undefined}>
      <Canvas shadows camera={{ position: [0, 36, 44], fov: 45 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }} onCreated={() => requestAnimationFrame(() => setReady(true))}>
        <color attach="background" args={["#11151b"]} />
        <fog attach="fog" args={["#11151b", 50, 120]} />
        <hemisphereLight args={["#bcd4ff", "#2a2420", 0.6]} />
        <directionalLight castShadow position={[20, 35, 12]} intensity={2.2} shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
          <Lightformer intensity={1.2} color="#9cc8ff" position={[-10, 2, 0]} rotation-y={Math.PI / 2} scale={[30, 2, 1]} />
          <Lightformer intensity={1} color="#ffb070" position={[10, 2, 0]} rotation-y={-Math.PI / 2} scale={[30, 2, 1]} />
        </Environment>
        <World />
        <ContactShadows position-y={0.01} scale={50} opacity={0.4} blur={2} far={4} />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={80} target={[0, 0, 0]} />
      </Canvas>
      <div className="pointer-events-none absolute left-4 top-4 font-mono text-xs tracking-widest text-muted-foreground">
        SECTOR-07 · 50×50 M · DRAG TO ORBIT · SCROLL/PINCH TO ZOOM
      </div>
    </div>
  );
}
