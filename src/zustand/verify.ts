import { produce } from "immer";
import { StateCreator } from "zustand";
import axios from "axios";

import { ARBITRUM_NETWORK } from "../const/network";
import { COMPILER_API_ENDPOINT } from "../const/endpoint";
import { ProjectState } from "./project.types";

import type { ArbitrumVerifyContractDto, ArbitrumVerifyStatusDto, VerifyState } from "./verify.types";

const initial = {
  loading: false,
  errorMsg: null,
  verified: null,
  address: null,
};

let fetchVerifyController: AbortController | null = null;
let requestVerifyController: AbortController | null = null;

export const createVerifyStore: StateCreator<VerifyState & ProjectState, [], [], VerifyState> = (set, get) => ({
  verify: {
    ...initial,
    fetchVerify: async ({ network, contractAddress }: ArbitrumVerifyStatusDto) => {
      const targetNetwork = ARBITRUM_NETWORK.find((item) => item.chainId === network);
      if (!targetNetwork) return;

      if (fetchVerifyController) {
        fetchVerifyController.abort();
      }

      fetchVerifyController = new AbortController();

      set(
        produce((state: VerifyState) => {
          state.verify.loading = true;
          state.verify.verified = false;
          state.verify.errorMsg = null;
          state.verify.address = contractAddress;
        })
      );

      try {
        const response = await axios.get(
          COMPILER_API_ENDPOINT(get().project.os.data) +
            `/arbitrum/verifications?network=${targetNetwork.network}&contractAddress=${contractAddress}`
        );
        if (response.data && response.data.verifiedSrcUrl) {
          set(
            produce((state: VerifyState) => {
              state.verify.loading = false;
              state.verify.verified = true;
            })
          );
        } else {
          set(
            produce((state: VerifyState) => {
              state.verify.loading = false;
              state.verify.verified = false;
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
    requestVerify: async ({ network, contractAddress, srcFileId, cliVersion }: ArbitrumVerifyContractDto) => {
      const targetNetwork = ARBITRUM_NETWORK.find((item) => item.chainId === network);
      if (!targetNetwork) return;

      if (requestVerifyController) {
        requestVerifyController.abort();
      }
      requestVerifyController = new AbortController();

      const os = get().project.os.data;
      set(
        produce((state: VerifyState) => {
          state.verify.loading = true;
          state.verify.verified = false;
          state.verify.errorMsg = null;
          state.verify.address = contractAddress;
        })
      );

      try {
        const response = await axios.post(COMPILER_API_ENDPOINT(os) + "/arbitrum/verifications", {
          network: targetNetwork.network,
          contractAddress,
          srcFileId,
          cliVersion,
        });
        if (response.data && response.data.verifiedSrcUrl) {
          set(
            produce((state: VerifyState) => {
              state.verify.loading = false;
              state.verify.verified = true;
            })
          );
        } else {
          set(
            produce((state: VerifyState) => {
              state.verify.loading = false;
              state.verify.verified = false;
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
    reset: () => {
      set(
        produce((state: VerifyState) => {
          state.verify = { ...state.verify, ...initial };
        })
      );
    },
  },
});
