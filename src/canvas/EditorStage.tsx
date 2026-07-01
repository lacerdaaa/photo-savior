import { useRef, useState } from "react";
import { Layer as KonvaLayer, Rect, Stage } from "react-konva";
import type Konva from "konva";
import LayerImage from "@/canvas/LayerImage";
import SelectionRect from "@/canvas/SelectionRect";
import TransformerBox from "@/canvas/TransformerBox";
import { useEditorStore } from "@/store/editorStore";
import type { RectBounds } from "@/types";

const STAGE_WIDTH = 900;
const STAGE_HEIGHT = 600;
const MIN_SELECTION = 5;

export default function EditorStage() {
  const stageRef = useRef<Konva.Stage>(null);
  const layers = useEditorStore((s) => s.layers);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const setSelection = useEditorStore((s) => s.setSelection);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);

  const [drawingRect, setDrawingRect] = useState<RectBounds | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const visibleLayers = [...layers]
    .filter((l) => l.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  function getPointer(e: Konva.KonvaEventObject<MouseEvent>) {
    return e.target.getStage()?.getPointerPosition() ?? null;
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.target !== e.target.getStage()) return;
    setActiveLayer(null);
    setSelection(null);
    const pos = getPointer(e);
    if (pos === null) return;
    startPos.current = pos;
    setDrawingRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (startPos.current === null) return;
    const pos = getPointer(e);
    if (pos === null) return;
    setDrawingRect({
      x: Math.min(startPos.current.x, pos.x),
      y: Math.min(startPos.current.y, pos.y),
      w: Math.abs(pos.x - startPos.current.x),
      h: Math.abs(pos.y - startPos.current.y),
    });
  }

  function handleMouseUp() {
    const rect = drawingRect;
    setDrawingRect(null);
    startPos.current = null;
    if (rect !== null && rect.w > MIN_SELECTION && rect.h > MIN_SELECTION) {
      setSelection({ type: "rect", bounds: rect });
    }
  }

  return (
    <div className="overflow-auto bg-base-300 flex items-center justify-center h-full">
      <div className="shadow-xl">
        <Stage
          ref={stageRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          style={{ background: "#ffffff" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <KonvaLayer>
            {visibleLayers.map((layer) => (
              <LayerImage
                key={layer.id}
                layer={layer}
                isActive={layer.id === activeLayerId}
              />
            ))}
          </KonvaLayer>
          <KonvaLayer>
            <TransformerBox stageRef={stageRef} />
            <SelectionRect />
            {drawingRect !== null && (
              <Rect
                x={drawingRect.x}
                y={drawingRect.y}
                width={drawingRect.w}
                height={drawingRect.h}
                stroke="#3b82f6"
                strokeWidth={1.5}
                dash={[6, 3]}
                listening={false}
              />
            )}
          </KonvaLayer>
        </Stage>
      </div>
    </div>
  );
}

export { STAGE_HEIGHT, STAGE_WIDTH };
