import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../const/network";
import type { DataType, NonNullableDataType } from "./global.types";

export interface ProjectState {
  project: {
    errorMsg: string | null;
    name: DataType<string>;
    templates: DataType<string[]>;
    template: DataType<string>;
    project: DataType<string>;
    projects: DataType<string[]>;
    networks: NonNullableDataType<typeof ARBITRUM_NETWORK>;
    network: NonNullableDataType<typeof ARBITRUM_ONE>;
    compilerVersion: NonNullableDataType<string>;
    compilerVersions: NonNullableDataType<string[]>;
    upload: NonNullableDataType<boolean>;
    setErrorMsg: (msg: string | null) => void;
    setName: (name: string) => void;
    setTemplate: (template: string) => void;
    // setProjects: (projects: string[]) => void;
    fetchProjects: () => Promise<void>;
    setProject: (project: string) => void;
    setNetwork: (network: typeof ARBITRUM_ONE) => void;
    setCompilerVersion: (compilerVersion: string) => void;
    setUpload: (upload: boolean) => void;
    reset: () => void;
  };
}
