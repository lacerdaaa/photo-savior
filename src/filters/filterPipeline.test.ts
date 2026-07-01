import { describe, expect, it } from "vitest";
import { applyFilters } from "@/filters/filterPipeline";

function makeImageData(r: number, g: number, b: number): ImageData {
  const data = new Uint8ClampedArray([r, g, b, 255]);
  return new ImageData(data, 1, 1);
}

describe("applyFilters", () => {
  it("identity — zero params leave pixels unchanged", () => {
    const src = makeImageData(100, 150, 200);
    const out = applyFilters(src, { brightness: 0, contrast: 0, saturation: 0 });
    expect(out.data[0]).toBe(100);
    expect(out.data[1]).toBe(150);
    expect(out.data[2]).toBe(200);
    expect(out.data[3]).toBe(255);
  });

  it("does not mutate the source ImageData", () => {
    const src = makeImageData(100, 150, 200);
    const before = Array.from(src.data);
    applyFilters(src, { brightness: 50, contrast: 50, saturation: 50 });
    expect(Array.from(src.data)).toEqual(before);
  });

  it("brightness +100 increases pixel values without exceeding 255", () => {
    const src = makeImageData(200, 200, 200);
    const out = applyFilters(src, { brightness: 100, contrast: 0, saturation: 0 });
    expect(out.data[0]).toBeLessThanOrEqual(255);
    expect(out.data[0]).toBeGreaterThan(200);
  });

  it("brightness -100 decreases pixel values without going below 0", () => {
    const src = makeImageData(50, 50, 50);
    const out = applyFilters(src, { brightness: -100, contrast: 0, saturation: 0 });
    expect(out.data[0]).toBeGreaterThanOrEqual(0);
    expect(out.data[0]).toBeLessThan(50);
  });

  it("saturation 0 result equals saturation of a grey pixel (desaturate a grey)", () => {
    const src = makeImageData(128, 128, 128);
    const out = applyFilters(src, { brightness: 0, contrast: 0, saturation: -100 });
    expect(out.data[0]).toBe(out.data[1]);
    expect(out.data[1]).toBe(out.data[2]);
  });
});
