import { useNavigate, useParams } from "react-router";
import EditorStage from "@/canvas/EditorStage";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import FilterControls from "@/ui/FilterControls";
import LayerPanel from "@/ui/LayerPanel";
import Toolbar from "@/ui/Toolbar";

export default function EditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  useKeyboardShortcuts();

  return (
    <div className="h-screen bg-base-100 flex flex-col overflow-hidden">
      <div className="navbar bg-base-200 border-b border-base-300 shrink-0 px-4">
        <div className="navbar-start">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => void navigate("/projects")}
          >
            ← Projetos
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm font-semibold text-base-content/70">
            Projeto {id?.slice(0, 8)}
          </span>
        </div>
        <div className="navbar-end" />
      </div>

      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <EditorStage />
        </main>

        <aside className="w-64 bg-base-100 border-l border-base-300 flex flex-col overflow-hidden shrink-0">
          <LayerPanel />
          <div className="border-t border-base-300">
            <FilterControls />
          </div>
        </aside>
      </div>
    </div>
  );
}
