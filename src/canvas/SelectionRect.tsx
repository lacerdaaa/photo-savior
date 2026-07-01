import { Rect } from "react-konva";
import { useEditorStore } from "@/store/editorStore";

export default function SelectionRect() {
  const selection = useEditorStore((s) => s.selection);
  if (selection === null) return null;
  const { x, y, w, h } = selection.bounds;

  return (
    <Rect
      x={x}
      y={y}
      width={w}
      height={h}
      stroke="#3b82f6"
      strokeWidth={1.5}
      dash={[6, 3]}
      listening={false}
    />
  );
}
