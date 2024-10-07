import type { MetaMaskInpageProvider } from "@metamask/providers";
import { DataType } from "./global.types";

export interface AccountState {
  account: {
    loading: boolean;
    errorMsg: string | null;
    address: DataType<string>;
    network: DataType<string>;
    balance: DataType<number>;
    provider: DataType<MetaMaskInpageProvider>;
    setErrorMsg: (msg: string | null) => void;
    fetchAddress: () => Promise<void>;
    fetchBalance: () => Promise<void>;
    fetchNetwork: () => Promise<void | string>;
    setNetwork: (network: string) => void;
    setProvider: (provider: MetaMaskInpageProvider) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
  };
}

export interface RpcError extends Error {
  code: number;
  message: string;
}
