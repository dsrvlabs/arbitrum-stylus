import type { MetaMaskInpageProvider } from "@metamask/providers";
import { DataType } from "./global.types";

export interface AccountState {
  account: {
    address: DataType<string>;
    network: DataType<string>;
    balance: DataType<number>;
    provider: DataType<MetaMaskInpageProvider>;
    fetchAddress: () => Promise<void>;
    fetchBalance: () => Promise<void>;
    fetchNetwork: () => Promise<void>;
    setNetwork: (network: string) => void;
    setProvider: (provider: MetaMaskInpageProvider) => void;
    reset: () => void;
  };
}

export interface RpcError extends Error {
  code: number;
  message: string;
}
