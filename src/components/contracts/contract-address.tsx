import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../zustand";
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { sendCustomEvent } from "../../utils/sendCustomEvent";
import { useState } from "react";
import { LoaderWrapper } from "../common/loader";

interface ContractAddressProps {}
export const ContractAddress = ({}: ContractAddressProps) => {
  const { client, contractAddresses, setContractAddresses, abi, setAbi, contractLoading } = useStore(
    useShallow((state) => ({
      client: state.global.client,
      address: state.contract.address,
      compileLoading: state.compile.loading,
      deployLoading: state.deploy.loading,
      activateLoading: state.activate.loading,
      abi: state.contract.abi,
      setAbi: state.contract.setAbi,
      contractAddresses: state.contract.contractAddresses,
      setContractAddresses: state.contract.setContractAddresses,
      contractLoading: state.contract.loading,
    }))
  );
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(event.target.value);
  };

  const handleAtAddressOnClick = async () => {
    if (!client || !contractAddress) return;
    sendCustomEvent("at_address", {
      event_category: "arbitrum",
      method: "at_address",
    });
    const addressFiltered = contractAddresses.filter((addr) => addr !== contractAddress);
    setContractAddresses(addressFiltered);

    let targetAbi = abi.get(contractAddress);
    if (!targetAbi) {
      const abiStr = await client.fileManager.readFile("browser/arbitrum/abi.json");
      targetAbi = JSON.parse(abiStr);
      setAbi(contractAddress, targetAbi ?? { name: "", address: contractAddress, abi: [] });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center">
        <small>OR</small>
      </p>
      <InputGroup className="flex">
        <Form.Control
          value={contractAddress ?? ""}
          placeholder="contract address"
          onChange={handleAddressChange}
          size="sm"
        />
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id="overlay-ataddresss">Use deployed Contract address</Tooltip>}
        >
          <Button
            className="relative border-0"
            variant="primary"
            size="sm"
            disabled={contractLoading}
            onClick={handleAtAddressOnClick}
          >
            <small>At Address</small>
            <LoaderWrapper loading={contractLoading} />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id="overlay-ataddresss">
              <span>Please specify ABI in </span>
              <span className="font-bold">/arbitrum/abi.json</span>
            </Tooltip>
          }
        >
          <div className="flex items-center bg-transparent border-0 text-white ml-2 font-size-0.9em cursor-pointer">
            &#9432;
          </div>
        </OverlayTrigger>
      </InputGroup>
    </div>
  );
};
