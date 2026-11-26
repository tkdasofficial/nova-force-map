# NOVA FORCE – Map

Everything that builds and renders the 50 m × 50 m sci-fi arena lives here.

## Contents

| Path | Purpose |
| --- | --- |
| `SciFiMap.tsx` | The map. Holds the `<Canvas>`, sky, sun, image-based lighting, every structure (containers, towers, stairs, ramps, bunker, walls, props), post-processing, the on-screen label and the **⚙ SETTINGS** graphics menu. Default export `SciFiMap`. |
| `textures.ts` | Procedural canvas textures (marble floor, corrugated container metal, concrete, metal panels, hazard stripes, catwalk grate). No image files are downloaded; every texture is drawn at runtime. |
| `quality/graphics.ts` | Graphics Quality Preset system: `PRESETS`, `PRESET_ORDER`, `loadPreset`, `savePreset`, `effectiveDpr`. Plain TypeScript with no React or three.js imports. |
| `quality/graphics.test.ts` | Vitest checks for the preset values and the saved selection. |

The map has no external model or image assets.

## How the map loads

1. `src/routes/index.tsx` imports `SciFiMap` from `../../map/SciFiMap` and mounts it with `ssr: false`, because WebGL only exists in the browser.
2. On mount, `SciFiMap` reads the saved preset from `localStorage` (key `novaforce.graphicsPreset`). The default is HD.
3. `<World q={preset}>` calls `buildMats(preset)`. That sets the texture quality in `textures.ts` and then creates every material once, shared through React context (`useM()`). The active preset is shared through `useQ()`.
4. `GraphicsApplier` turns the renderer's shadow maps on or off, sets reflection strength (`scene.environmentIntensity`) and applies the render scale with `setDpr(effectiveDpr(...))`.
5. `Effects` mounts the post-processing chain for the preset.
6. Once the first frame has drawn, the wrapper sets `data-scene-ready`. Automated checks wait for it.

## Graphics Quality Presets

| Setting | SMOOTH | STANDARD | HD |
| --- | --- | --- | --- |
| `textureScale` (canvas size) | 0.25 | 0.5 | 1 |
| `anisotropy` | 1 | 4 | 8 |
| `shadows` / `shadowMapSize` | off | off | on / 4096 |
| `ambientOcclusion` (N8AO) | off | off | on |
| `reflections` (env intensity) | 0 | 0.4 | 1 |
| `lighting` | low: sun + sky | medium: + lamp lights | high: + tower lights |
| `antialias` (SMAA) | off | low | high |
| `renderScale` | 0.75 | 0.9 | 1.0 |
| `postProcessing` | off | basic: bloom, SMAA, vignette | full: AO, bloom, colour grading, SMAA, vignette |

All textures have mipmaps generated.

Switching presets:
- Changing the texture quality rebuilds the materials. The old materials and textures are disposed through `disposeMats`, so they do not stay in GPU memory.
- Changing the shadow quality remounts the sun light, so the new shadow map size takes effect.

Particles, foliage and lower-detail versions of distant objects do not exist in this map. The presets have no settings for them.

### Changing a preset

Edit the values in `PRESETS` in `quality/graphics.ts`, then update `quality/graphics.test.ts` to match.

To add a new setting:
1. Add a field to `GraphicsPreset`.
2. Set a value for it in all three presets.
3. Read it in `SciFiMap.tsx` through `q` or `useQ()`.

Do not hard-code quality values inside the map components.

## Using the map from other code

```ts
import SciFiMap from "../../map/SciFiMap";              // path from src/routes/
import { PRESETS, loadPreset } from "../../map/quality/graphics";
```

The `@/` shortcut points to `src/`, so files in `map/` are imported with relative paths.

## Project files that point at this folder

- `tsconfig.json` includes `map/**` for type checks.
- `vitest.config.ts` includes `map/**` tests.
- `src/styles.css` scans `map` for styling classes (`@source "../map"`).
- `src/types/r3f.d.ts` provides the 3D element typings the map uses.
