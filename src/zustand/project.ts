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
    data: "erc20",
  },
  templates: {
    loading: false,
    error: false,
    data: ["hello-world", "single_call", "vending_machine"],
  },
  openzeppelinTemplates: {
    loading: false,
    error: false,
    data: [
      "erc4626",
      "safe-erc20",
      "erc721",
      "erc1155",
      "erc20",
      "erc1155-supply",
      "vesting-wallet",
      "erc20-flash-mint",
      "erc721-wrapper",
      "erc20-wrapper",
      "access-control",
      "ownable-two-step",
      "erc721-metadata",
      "erc721-consecutive",
      "erc20-permit",
      "ownable",
      "ecdsa",
      "poseidon",
      "erc1155-metadata-uri",
      "pedersen",
      "merkle-proofs",
    ],
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
  compilerVersion: {
    loading: false,
    error: false,
    data: "0.5.12",
  },
  compilerVersions: {
    loading: false,
    error: false,
    data: ["0.5.1", "0.5.2", "0.5.3", "0.5.4", "0.5.5", "0.5.6", "0.5.7", "0.5.8", "0.5.10", "0.5.11", "0.5.12"],
  },
  os: {
    loading: false,
    error: false,
    data: "linux",
  },
  oses: {
    loading: false,
    error: false,
    data: ["linux", "darwin"],
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
  upload: {
    loading: false,
    error: false,
    data: true,
  },
};

export const createProjectStore: StateCreator<ProjectState & GlobalState, [], [], ProjectState> = (set, get) => ({
  project: {
    ...initial,
    setErrorMsg: (msg: string | null) =>
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
    setCompilerVersion: (compilerVersion: string) =>
      set(
        produce((state: ProjectState) => {
          state.project.compilerVersion.data = compilerVersion;
        })
      ),
    setOs: (os: string) =>
      set(
        produce((state: ProjectState) => {
          state.project.os.data = os;
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

      const projects: string[] = [];
      const findTomlFileRecursively = async (currentPath: string): Promise<void> => {
        const list = await client.fileManager.readdir(currentPath);
        const hasTomlFile = Object.keys(list).some((item) => item.endsWith("Cargo.toml"));
        if (hasTomlFile) {
          set(
            produce((state: ProjectState) => {
              const targetProject = projects.find((item) => item === currentPath.replace("browser/", ""));
              if (!targetProject) projects.push(currentPath.replace("browser/", ""));
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
        const project = get().project.template.data ? `arbitrum/${get().project.template.data}` : projects[0];
        set(
          produce((state: ProjectState) => {
            state.project.projects.loading = false;
            state.project.projects.data = projects;
            state.project.project.data = project;
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
    setUpload: (upload) =>
      set(
        produce((state: ProjectState) => {
          state.project.upload.data = upload;
        })
      ),
    reset: () =>
      set(
        produce((state: ProjectState) => {
          state.project = { ...state.project, ...initial };
        })
      ),
  },
});
