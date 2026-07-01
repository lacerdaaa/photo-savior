import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "@/store/editorStore";

type Props = {
  stageRef: React.RefObject<Konva.Stage | null>;
};

export default function TransformerBox({ stageRef }: Props) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);

  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (tr === null || stage === null) return;

    if (activeLayerId === null) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const node = stage.findOne<Konva.Image>(`#${activeLayerId}`);
    tr.nodes(node !== undefined ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [activeLayerId, stageRef]);

  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled={true}
      keepRatio={false}
      boundBoxFunc={(oldBox, newBox) =>
        newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
      }
    />
  );
}
