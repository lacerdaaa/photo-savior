import { useEditorStore } from "@/store/editorStore";
import type { Layer } from "@/types";

type Props = {
  layer: Layer;
  isActive: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, zIndex: number) => void;
};

export default function LayerItem({ layer, isActive, onDragStart, onDrop }: Props) {
  const { deleteLayer, duplicateLayer, toggleVisible, setActiveLayer } =
    useEditorStore();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-base-200"
      }`}
      draggable
      onClick={() => setActiveLayer(layer.id)}
      onDragStart={(e) => onDragStart(e, layer.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, layer.zIndex)}
    >
      <div className="w-10 h-10 rounded bg-base-300 shrink-0 overflow-hidden flex items-center justify-center">
        <LayerThumbnail layer={layer} />
      </div>

      <span className="flex-1 text-xs text-base-content truncate min-w-0">
        Camada {layer.zIndex + 1}
      </span>

      <div className="flex gap-1 shrink-0">
        <button
          className="btn btn-ghost btn-xs btn-square"
          title={layer.visible ? "Esconder" : "Mostrar"}
          onClick={(e) => { e.stopPropagation(); toggleVisible(layer.id); }}
        >
          {layer.visible ? "👁" : "🚫"}
        </button>
        <button
          className="btn btn-ghost btn-xs btn-square"
          title="Duplicar"
          onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
        >
          ⧉
        </button>
        <button
          className="btn btn-ghost btn-xs btn-square text-error"
          title="Apagar"
          onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function LayerThumbnail({ layer }: { layer: Layer }) {
  const canvas = (() => {
    try {
      const c = new OffscreenCanvas(40, 40);
      const ctx = c.getContext("2d");
      if (ctx === null) return null;
      const scale = Math.min(40 / layer.imageData.width, 40 / layer.imageData.height);
      const w = layer.imageData.width * scale;
      const h = layer.imageData.height * scale;
      const tmpC = new OffscreenCanvas(layer.imageData.width, layer.imageData.height);
      const tmpCtx = tmpC.getContext("2d");
      if (tmpCtx === null) return null;
      tmpCtx.putImageData(layer.imageData, 0, 0);
      ctx.drawImage(tmpC, (40 - w) / 2, (40 - h) / 2, w, h);
      return c;
    } catch {
      return null;
    }
  })();

  if (canvas === null) return <span className="text-xs">🖼</span>;

  return (
    <canvas
      width={40}
      height={40}
      ref={(el) => {
        if (el === null) return;
        const ctx = el.getContext("2d");
        if (ctx === null) return;
        ctx.drawImage(canvas, 0, 0);
      }}
    />
  );
}
