import { produce } from "immer";
import { StateCreator } from "zustand";

import { ARBITRUM_NETWORK } from "../const/network";

import type { VerifyState } from "./verify.types";
import type { ArbitrumVerifyContractDto } from "../components/interaction/deploy";
import axios from "axios";
import { COMPILER_API_ENDPOINT } from "../const/endpoint";
import { ProjectState } from "./project.types";

const initial = {
  loading: false,
  errorMsg: null,
  verify: null,
};

export const createVerifyStore: StateCreator<VerifyState & ProjectState, [], [], VerifyState> = (set, get) => ({
  verify: {
    ...initial,
    fetchVerify: async ({ network, contractAddress, srcFileId, cliVersion }: ArbitrumVerifyContractDto) => {
      const targetNetwork = ARBITRUM_NETWORK.find((item) => item.chainId === network);
      if (!targetNetwork) return;

      const os = get().project.os.data;
      set(
        produce((state: VerifyState) => {
          state.verify.loading = true;
        })
      );

      try {
        const response = await axios.post(COMPILER_API_ENDPOINT(os) + "/arbitrum/verifications", {
          network: targetNetwork.network,
          contractAddress,
          srcFileId,
          cliVersion,
        });
        if (response.data) {
          set(
            produce((state: VerifyState) => {
              state.verify.loading = false;
              state.verify.verify = response.data;
            })
          );
        }
      } catch (error) {
        set(
          produce((state: VerifyState) => {
            state.verify.loading = false;
            if (error instanceof Error) {
              state.verify.errorMsg = error.message;
            }
          })
        );
      }
    },
  },
});
