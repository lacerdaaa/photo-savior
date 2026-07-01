import { useRef } from "react";
import type Konva from "konva";
import { useEditorStore } from "@/store/editorStore";
import type { Layer } from "@/types";

type StrokeState = {
  layerId: string;
  buffer: Uint8ClampedArray<ArrayBuffer>;
  imgW: number;
  imgH: number;
};

function stageToImageCoords(
  stageX: number,
  stageY: number,
  layer: Layer,
): { x: number; y: number } {
  const cx = layer.x + layer.width / 2;
  const cy = layer.y + layer.height / 2;
  const dx = stageX - cx;
  const dy = stageY - cy;
  const rad = -(layer.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const lx = dx * cos - dy * sin + layer.width / 2;
  const ly = dx * sin + dy * cos + layer.height / 2;
  return {
    x: Math.round(lx * (layer.imageData.width / layer.width)),
    y: Math.round(ly * (layer.imageData.height / layer.height)),
  };
}

function eraseCircle(
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

export function useEraser() {
  const strokeRef = useRef<StrokeState | null>(null);
  const { _pushHistory, updateLayerImageData, eraserSize } = useEditorStore();

  function getActiveLayer(): Layer | null {
    const { layers, activeLayerId } = useEditorStore.getState();
    return layers.find((l) => l.id === activeLayerId) ?? null;
  }

  function getPointer(e: Konva.KonvaEventObject<MouseEvent>) {
    return e.target.getStage()?.getPointerPosition() ?? null;
  }

  function applyAt(stageX: number, stageY: number, layer: Layer) {
    const stroke = strokeRef.current;
    if (stroke === null || stroke.layerId !== layer.id) return;
    const { x, y } = stageToImageCoords(stageX, stageY, layer);
    const radiusInImage = Math.max(
      1,
      Math.round(eraserSize * (layer.imageData.width / layer.width)),
    );
    eraseCircle(stroke.buffer, stroke.imgW, stroke.imgH, x, y, radiusInImage);
    updateLayerImageData(
      layer.id,
      new ImageData(stroke.buffer, stroke.imgW, stroke.imgH),
    );
  }

  function handlePointerDown(e: Konva.KonvaEventObject<MouseEvent>) {
    const layer = getActiveLayer();
    if (layer === null) return;
    const pos = getPointer(e);
    if (pos === null) return;
    _pushHistory();
    strokeRef.current = {
      layerId: layer.id,
      buffer: new Uint8ClampedArray(layer.imageData.data.buffer.slice(0)) as Uint8ClampedArray<ArrayBuffer>,
      imgW: layer.imageData.width,
      imgH: layer.imageData.height,
    };
    applyAt(pos.x, pos.y, layer);
  }

  function handlePointerMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (strokeRef.current === null) return;
    const layer = getActiveLayer();
    if (layer === null) return;
    const pos = getPointer(e);
    if (pos === null) return;
    applyAt(pos.x, pos.y, layer);
  }

  function handlePointerUp() {
    strokeRef.current = null;
  }

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}
