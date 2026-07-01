import { useRef } from "react";
import LayerItem from "@/ui/LayerItem";
import { useEditorStore } from "@/store/editorStore";

export default function LayerPanel() {
  const { layers, activeLayerId, reorderLayer } = useEditorStore();
  const draggedId = useRef<string | null>(null);

  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  function handleDragStart(_e: React.DragEvent, id: string) {
    draggedId.current = id;
  }

  function handleDrop(_e: React.DragEvent, targetZIndex: number) {
    if (draggedId.current === null) return;
    reorderLayer(draggedId.current, targetZIndex);
    draggedId.current = null;
  }

  return (
    <aside className="w-64 bg-base-100 border-l border-base-300 flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-base-300">
        <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
          Camadas
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {sorted.length === 0 ? (
          <p className="text-center text-xs text-base-content/30 py-6">
            Sem camadas
          </p>
        ) : (
          sorted.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={layer.id === activeLayerId}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>
    </aside>
  );
}
