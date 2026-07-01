import { useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import { DEFAULT_FILTERS_EXPORT as DEFAULT_FILTERS } from "@/store/editorStore";
import { captureImageData, loadImage } from "@/utils/imageUtils";
import { generateId } from "@/utils/idGen";

export function useUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const addLayer = useEditorStore((s) => s.addLayer);

  function openFilePicker() {
    inputRef.current?.click();
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file === undefined) return;

    const img = await loadImage(file);
    const imageData = captureImageData(img);

    addLayer({
      id: generateId(),
      imageElement: img,
      imageData,
      filters: { ...DEFAULT_FILTERS },
      x: 0,
      y: 0,
      width: img.naturalWidth,
      height: img.naturalHeight,
      rotation: 0,
      opacity: 1,
      visible: true,
      zIndex: 0,
    });

    if (inputRef.current !== null) inputRef.current.value = "";
  }

  return { inputRef, openFilePicker, handleChange };
}
