import { StateCreator } from "zustand";
import { AbiValueType, ContractState } from "./contract.types";
import { produce } from "immer";

const initial = {
  loading: false,
  errorMsg: null,
  address: null,
  contractAddresses: [],
  gasFee: null,
  abi: new Map(),
};

export const createContractStore: StateCreator<ContractState> = (set, get) => ({
  contract: {
    ...initial,
    setGasFee: (gasFee: string) =>
      set(
        produce((state: ContractState) => {
          state.contract.gasFee = gasFee;
        })
      ),
    setAddress: (address: string | null) =>
      set(
        produce((state: ContractState) => {
          state.contract.address = address;
        })
      ),
    setContractAddresses: (contractAddresses: string[]) =>
      set(
        produce((state: ContractState) => {
          state.contract.contractAddresses = contractAddresses;
        })
      ),

    setAbi: (address: string, abi: AbiValueType) =>
      set(
        (state) => {
          const newAbi = new Map(state.contract.abi);
          newAbi.set(address, abi);
          return {
            ...state,
            contract: {
              ...state.contract,
              abi: newAbi,
            },
          };
        }
        // produce((state: ContractState) => {
        //   state.contract.abi.set(address, abi);
        // })
      ),
    setErrorMsg: (msg: string | null) =>
      set(
        produce((state: ContractState) => {
          state.contract.errorMsg = msg;
        })
      ),
    setLoading: (loading: boolean) =>
      set(
        produce((state: ContractState) => {
          state.contract.loading = loading;
        })
      ),
    reset: () =>
      set(
        produce((state: ContractState) => {
          state.contract = { ...state.contract, ...initial };
        })
      ),
  },
});
