import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";

import { useStore } from "../../zustand";
import { sendCustomEvent } from "../../utils/send-custom-event";
import { LoaderWrapper } from "../common/loader";
import { isEthAddress } from "../../utils/ethereum-chain";

interface ContractAddressProps {}
export const ContractAddress = ({}: ContractAddressProps) => {
  const { client, network, contractAddresses, setContractAddresses, fetchVerify, abi, setAbi, contractLoading } =
    useStore(
      useShallow((state) => ({
        client: state.global.client,
        network: state.account.network.data,
        compileLoading: state.compile.loading,
        deployLoading: state.deploy.loading,
        activateLoading: state.activate.loading,
        fetchVerify: state.verify.fetchVerify,
        abi: state.contract.abi,
        setAbi: state.contract.setAbi,
        address: state.contract.address,
        contractAddresses: state.contract.contractAddresses,
        setContractAddresses: state.contract.setContractAddresses,
        contractLoading: state.contract.loading,
      }))
    );
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setContractAddress(event.target.value);
    if (isEthAddress(event.target.value) && network) {
      fetchVerify({
        contractAddress: event.target.value,
        network,
      });
    }
  };

  const handleAtAddressOnClick = async () => {
    if (!client || !contractAddress) return;
    if (!isEthAddress(contractAddress)) {
      setErrorMsg("Invalid address. Please enter a valid Ethereum address.");
      return;
    }

    sendCustomEvent("at_address", {
      event_category: "arbitrum",
      method: "at_address",
    });
    const addressFiltered = contractAddresses.filter((addr) => addr !== contractAddress);
    setContractAddresses(addressFiltered);

    let targetAbi = abi.get(contractAddress);
    if (!targetAbi) {
      try {
        const abiStr = await client.fileManager.readFile("browser/arbitrum/abi.json");
        targetAbi = JSON.parse(abiStr);
        setAbi(contractAddress, targetAbi ?? { name: "", address: contractAddress, abi: [] });
      } catch (error) {
        setErrorMsg("ABI not found. Please make abi.json file in /arbitrum folder.");
      }
    }
  };

  useEffect(() => {
    setContractAddress(null);
    setErrorMsg(null);
  }, [contractAddresses]);

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
          <div className="flex items-center text-[#A2A3BD] ml-2 font-size-0.9em cursor-pointer">&#9432;</div>
        </OverlayTrigger>
      </InputGroup>
      {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
    </div>
  );
};
