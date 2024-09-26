import web3 from "web3";
import type { StateCreator } from "zustand";
import { produce } from "immer";

import type { AccountState, RpcError } from "./account.types";

const initial = {
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
            state.account.address.error = true;
          })
        );
        return;
      }
      try {
        const account = await provider.request<string[]>({ method: "eth_requestAccounts" });
        if (!account || account.length === 0) {
          // set((state) => ({ account: { ...state.account, address: { ...state.account.address, error: true, errorMsg: 'No account found.' } } }));
          set(
            produce((state: AccountState) => {
              state.account.address.error = true;
              state.account.address.errorMsg = "No account found.";
            })
          );
          return;
        }
        set((state) => ({
          account: { ...state.account, address: { ...state.account.address, data: account[0] ?? "" } },
        }));
      } catch (error) {
        set(
          produce((state: AccountState) => {
            state.account.address.error = true;
            if (isRPCError(error)) state.account.address.errorMsg = error.message;
          })
        );
      } finally {
        set(
          produce((state: AccountState) => {
            state.account.address.loading = false;
          })
        );
      }
    },
    fetchBalance: async () => {
      set(
        produce((state: AccountState) => {
          state.account.balance.loading = true;
        })
      );
      const provider = get().account.provider.data;
      if (!provider) {
        set(
          produce((state: AccountState) => {
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
              state.account.balance.error = true;
              state.account.balance.errorMsg = "Failed to get balance.";
            })
          );
          return;
        }
        const formattedBalance = parseFloat(web3.utils.fromWei(balance, "ether")).toFixed(4);
        set(
          produce((state: AccountState) => {
            state.account.balance.data = parseFloat(formattedBalance);
          })
        );
      } catch (error) {
        set(
          produce((state: AccountState) => {
            state.account.balance.error = true;
            if (isRPCError(error)) state.account.balance.errorMsg = error.message;
          })
        );
      } finally {
        set(
          produce((state: AccountState) => {
            state.account.balance.loading = false;
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
              state.account.network.error = true;
              state.account.network.errorMsg = "Failed to get network.";
            })
          );
          return;
        }
        set(
          produce((state: AccountState) => {
            state.account.network.data = network;
          })
        );
      } catch (error) {
        set(
          produce((state: AccountState) => {
            state.account.network.error = true;
            if (isRPCError(error)) state.account.network.errorMsg = error.message;
          })
        );
      } finally {
        set(
          produce((state: AccountState) => {
            state.account.network.loading = false;
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
    reset: () =>
      set(
        produce((state: AccountState) => {
          state.account = { ...initial, ...state.account };
        })
      ),
  },
});

const isRPCError = (error: any): error is RpcError => {
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
};
