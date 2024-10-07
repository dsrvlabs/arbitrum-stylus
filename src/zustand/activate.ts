import { produce } from "immer";

import type { StateCreator } from "zustand";
import type { ActivateState } from "./activate.types";

const initial = {
  ready: false,
  loading: false,
  errorMsg: null,
  activated: false,
};

export const createActivateStore: StateCreator<ActivateState> = (set, get) => ({
  activate: {
    ...initial,
    setActivated: (activated: boolean) =>
      set(
        produce((state: ActivateState) => {
          state.activate.activated = activated;
        })
      ),
    setReady: (ready: boolean) =>
      set(
        produce((state: ActivateState) => {
          state.activate.ready = ready;
        })
      ),
    setLoading: (loading: boolean) =>
      set(
        produce((state: ActivateState) => {
          state.activate.loading = loading;
        })
      ),
    setErrorMsg: (msg: string | null) =>
      set(
        produce((state: ActivateState) => {
          state.activate.errorMsg = msg;
        })
      ),
    reset: () =>
      set(
        produce((state: ActivateState) => {
          state.activate = { ...state.activate, ...initial };
        })
      ),
  },
});
