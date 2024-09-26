import { StateCreator } from "zustand";
import { CompileState } from "./compile.types";

export const createCompileStore: StateCreator<CompileState> = (set) => ({
  projectFiles: [],
  timestamp: 0,
  setProjectFiles: (projectFiles: any) => set({ projectFiles }),
  setTimeStamp: (timestamp: number) => set({ timestamp }),
});
