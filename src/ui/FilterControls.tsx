import { useActiveLayer, useEditorStore } from "@/store/editorStore";
import type { FilterParams } from "@/types";

export default function FilterControls() {
  const activeLayer = useActiveLayer();
  const setFilters = useEditorStore((s) => s.setFilters);
  const _pushHistory = useEditorStore((s) => s._pushHistory);

  if (activeLayer === null) {
    return (
      <div className="p-4 text-center text-base-content/40 text-sm">
        Selecione uma camada
      </div>
    );
  }

  const { filters, id } = activeLayer;

  function handleChange(key: keyof FilterParams, value: number) {
    if (activeLayer === null) return;
    setFilters(id, { ...filters, [key]: value });
  }

  function handlePointerUp() {
    _pushHistory();
  }

  return (
    <div className="p-4 flex flex-col gap-5">
      <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
        Filtros
      </p>
      <FilterSlider
        label="Brilho"
        value={filters.brightness}
        onChange={(v) => handleChange("brightness", v)}
        onPointerUp={handlePointerUp}
      />
      <FilterSlider
        label="Contraste"
        value={filters.contrast}
        onChange={(v) => handleChange("contrast", v)}
        onPointerUp={handlePointerUp}
      />
      <FilterSlider
        label="Saturação"
        value={filters.saturation}
        onChange={(v) => handleChange("saturation", v)}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}

function FilterSlider({
  label,
  value,
  onChange,
  onPointerUp,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onPointerUp: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-base-content">{label}</span>
        <span className="text-xs text-base-content/50 tabular-nums w-8 text-right">
          {value}
        </span>
      </div>
      <input
        type="range"
        className="range range-primary range-xs"
        min="-100"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onPointerUp}
      />
    </div>
  );
}
