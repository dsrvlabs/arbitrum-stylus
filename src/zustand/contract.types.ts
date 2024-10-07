import { AbiFragment } from "web3";

export interface ContractState {
  contract: {
    loading: boolean;
    errorMsg: string | null;
    address: string | null;
    contractAddresses: string[];
    abi: AbiType;
    gasFee: string | null;
    setContractAddresses: (address: string[]) => void;
    setAddress: (address: string | null) => void;
    setGasFee: (gasFee: string) => void;
    setAbi: (address: string, abi: AbiValueType) => void;
    setErrorMsg: (msg: string | null) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
  };
}

export type AbiType = Map<string, AbiValueType>;

export type AbiValueType = {
  name: string;
  address: string;
  abi: AbiFragment[];
};
