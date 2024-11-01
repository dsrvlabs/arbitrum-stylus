import web3 from "web3";
import { produce } from "immer";
import type { StateCreator } from "zustand";

import type { AccountState, RpcError } from "./account.types";

const initial = {
  loading: false,
  errorMsg: null,
  address: {
    loading: false,
    error: false,
    data: null,
  },
  network: {
    loading: false,
    error: false,
    data: null,
  },
  balance: {
    loading: false,
    error: false,
    data: null,
  },
  provider: {
    loading: false,
    error: false,
    data: window.ethereum ?? null,
  },
};

export const createAccountStore: StateCreator<AccountState> = (set, get) => ({
  account: {
    ...initial,
    setErrorMsg: (msg: string | null) =>
      set(
        produce((state: AccountState) => {
          state.account.errorMsg = msg;
        })
      ),
    fetchAddress: async () => {
      set(
        produce((state: AccountState) => {
          state.account.address.loading = true;
        })
      );
      const provider = get().account.provider.data;
      if (!provider) {
        set(
          produce((state: AccountState) => {
            state.account.address.loading = false;
            state.account.address.error = true;
          })
        );
        return;
      }
      try {
        const account = await provider.request<string[]>({ method: "eth_requestAccounts" });
        if (!account || account.length === 0) {
          set(
            produce((state: AccountState) => {
              state.account.address.loading = false;
              state.account.address.error = true;
              state.account.address.errorMsg = "No account found.";
            })
          );
          return;
        }
        set(
          produce((state: AccountState) => {
            state.account.address.loading = false;
            state.account.address.data = account[0] ?? "";
          })
        );
      } catch (error) {
        set(
          produce((state: AccountState) => {
            state.account.address.loading = false;
            state.account.address.error = true;
            if (isRPCError(error)) state.account.address.errorMsg = error.message;
          })
        );
      }
    },
    fetchBalance: async () => {
      set(
        produce((state: AccountState) => {
          state.account.balance.loading = false;
          state.account.balance.loading = true;
        })
      );
      const provider = get().account.provider.data;
      if (!provider) {
        set(
          produce((state: AccountState) => {
            state.account.balance.loading = false;
            state.account.provider.error = true;
          })
        );
        return;
      }
      try {
        const balance = await provider.request<string>({
          method: "eth_getBalance",
          params: [get().account.address.data, "latest"],
        });
        if (!balance) {
          set(
            produce((state: AccountState) => {
              state.account.balance.loading = false;
              state.account.balance.error = true;
              state.account.balance.errorMsg = "Failed to get balance.";
            })
          );
          return;
        }
        const formattedBalance = parseFloat(web3.utils.fromWei(balance, "ether")).toFixed(4);
        set(
          produce((state: AccountState) => {
            state.account.balance.loading = false;
            state.account.balance.data = parseFloat(formattedBalance);
          })
        );
      } catch (error) {
        set(
          produce((state: AccountState) => {
            state.account.balance.loading = false;
            state.account.balance.error = true;
            if (isRPCError(error)) state.account.balance.errorMsg = error.message;
          })
        );
      }
    },
    fetchNetwork: async () => {
      set(
        produce((state: AccountState) => {
          state.account.network.loading = true;
        })
      );
      const provider = get().account.provider.data;
      if (!provider) {
        set(
          produce((state: AccountState) => {
            state.account.network.loading = false;
            state.account.provider.error = true;
          })
        );
        return;
      }
      try {
        const network = await provider.request<string>({ method: "eth_chainId" });
        if (!network) {
          set(
            produce((state: AccountState) => {
              state.account.network.loading = false;
              state.account.network.error = true;
              state.account.network.errorMsg = "Failed to get network.";
            })
          );
          return;
        }
        set(
          produce((state: AccountState) => {
            state.account.network.loading = false;
            state.account.network.data = network;
          })
        );
        return network;
      } catch (error) {
        set(
          produce((state: AccountState) => {
            state.account.network.loading = false;
            state.account.network.error = true;
            if (isRPCError(error)) state.account.errorMsg = error.message;
          })
        );
      }
    },
    setNetwork: (network: string) => {
      set(
        produce((state: AccountState) => {
          state.account.network.data = network;
        })
      );
    },
    setProvider: (provider) => {
      set(
        produce((state: AccountState) => {
          state.account.provider.data = provider;
        })
      );
    },
    setLoading: (loading: boolean) =>
      set(
        produce((state: AccountState) => {
          state.account.loading = loading;
        })
      ),
    reset: () =>
      set(
        produce((state: AccountState) => {
          state.account = { ...state.account, ...initial };
        })
      ),
  },
});

const isRPCError = (error: any): error is RpcError => {
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
};
