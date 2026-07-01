import { useMemo, useRef } from "react";
import { Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import { applyFilters } from "@/filters/filterPipeline";
import { useEditorStore } from "@/store/editorStore";
import type { ActiveTool } from "@/types";
import type { Layer } from "@/types";

type Props = {
  layer: Layer;
  isActive: boolean;
  toolMode: ActiveTool;
};

export default function LayerImage({ layer, isActive, toolMode }: Props) {
  const imageRef = useRef<Konva.Image>(null);
  const { moveLayer, resizeLayer, _pushHistory } = useEditorStore();
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);

  const filteredCanvas = useMemo(() => {
    const filtered = applyFilters(layer.imageData, layer.filters);
    const canvas = new OffscreenCanvas(
      Math.max(filtered.width, 1),
      Math.max(filtered.height, 1),
    );
    const ctx = canvas.getContext("2d");
    if (ctx !== null) ctx.putImageData(filtered, 0, 0);
    return canvas;
  }, [layer.imageData, layer.filters]);

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    _pushHistory();
    moveLayer(layer.id, e.target.x(), e.target.y());
  }

  function handleTransformEnd(e: Konva.KonvaEventObject<Event>) {
    _pushHistory();
    const node = e.target;
    resizeLayer(layer.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(1, node.width() * node.scaleX()),
      height: Math.max(1, node.height() * node.scaleY()),
      rotation: node.rotation(),
    });
    node.scaleX(1);
    node.scaleY(1);
  }

  return (
    <KonvaImage
      ref={imageRef}
      id={layer.id}
      image={filteredCanvas}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={isActive && toolMode === "select"}
      onClick={() => setActiveLayer(layer.id)}
      onTap={() => setActiveLayer(layer.id)}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
}

