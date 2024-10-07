import { useShallow } from "zustand/react/shallow";

import { AbiExecuter } from "./abi-executer";
import { ContractAddress } from "./contract-address";
import { ContractAlert } from "./contract-alert";
import { useStore } from "../../zustand";

interface ContractProps {}
export const Contracts = ({}: ContractProps) => {
  const { contractAddress } = useStore(
    useShallow((state) => ({
      contractAddress: state.contract.contractAddresses,
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <ContractAddress />
      <AbiExecuter />
      {contractAddress.length === 0 ? <ContractAlert /> : null}
    </div>
  );
};
