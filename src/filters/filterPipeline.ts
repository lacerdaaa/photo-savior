import type { FilterParams } from "@/types";

export function applyFilters(source: ImageData, params: FilterParams): ImageData {
  const output = new ImageData(
    new Uint8ClampedArray(source.data),
    source.width,
    source.height,
  );
  applyBrightness(output.data, params.brightness);
  applyContrast(output.data, params.contrast);
  applySaturation(output.data, params.saturation);
  return output;
}

function applyBrightness(data: Uint8ClampedArray, value: number): void {
  const offset = (value / 100) * 255;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp((data[i] ?? 0) + offset);
    data[i + 1] = clamp((data[i + 1] ?? 0) + offset);
    data[i + 2] = clamp((data[i + 2] ?? 0) + offset);
  }
}

function applyContrast(data: Uint8ClampedArray, value: number): void {
  const factor = (259 * (value + 255)) / (255 * (259 - value));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(factor * ((data[i] ?? 0) - 128) + 128);
    data[i + 1] = clamp(factor * ((data[i + 1] ?? 0) - 128) + 128);
    data[i + 2] = clamp(factor * ((data[i + 2] ?? 0) - 128) + 128);
  }
}

function applySaturation(data: Uint8ClampedArray, value: number): void {
  const factor = 1 + value / 100;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    data[i] = clamp(gray + factor * (r - gray));
    data[i + 1] = clamp(gray + factor * (g - gray));
    data[i + 2] = clamp(gray + factor * (b - gray));
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
