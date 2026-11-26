export type PresetId = "smooth" | "standard" | "hd";

export interface GraphicsPreset {
  id: PresetId;
  label: string;
  /** Multiplier on generated texture canvas size (1 = original HD). */
  textureScale: number;
  anisotropy: number;
  shadows: boolean;
  shadowMapSize: number;
  ambientOcclusion: boolean;
  /** Environment (image-based) reflection strength. */
  reflections: number;
  /** low: sun + sky only; medium: + lamp lights; high: + tower lights. */
  lighting: "low" | "medium" | "high";
  antialias: "off" | "low" | "high";
  renderScale: number;
  postProcessing: "off" | "basic" | "full";
}

export const PRESETS: Record<PresetId, GraphicsPreset> = {
  smooth: { id: "smooth", label: "SMOOTH", textureScale: 0.25, anisotropy: 1, shadows: false, shadowMapSize: 0, ambientOcclusion: false, reflections: 0, lighting: "low", antialias: "off", renderScale: 0.75, postProcessing: "off" },
  standard: { id: "standard", label: "STANDARD", textureScale: 0.5, anisotropy: 4, shadows: false, shadowMapSize: 0, ambientOcclusion: false, reflections: 0.4, lighting: "medium", antialias: "low", renderScale: 0.9, postProcessing: "basic" },
  hd: { id: "hd", label: "HD", textureScale: 1, anisotropy: 8, shadows: true, shadowMapSize: 4096, ambientOcclusion: true, reflections: 1, lighting: "high", antialias: "high", renderScale: 1, postProcessing: "full" },
};

export const PRESET_ORDER: PresetId[] = ["smooth", "standard", "hd"];
const KEY = "novaforce.graphicsPreset";
export const DEFAULT_PRESET: PresetId = "hd";

export function loadPreset(storage: Pick<Storage, "getItem"> | undefined): PresetId {
  const v = storage?.getItem(KEY);
  return v === "smooth" || v === "standard" || v === "hd" ? v : DEFAULT_PRESET;
}
export function savePreset(storage: Pick<Storage, "setItem"> | undefined, id: PresetId) {
  storage?.setItem(KEY, id);
}
/** Device pixel ratio after applying the preset's render scale (capped at 2). */
export function effectiveDpr(deviceDpr: number, p: GraphicsPreset) {
  return Math.max(0.5, Math.min(deviceDpr, 2) * p.renderScale);
}
