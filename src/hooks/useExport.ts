import { useEditorStore } from "@/store/editorStore";
import { STAGE_HEIGHT, STAGE_WIDTH } from "@/canvas/EditorStage";
import { compositeToBlob } from "@/utils/imageUtils";

export function useExport() {
  const layers = useEditorStore((s) => s.layers);

  async function exportAs(format: "png" | "jpeg") {
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const quality = format === "jpeg" ? 0.92 : 1;
    const blob = await compositeToBlob(layers, STAGE_WIDTH, STAGE_HEIGHT, mimeType, quality);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `photo-saviour.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { exportAs };
}
