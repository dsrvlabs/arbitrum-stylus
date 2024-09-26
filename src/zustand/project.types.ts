import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../const/network";
import { DataType } from "./global.types";

export interface ProjectState {
  project: {
    name: DataType<string>;
    templates: DataType<string[]>;
    template: DataType<string>;
    projects: DataType<string[]>;
    project: DataType<string>;
    networks: DataType<typeof ARBITRUM_NETWORK>;
    network: DataType<typeof ARBITRUM_ONE>;
    setName: (name: string) => void;
    setTemplate: (template: string) => void;
    setProjects: (projects: string[]) => void;
    setProject: (project: string) => void;
    setNetwork: (network: typeof ARBITRUM_ONE) => void;
  };
}
