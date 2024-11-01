import { Alert } from "react-bootstrap";
import { useShallow } from "zustand/react/shallow";

import { useStore } from "../../zustand";

interface ContractAlertProps {}
export const ContractAlert = ({}: ContractAlertProps) => {
  const { contractAddress } = useStore(
    useShallow((state) => ({
      contractAddress: state.contract.contractAddresses,
    }))
  );
  return (
    <Alert variant="warning" className="text-center" hidden={contractAddress?.length !== 0}>
      <small>Currently you have no contract instances to interact with.</small>
    </Alert>
  );
};
