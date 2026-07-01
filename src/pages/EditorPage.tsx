import { useNavigate, useParams } from "react-router";

export default function EditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <div className="navbar bg-base-200 shadow-sm shrink-0">
        <div className="navbar-start">
          <button className="btn btn-ghost btn-sm" onClick={() => void navigate("/projects")}>
            ← Projetos
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-sm font-semibold text-base-content/70">
            Projeto {id?.slice(0, 8)}
          </span>
        </div>
        <div className="navbar-end gap-2">
          <span className="text-xs text-base-content/40">Editor em construção</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-base-300">
        <div className="text-center gap-4 flex flex-col items-center">
          <span className="text-6xl">🎨</span>
          <p className="text-base-content/50">Canvas do editor virá aqui</p>
        </div>
      </div>
    </div>
  );
}
