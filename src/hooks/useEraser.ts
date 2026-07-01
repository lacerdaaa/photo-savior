import { useRef, useState } from "react";
import type Konva from "konva";
import { applyFilters } from "@/filters/filterPipeline";
import { useEditorStore } from "@/store/editorStore";
import type { Layer } from "@/types";

type StrokeState = {
  layerId: string;
  imgW: number;
  imgH: number;
  layerX: number;
  layerY: number;
  layerW: number;
  layerH: number;
  layerRotation: number;
  layerOpacity: number;
  rawBuffer: Uint8ClampedArray<ArrayBuffer>;
  previewCanvas: OffscreenCanvas;
  previewCtx: OffscreenCanvasRenderingContext2D;
};

function stageToImageCoords(
  stageX: number,
  stageY: number,
  layer: Pick<Layer, "x" | "y" | "width" | "height" | "rotation" | "imageData">,
): { x: number; y: number } {
  const cx = layer.x + layer.width / 2;
  const cy = layer.y + layer.height / 2;
  const rad = -(layer.rotation * Math.PI) / 180;
  const dx = stageX - cx;
  const dy = stageY - cy;
  const lx = dx * Math.cos(rad) - dy * Math.sin(rad) + layer.width / 2;
  const ly = dx * Math.sin(rad) + dy * Math.cos(rad) + layer.height / 2;
  return {
    x: Math.round(lx * (layer.imageData.width / layer.width)),
    y: Math.round(ly * (layer.imageData.height / layer.height)),
  };
}

function eraseRawBuffer(
  buffer: Uint8ClampedArray<ArrayBuffer>,
  imgW: number,
  imgH: number,
  cx: number,
  cy: number,
  radius: number,
): void {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const px = cx + dx;
      const py = cy + dy;
      if (px < 0 || px >= imgW || py < 0 || py >= imgH) continue;
      buffer[(py * imgW + px) * 4 + 3] = 0;
    }
  }
}

export function useEraser(
  previewRef: React.RefObject<Konva.Image | null>,
) {
  const strokeRef = useRef<StrokeState | null>(null);
  const [erasingLayerId, setErasingLayerId] = useState<string | null>(null);

  function getActiveLayer(): Layer | null {
    const { layers, activeLayerId } = useEditorStore.getState();
    return layers.find((l) => l.id === activeLayerId) ?? null;
  }

  function getPointer(e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (stage === null || stage === undefined || pos === null || pos === undefined) return null;
    return {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    };
  }

  function applyAt(stageX: number, stageY: number, stroke: StrokeState) {
    const { x, y } = stageToImageCoords(stageX, stageY, {
      x: stroke.layerX,
      y: stroke.layerY,
      width: stroke.layerW,
      height: stroke.layerH,
      rotation: stroke.layerRotation,
      imageData: { width: stroke.imgW, height: stroke.imgH } as ImageData,
    });

    const { eraserSize } = useEditorStore.getState();
    const radiusInImage = Math.max(
      1,
      Math.round(eraserSize * (stroke.imgW / stroke.layerW)),
    );

    eraseRawBuffer(stroke.rawBuffer, stroke.imgW, stroke.imgH, x, y, radiusInImage);

    stroke.previewCtx.globalCompositeOperation = "destination-out";
    stroke.previewCtx.beginPath();
    stroke.previewCtx.arc(x, y, radiusInImage, 0, Math.PI * 2);
    stroke.previewCtx.fill();
    stroke.previewCtx.globalCompositeOperation = "source-over";

    previewRef.current?.image(stroke.previewCanvas);
    previewRef.current?.getLayer()?.batchDraw();
  }

  function handlePointerDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const layer = getActiveLayer();
    if (layer === null) return;
    const pos = getPointer(e);
    if (pos === null) return;

    useEditorStore.getState()._pushHistory();

    const filtered = applyFilters(layer.imageData, layer.filters);
    const canvas = new OffscreenCanvas(filtered.width, filtered.height);
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;
    ctx.putImageData(filtered, 0, 0);

    const stroke: StrokeState = {
      layerId: layer.id,
      imgW: layer.imageData.width,
      imgH: layer.imageData.height,
      layerX: layer.x,
      layerY: layer.y,
      layerW: layer.width,
      layerH: layer.height,
      layerRotation: layer.rotation,
      layerOpacity: layer.opacity,
      rawBuffer: new Uint8ClampedArray(layer.imageData.data.buffer.slice(0)) as Uint8ClampedArray<ArrayBuffer>,
      previewCanvas: canvas,
      previewCtx: ctx,
    };

    strokeRef.current = stroke;
    setErasingLayerId(layer.id);
    applyAt(pos.x, pos.y, stroke);
  }

  function handlePointerMove(e: Konva.KonvaEventObject<MouseEvent>) {
    const stroke = strokeRef.current;
    if (stroke === null) return;
    const pos = getPointer(e);
    if (pos === null) return;
    applyAt(pos.x, pos.y, stroke);
  }

  function handlePointerUp() {
    const stroke = strokeRef.current;
    strokeRef.current = null;
    setErasingLayerId(null);
    if (stroke === null) return;
    const finalData = new ImageData(stroke.rawBuffer, stroke.imgW, stroke.imgH);
    useEditorStore.getState().updateLayerImageData(stroke.layerId, finalData);
  }

  return { handlePointerDown, handlePointerMove, handlePointerUp, erasingLayerId };
}
