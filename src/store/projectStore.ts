import { create } from "zustand";
import type { Project } from "@/types";
import { generateId } from "@/utils/idGen";

type ProjectState = {
  projects: Project[];
  createProject: (name: string) => string;
};

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],

  createProject: (name: string) => {
    const id = generateId();
    set((state) => ({
      projects: [
        ...state.projects,
        { id, name, createdAt: Date.now() },
      ],
    }));
    return id;
  },
}));
