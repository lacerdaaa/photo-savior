import { useNavigate } from "react-router";
import { useProjectStore } from "@/store/projectStore";

export default function LandingPage() {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);

  function handleNewProject() {
    const id = createProject("Novo Projeto");
    void navigate(`/editor/${id}`);
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="hero min-h-screen">
        <div className="hero-content text-center flex-col gap-12 max-w-2xl">
          <div className="flex flex-col gap-4">
            <h1 className="text-6xl font-extrabold tracking-tight text-base-content">
              Photo Saviour
            </h1>
            <p className="text-xl text-base-content/70">
              Editor de fotos no browser — camadas, filtros, crop e export.
              Sem login, sem servidor.
            </p>
          </div>

          <div className="flex gap-4 flex-wrap justify-center">
            <button className="btn btn-primary btn-lg" onClick={handleNewProject}>
              Novo Projeto
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => void navigate("/projects")}
            >
              Ver Projetos
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full sm:grid-cols-4">
            {features.map((f) => (
              <div key={f.label} className="card bg-base-200 card-sm">
                <div className="card-body items-center text-center gap-2">
                  <span className="text-2xl">{f.icon}</span>
                  <p className="text-sm font-medium text-base-content">{f.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: "🗂️", label: "Camadas" },
  { icon: "✂️", label: "Crop" },
  { icon: "🎨", label: "Filtros" },
  { icon: "💾", label: "Export PNG/JPEG" },
];
