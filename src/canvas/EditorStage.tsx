import { useRef, useState } from "react";
import { Circle, Layer as KonvaLayer, Rect, Stage } from "react-konva";
import type Konva from "konva";
import LayerImage from "@/canvas/LayerImage";
import SelectionRect from "@/canvas/SelectionRect";
import TransformerBox from "@/canvas/TransformerBox";
import { useEraser } from "@/hooks/useEraser";
import { useEditorStore } from "@/store/editorStore";
import type { RectBounds } from "@/types";

const STAGE_WIDTH = 900;
const STAGE_HEIGHT = 600;
const MIN_SELECTION = 5;

type Point = { x: number; y: number };

export default function EditorStage() {
  const stageRef = useRef<Konva.Stage>(null);
  const layers = useEditorStore((s) => s.layers);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const activeTool = useEditorStore((s) => s.activeTool);
  const eraserSize = useEditorStore((s) => s.eraserSize);
  const setSelection = useEditorStore((s) => s.setSelection);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);
  const eraser = useEraser();

  const [drawingRect, setDrawingRect] = useState<RectBounds | null>(null);
  const [eraserPos, setEraserPos] = useState<Point | null>(null);
  const startPos = useRef<Point | null>(null);

  const visibleLayers = [...layers]
    .filter((l) => l.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  function getPointer(e: Konva.KonvaEventObject<MouseEvent>) {
    return e.target.getStage()?.getPointerPosition() ?? null;
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool === "eraser") {
      eraser.handlePointerDown(e);
      return;
    }
    if (e.target !== e.target.getStage()) return;
    setActiveLayer(null);
    setSelection(null);
    const pos = getPointer(e);
    if (pos === null) return;
    startPos.current = pos;
    setDrawingRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    const pos = getPointer(e);
    if (activeTool === "eraser") {
      setEraserPos(pos);
      eraser.handlePointerMove(e);
      return;
    }
    if (startPos.current === null || pos === null) return;
    setDrawingRect({
      x: Math.min(startPos.current.x, pos.x),
      y: Math.min(startPos.current.y, pos.y),
      w: Math.abs(pos.x - startPos.current.x),
      h: Math.abs(pos.y - startPos.current.y),
    });
  }

  function handleMouseUp(_e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool === "eraser") {
      eraser.handlePointerUp();
      return;
    }
    const rect = drawingRect;
    setDrawingRect(null);
    startPos.current = null;
    if (rect !== null && rect.w > MIN_SELECTION && rect.h > MIN_SELECTION) {
      setSelection({ type: "rect", bounds: rect });
    }
  }

  function handleMouseLeave() {
    setEraserPos(null);
  }

  const cursorStyle = activeTool === "eraser" ? "none" : "default";

  return (
    <div className="overflow-auto bg-base-300 flex items-center justify-center h-full">
      <div className="shadow-xl" style={{ cursor: cursorStyle }}>
        <Stage
          ref={stageRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          style={{ background: "#ffffff" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <KonvaLayer>
            {visibleLayers.map((layer) => (
              <LayerImage
                key={layer.id}
                layer={layer}
                isActive={layer.id === activeLayerId}
                toolMode={activeTool}
              />
            ))}
          </KonvaLayer>
          <KonvaLayer>
            {activeTool === "select" && (
              <TransformerBox stageRef={stageRef} />
            )}
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
            {activeTool === "eraser" && eraserPos !== null && (
              <Circle
                x={eraserPos.x}
                y={eraserPos.y}
                radius={eraserSize}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={1.5}
                fill="rgba(255,255,255,0.08)"
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
