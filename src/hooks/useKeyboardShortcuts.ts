import { useEffect } from "react";
import { useEditorStore } from "@/store/editorStore";

export function useKeyboardShortcuts() {
  const { undo, redo, deleteLayer, activeLayerId } = useEditorStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const isMac = navigator.platform.toLowerCase().includes("mac");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
        return;
      }
      if (ctrl && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (activeLayerId !== null) {
          e.preventDefault();
          deleteLayer(activeLayerId);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, deleteLayer, activeLayerId]);
}
