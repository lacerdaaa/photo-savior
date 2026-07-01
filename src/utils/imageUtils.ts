import type { Layer, RectBounds } from "@/types";

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

export function captureImageData(img: HTMLImageElement): ImageData {
  const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Could not get 2d context");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
}

export function cropImageData(
  source: ImageData,
  sourceX: number,
  sourceY: number,
  bounds: RectBounds,
): ImageData {
  const srcRight = sourceX + source.width;
  const srcBottom = sourceY + source.height;
  const cropRight = bounds.x + bounds.w;
  const cropBottom = bounds.y + bounds.h;

  const intLeft = Math.max(bounds.x, sourceX);
  const intTop = Math.max(bounds.y, sourceY);
  const intRight = Math.min(cropRight, srcRight);
  const intBottom = Math.min(cropBottom, srcBottom);

  const w = Math.max(0, intRight - intLeft);
  const h = Math.max(0, intBottom - intTop);

  const canvas = new OffscreenCanvas(Math.max(w, 1), Math.max(h, 1));
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Could not get 2d context");

  const tempCanvas = new OffscreenCanvas(source.width, source.height);
  const tempCtx = tempCanvas.getContext("2d");
  if (tempCtx === null) throw new Error("Could not get 2d context");
  tempCtx.putImageData(source, 0, 0);

  ctx.drawImage(
    tempCanvas,
    intLeft - sourceX,
    intTop - sourceY,
    w,
    h,
    0,
    0,
    w,
    h,
  );

  return ctx.getImageData(0, 0, Math.max(w, 1), Math.max(h, 1));
}

export async function compositeToBlob(
  layers: readonly Layer[],
  stageWidth: number,
  stageHeight: number,
  format: "image/png" | "image/jpeg",
  quality: number,
): Promise<Blob> {
  const { applyFilters } = await import("@/filters/filterPipeline");
  const canvas = new OffscreenCanvas(stageWidth, stageHeight);
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Could not get 2d context");

  const visible = [...layers]
    .filter((l) => l.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of visible) {
    const filtered = applyFilters(layer.imageData, layer.filters);
    const src = new OffscreenCanvas(filtered.width, filtered.height);
    const srcCtx = src.getContext("2d");
    if (srcCtx === null) continue;
    srcCtx.putImageData(filtered, 0, 0);

    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.translate(
      layer.x + layer.width / 2,
      layer.y + layer.height / 2,
    );
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.drawImage(src, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
    ctx.restore();
  }

  const blob = await canvas.convertToBlob({ type: format, quality });
  return blob;
}
