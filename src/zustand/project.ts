import type { StateCreator } from "zustand";
import { produce } from "immer";
import { ProjectState } from "./project.types";
import { ARBITRUM_NETWORK } from "../const/network";

const initial = {
  name: {
    loading: false,
    error: false,
    data: null,
  },
  template: {
    loading: false,
    error: false,
    data: null,
  },
  templates: {
    loading: false,
    error: false,
    data: ["hello-world", "erc20", "erc721", "single_call", "vending_machine"],
  },
  network: {
    loading: false,
    error: false,
    data: null,
  },
  networks: {
    loading: false,
    error: false,
    data: ARBITRUM_NETWORK,
  },
  projects: {
    loading: false,
    error: false,
    data: null,
  },
  project: {
    loading: false,
    error: false,
    data: null,
  },
};

export const createProjectStore: StateCreator<ProjectState> = (set) => ({
  project: {
    ...initial,
    setName: (name: string) =>
      set(
        produce((state: ProjectState) => {
          state.project.name.data = name;
        })
      ),
    setTemplate: (template: string) =>
      set(
        produce((state: ProjectState) => {
          state.project.template.data = template;
        })
      ),
    setProjects: (projects: string[]) =>
      set(
        produce((state: ProjectState) => {
          state.project.projects.data = projects;
        })
      ),
    setProject: (project: string) =>
      set(
        produce((state: ProjectState) => {
          state.project.project.data = project;
        })
      ),
    setNetwork: (network) =>
      set(
        produce((state: ProjectState) => {
          state.project.network.data = network;
        })
      ),
  },
});
