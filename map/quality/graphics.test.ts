import { describe, expect, it } from "vitest";
import { PRESETS, loadPreset, savePreset, effectiveDpr } from "./graphics";

describe("graphics presets", () => {
  it("smooth: no shadows, no AO, no post, 0.75 scale", () => {
    const p = PRESETS.smooth;
    expect([p.shadows, p.ambientOcclusion, p.postProcessing, p.antialias, p.renderScale]).toEqual([false, false, "off", "off", 0.75]);
  });
  it("standard: shadows off, basic post, 0.9 scale", () => {
    const p = PRESETS.standard;
    expect([p.shadows, p.ambientOcclusion, p.postProcessing, p.renderScale]).toEqual([false, false, "basic", 0.9]);
  });
  it("hd: shadows + AO on, full post, full res textures", () => {
    const p = PRESETS.hd;
    expect([p.shadows, p.ambientOcclusion, p.postProcessing, p.renderScale, p.textureScale]).toEqual([true, true, "full", 1, 1]);
  });
  it("persists the choice and falls back to HD", () => {
    const m = new Map<string, string>();
    const s = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    expect(loadPreset(s)).toBe("hd");
    savePreset(s, "smooth");
    expect(loadPreset(s)).toBe("smooth");
  });
  it("scales render resolution", () => {
    expect(effectiveDpr(2, PRESETS.smooth)).toBe(1.5);
  });
});
