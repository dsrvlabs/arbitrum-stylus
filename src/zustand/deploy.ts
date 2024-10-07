import { produce } from "immer";

import type { StateCreator } from "zustand";
import type { DeployState } from "./deploy.types";

const initial = {
  ready: false,
  loading: false,
  errorMsg: null,
  transactionData: {
    data: null,
    loading: false,
    error: false,
  },
};

export const createDeployStore: StateCreator<DeployState> = (set, get) => ({
  deploy: {
    ...initial,
    setTransactionData: (transactionData: string) =>
      set(
        produce((state: DeployState) => {
          state.deploy.transactionData.data = transactionData;
        })
      ),
    setReady: (ready: boolean) =>
      set(
        produce((state: DeployState) => {
          state.deploy.ready = ready;
        })
      ),
    setLoading: (loading: boolean) =>
      set(
        produce((state: DeployState) => {
          state.deploy.loading = loading;
        })
      ),
    setErrorMsg: (msg: string | null) =>
      set(
        produce((state: DeployState) => {
          state.deploy.errorMsg = msg;
        })
      ),
    reset: () =>
      set(
        produce((state: DeployState) => {
          state.deploy = { ...state.deploy, ...initial };
        })
      ),
  },
});
