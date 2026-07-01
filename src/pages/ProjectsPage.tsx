import { ArrowLeft, FolderOpen, ImageIcon, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { useProjectStore } from "@/store/projectStore";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, createProject } = useProjectStore();

  function handleNewProject() {
    const id = createProject("Novo Projeto");
    void navigate(`/editor/${id}`);
  }

  function handleOpen(project: Project) {
    void navigate(`/editor/${project.id}`);
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="navbar bg-base-200 shadow-sm">
        <div className="navbar-start">
          <button
            className="btn btn-ghost gap-1.5"
            onClick={() => void navigate("/")}
          >
            <ArrowLeft size={16} />
            Photo Saviour
          </button>
        </div>
        <div className="navbar-center">
          <span className="text-lg font-bold text-base-content">Meus Projetos</span>
        </div>
        <div className="navbar-end">
          <button
            className="btn btn-primary btn-sm gap-1.5"
            onClick={handleNewProject}
          >
            <Plus size={15} />
            Novo Projeto
          </button>
        </div>
      </div>

      <div className="p-8">
        {projects.length === 0 ? (
          <div className="hero min-h-[60vh]">
            <div className="hero-content text-center flex-col gap-6">
              <FolderOpen size={64} className="text-base-content/20" />
              <p className="text-xl text-base-content/60">
                Nenhum projeto ainda. Crie o primeiro!
              </p>
              <button className="btn btn-primary gap-1.5" onClick={handleNewProject}>
                <Plus size={16} />
                Criar Projeto
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (p: Project) => void;
}) {
  return (
    <div
      className="card bg-base-200 card-border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onOpen(project)}
    >
      <div className="card-body gap-3">
        <div className="aspect-video bg-base-300 rounded-lg flex items-center justify-center">
          <ImageIcon size={32} className="text-base-content/20" />
        </div>
        <div>
          <h2 className="card-title text-sm">{project.name}</h2>
          <p className="text-xs text-base-content/50">
            {new Date(project.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  );
}
