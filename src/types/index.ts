export type FilterParams = {
  brightness: number;
  contrast: number;
  saturation: number;
};

export type Layer = {
  id: string;
  imageElement: HTMLImageElement;
  imageData: ImageData;
  filters: FilterParams;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  zIndex: number;
};

export type RectBounds = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Selection = {
  type: "rect";
  bounds: RectBounds;
};

export type HistoryEntry = {
  layers: readonly Layer[];
  activeLayerId: string | null;
  selection: Selection | null;
};

export type Project = {
  id: string;
  name: string;
  createdAt: number;
};
