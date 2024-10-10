import { StateCreator } from "zustand";
import { CompileState } from "./compile.types";
import { produce } from "immer";

const initial = {
  fileName: null,
  timestamp: null,
  loading: false,
  errorMsg: null,
};

export const createCompileStore: StateCreator<CompileState> = (set) => ({
  compile: {
    ...initial,
    setFileName: (fileName: string | null) =>
      set(
        produce((state: CompileState) => {
          state.compile.fileName = fileName;
        })
      ),
    setTimestamp: (timestamp: number | null) =>
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
