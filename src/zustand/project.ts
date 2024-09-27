import type { StateCreator } from "zustand";
import { produce } from "immer";
import { ProjectState } from "./project.types";
import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../const/network";
import { GlobalState } from "./global.types";

const initial = {
  errorMsg: null,
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
    data: ARBITRUM_ONE,
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

export const createProjectStore: StateCreator<ProjectState & GlobalState, [], [], ProjectState> = (set, get) => ({
  project: {
    ...initial,
    setErrorMsg: (msg: string) =>
      set(
        produce((state: ProjectState) => {
          state.project.errorMsg = msg;
        })
      ),
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
    setProject: (project: string) =>
      set(
        produce((state: ProjectState) => {
          state.project.project.data = project;
        })
      ),
    fetchProjects: async () => {
      const client = get().global.client;
      if (!client) {
        set(
          produce((state: ProjectState) => {
            state.project.projects.error = true;
            return;
          })
        );
        return;
      }
      set(
        produce((state: ProjectState) => {
          state.project.projects.loading = true;
        })
      );

      const findTomlFileRecursively = async (currentPath: string): Promise<void> => {
        const list = await client.fileManager.readdir(currentPath);
        const hasTomlFile = Object.keys(list).some((item) => item.endsWith("Cargo.toml"));
        if (hasTomlFile) {
          set(
            produce((state: ProjectState) => {
              state.project.projects.data = [
                ...new Set([...(state.project.projects.data ?? []), currentPath.replace("browser/", "")]),
              ];
              // state.project.projects.data = [
              //   ...(state.project.projects.data ?? []),
              //   currentPath.replace("browser/", ""),
              // ];
            })
          );
        }

        for (const [key, value] of Object.entries(list)) {
          if ((value as any).isDirectory) {
            const additionalPath = key.split("/").pop();
            await findTomlFileRecursively(currentPath + "/" + additionalPath);
          }
        }
      };

      try {
        await findTomlFileRecursively("browser/arbitrum");
        set(
          produce((state: ProjectState) => {
            state.project.projects.loading = false;
          })
        );
      } catch (error) {
        set(
          produce((state: ProjectState) => {
            state.project.projects.loading = false;
            state.project.projects.error = true;
          })
        );
      }
    },
    setNetwork: (network) =>
      set(
        produce((state: ProjectState) => {
          state.project.network.data = network;
        })
      ),
  },
});
