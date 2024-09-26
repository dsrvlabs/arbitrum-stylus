import type { StateCreator } from "zustand";
import { ProjectState } from "./project.types";

export const createProjectStore: StateCreator<ProjectState> = (set) => ({
  name: "",
  templates: [],
  template: "",
  projects: [],
  project: "",
  setName: (name: string) => set({ name }),
  setTemplates: (templates: string[]) => set({ templates }),
  setTemplate: (template: string) => set({ template }),
  setProjects: (projects: string[]) => set({ projects }),
  setProject: (project: string) => set({ project }),
});
