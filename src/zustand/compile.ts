import { StateCreator } from "zustand";
import { CompileState } from "./compile.types";
import { produce } from "immer";

const initial = {
  loading: false,
  errorMsg: null,
  projectFiles: [],
  timestamp: 0,
};

export const createCompileStore: StateCreator<CompileState> = (set) => ({
  compile: {
    ...initial,
    setProjectFiles: (projectFiles: any) =>
      set(
        produce((state: CompileState) => {
          state.compile.projectFiles = projectFiles;
        })
      ),
    setTimestamp: (timestamp: number) =>
      set(
        produce((state: CompileState) => {
          state.compile.timestamp = timestamp;
        })
      ),
    setErrorMsg: (msg: string | null) =>
      set(
        produce((state: CompileState) => {
          state.compile.errorMsg = msg;
        })
      ),
    setLoading: (loading: boolean) =>
      set(
        produce((state: CompileState) => {
          state.compile.loading = loading;
        })
      ),
    reset: () =>
      set(
        produce((state: CompileState) => {
          state.compile = { ...state.compile, ...initial };
        })
      ),
  },
  // projectFiles: [],
  // timestamp: 0,
  // setProjectFiles: (projectFiles: any) => set({ projectFiles }),
  // setTimeStamp: (timestamp: number) => set({ timestamp }),
});
