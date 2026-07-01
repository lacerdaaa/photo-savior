import { useRef, useState } from "react";
import { Circle, Image as KonvaImage, Layer as KonvaLayer, Rect, Stage } from "react-konva";
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
const ZOOM_FACTOR = 1.15;
const ZOOM_MIN = 0.05;
const ZOOM_MAX = 20;

type Point = { x: number; y: number };

export default function EditorStage() {
  const stageRef = useRef<Konva.Stage>(null);
  const eraserPreviewRef = useRef<Konva.Image>(null);

  const layers = useEditorStore((s) => s.layers);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const activeTool = useEditorStore((s) => s.activeTool);
  const eraserSize = useEditorStore((s) => s.eraserSize);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setSelection = useEditorStore((s) => s.setSelection);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);

  const zoom = useEditorStore((s) => s.zoom);
  const eraser = useEraser(eraserPreviewRef);

  const [drawingRect, setDrawingRect] = useState<RectBounds | null>(null);
  const [eraserPos, setEraserPos] = useState<Point | null>(null);
  const startPos = useRef<Point | null>(null);
  const panStart = useRef<{
    screenX: number; screenY: number; stageX: number; stageY: number;
  } | null>(null);

  const visibleLayers = [...layers]
    .filter((l) => l.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  const activeLayer = layers.find((l) => l.id === activeLayerId) ?? null;

  function toLocal(e: Konva.KonvaEventObject<MouseEvent>): Point | null {
    const stage = stageRef.current ?? e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!stage || !pos) return null;
    return {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    };
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (stage === null) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (pointer === null) return;

    const origin = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0
      ? Math.min(ZOOM_MAX, oldScale * ZOOM_FACTOR)
      : Math.max(ZOOM_MIN, oldScale / ZOOM_FACTOR);

    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: pointer.x - origin.x * newScale,
      y: pointer.y - origin.y * newScale,
    });
    stage.batchDraw();
    setZoom(Math.round(newScale * 100));
  }

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (stage === null) return;
      panStart.current = {
        screenX: e.evt.clientX, screenY: e.evt.clientY,
        stageX: stage.x(), stageY: stage.y(),
      };
      return;
    }
    if (activeTool === "eraser") {
      eraser.handlePointerDown(e);
      return;
    }
    if (e.target !== e.target.getStage()) return;
    setActiveLayer(null);
    setSelection(null);
    const pos = toLocal(e);
    if (pos === null) return;
    startPos.current = pos;
    setDrawingRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (panStart.current !== null) {
      const stage = stageRef.current;
      if (stage === null) return;
      stage.position({
        x: panStart.current.stageX + (e.evt.clientX - panStart.current.screenX),
        y: panStart.current.stageY + (e.evt.clientY - panStart.current.screenY),
      });
      stage.batchDraw();
      return;
    }
    const pos = toLocal(e);
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

  function handleMouseUp(e: Konva.KonvaEventObject<MouseEvent>) {
    if (e.evt.button === 1) { panStart.current = null; return; }
    if (activeTool === "eraser") { eraser.handlePointerUp(); return; }
    const rect = drawingRect;
    setDrawingRect(null);
    startPos.current = null;
    if (rect !== null && rect.w > MIN_SELECTION && rect.h > MIN_SELECTION) {
      setSelection({ type: "rect", bounds: rect });
    }
  }

  function handleMouseLeave() {
    setEraserPos(null);
    panStart.current = null;
  }

  const currentScale = zoom / 100;

  return (
    <div className="overflow-hidden bg-base-300 flex items-center justify-center h-full select-none">
      <div className="shadow-xl" style={{ cursor: activeTool === "eraser" ? "none" : "default" }}>
        <Stage
          ref={stageRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          style={{ background: "#ffffff" }}
          onWheel={handleWheel}
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
                isErasing={layer.id === eraser.erasingLayerId}
              />
            ))}
            {eraser.erasingLayerId !== null && activeLayer !== null && (
              <KonvaImage
                ref={eraserPreviewRef}
                image={undefined}
                x={activeLayer.x}
                y={activeLayer.y}
                width={activeLayer.width}
                height={activeLayer.height}
                rotation={activeLayer.rotation}
                opacity={activeLayer.opacity}
                listening={false}
              />
            )}
          </KonvaLayer>
          <KonvaLayer>
            {activeTool === "select" && <TransformerBox stageRef={stageRef} />}
            <SelectionRect />
            {drawingRect !== null && (
              <Rect
                x={drawingRect.x}
                y={drawingRect.y}
                width={drawingRect.w}
                height={drawingRect.h}
                stroke="#3b82f6"
                strokeWidth={1.5 / currentScale}
                dash={[6 / currentScale, 3 / currentScale]}
                listening={false}
              />
            )}
            {activeTool === "eraser" && eraserPos !== null && (
              <Circle
                x={eraserPos.x}
                y={eraserPos.y}
                radius={eraserSize}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={1.5 / currentScale}
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
