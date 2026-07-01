import {
  Crop,
  Download,
  ImagePlus,
  Redo2,
  Undo2,
} from "lucide-react";
import { useExport } from "@/hooks/useExport";
import { useUpload } from "@/hooks/useUpload";
import { useActiveLayer, useCanRedo, useCanUndo, useEditorStore } from "@/store/editorStore";

export default function Toolbar() {
  const { inputRef, openFilePicker, handleChange } = useUpload();
  const { exportAs } = useExport();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const { undo, redo, cropSelection } = useEditorStore();
  const selection = useEditorStore((s) => s.selection);
  const activeLayer = useActiveLayer();

  function handleCrop() {
    if (activeLayer === null || selection === null) return;
    cropSelection(activeLayer.id);
  }

  return (
    <div className="navbar bg-base-200 border-b border-base-300 shrink-0 px-4 gap-2">
      <div className="navbar-start gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleChange(e)}
        />
        <button className="btn btn-primary btn-sm gap-1.5" onClick={openFilePicker}>
          <ImagePlus size={15} />
          Imagem
        </button>
      </div>

      <div className="navbar-center gap-2">
        <div className="join">
          <button
            className="btn btn-ghost btn-sm join-item"
            disabled={!canUndo}
            onClick={undo}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            className="btn btn-ghost btn-sm join-item"
            disabled={!canRedo}
            onClick={redo}
            title="Refazer (Ctrl+Shift+Z)"
          >
            <Redo2 size={15} />
          </button>
        </div>

        <button
          className="btn btn-ghost btn-sm gap-1.5"
          disabled={activeLayer === null || selection === null}
          onClick={handleCrop}
          title="Crop seleção"
        >
          <Crop size={15} />
          Crop
        </button>
      </div>

      <div className="navbar-end gap-2">
        <button
          className="btn btn-outline btn-sm gap-1.5"
          onClick={() => void exportAs("png")}
          title="Exportar PNG"
        >
          <Download size={15} />
          PNG
        </button>
        <button
          className="btn btn-outline btn-sm gap-1.5"
          onClick={() => void exportAs("jpeg")}
          title="Exportar JPEG"
        >
          <Download size={15} />
          JPEG
        </button>
      </div>
    </div>
  );
}
