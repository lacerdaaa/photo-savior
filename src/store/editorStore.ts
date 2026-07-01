import { create } from "zustand";
import type {
  FilterParams,
  HistoryEntry,
  Layer,
  Selection,
} from "@/types";

const HISTORY_LIMIT = 50;

const DEFAULT_FILTERS: FilterParams = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

type ResizePayload = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type EditorState = {
  layers: Layer[];
  activeLayerId: string | null;
  selection: Selection | null;
  past: HistoryEntry[];
  future: HistoryEntry[];

  _pushHistory: () => void;
  addLayer: (layer: Layer) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  toggleVisible: (id: string) => void;
  reorderLayer: (id: string, targetZIndex: number) => void;
  setActiveLayer: (id: string | null) => void;
  moveLayer: (id: string, x: number, y: number) => void;
  resizeLayer: (id: string, payload: ResizePayload) => void;
  setOpacity: (id: string, opacity: number) => void;
  setFilters: (id: string, filters: FilterParams) => void;
  setSelection: (selection: Selection | null) => void;
  undo: () => void;
  redo: () => void;
  resetEditor: () => void;
};

function snapshot(
  state: Pick<EditorState, "layers" | "activeLayerId" | "selection">,
): HistoryEntry {
  return {
    layers: [...state.layers],
    activeLayerId: state.activeLayerId,
    selection: state.selection,
  };
}

function updateLayer(
  layers: Layer[],
  id: string,
  patch: Partial<Layer>,
): Layer[] {
  return layers.map((l) => (l.id === id ? { ...l, ...patch } : l));
}

function reassignZIndexes(layers: Layer[]): Layer[] {
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  return sorted.map((l, i) => ({ ...l, zIndex: i }));
}

export const useEditorStore = create<EditorState>((set, get) => ({
  layers: [],
  activeLayerId: null,
  selection: null,
  past: [],
  future: [],

  _pushHistory: () => {
    const state = get();
    set({
      past: [
        ...state.past.slice(-(HISTORY_LIMIT - 1)),
        snapshot(state),
      ],
      future: [],
    });
  },

  addLayer: (layer) => {
    get()._pushHistory();
    set((state) => {
      const zIndex = state.layers.length;
      return {
        layers: [...state.layers, { ...layer, zIndex }],
        activeLayerId: layer.id,
      };
    });
  },

  deleteLayer: (id) => {
    get()._pushHistory();
    set((state) => {
      const remaining = reassignZIndexes(
        state.layers.filter((l) => l.id !== id),
      );
      const activeId =
        state.activeLayerId === id
          ? (remaining.at(-1)?.id ?? null)
          : state.activeLayerId;
      return { layers: remaining, activeLayerId: activeId };
    });
  },

  duplicateLayer: (id) => {
    get()._pushHistory();
    set((state) => {
      const source = state.layers.find((l) => l.id === id);
      if (source === undefined) return {};
      const copy: Layer = {
        ...source,
        id: crypto.randomUUID(),
        x: source.x + 20,
        y: source.y + 20,
        zIndex: state.layers.length,
      };
      return { layers: [...state.layers, copy], activeLayerId: copy.id };
    });
  },

  toggleVisible: (id) => {
    set((state) => ({
      layers: updateLayer(state.layers, id, {
        visible: !state.layers.find((l) => l.id === id)?.visible,
      }),
    }));
  },

  reorderLayer: (id, targetZIndex) => {
    get()._pushHistory();
    set((state) => {
      const moved = updateLayer(state.layers, id, { zIndex: targetZIndex });
      return { layers: reassignZIndexes(moved) };
    });
  },

  setActiveLayer: (id) => {
    set({ activeLayerId: id });
  },

  moveLayer: (id, x, y) => {
    set((state) => ({ layers: updateLayer(state.layers, id, { x, y }) }));
  },

  resizeLayer: (id, payload) => {
    set((state) => ({ layers: updateLayer(state.layers, id, payload) }));
  },

  setOpacity: (id, opacity) => {
    get()._pushHistory();
    set((state) => ({ layers: updateLayer(state.layers, id, { opacity }) }));
  },

  setFilters: (id, filters) => {
    set((state) => ({ layers: updateLayer(state.layers, id, { filters }) }));
  },

  setSelection: (selection) => {
    set({ selection });
  },

  undo: () => {
    const { past, future } = get();
    const prev = past.at(-1);
    if (prev === undefined) return;
    const current = snapshot(get());
    set({
      ...prev,
      layers: [...prev.layers],
      past: past.slice(0, -1),
      future: [current, ...future],
    });
  },

  redo: () => {
    const { past, future } = get();
    const next = future[0];
    if (next === undefined) return;
    const current = snapshot(get());
    set({
      ...next,
      layers: [...next.layers],
      past: [...past, current],
      future: future.slice(1),
    });
  },

  resetEditor: () => {
    set({
      layers: [],
      activeLayerId: null,
      selection: null,
      past: [],
      future: [],
    });
  },
}));

export const DEFAULT_FILTERS_EXPORT = DEFAULT_FILTERS;

export function useActiveLayer(): Layer | null {
  return useEditorStore((s) =>
    s.layers.find((l) => l.id === s.activeLayerId) ?? null,
  );
}

export function useCanUndo(): boolean {
  return useEditorStore((s) => s.past.length > 0);
}

export function useCanRedo(): boolean {
  return useEditorStore((s) => s.future.length > 0);
}
