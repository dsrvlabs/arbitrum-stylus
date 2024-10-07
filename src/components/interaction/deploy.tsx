import { useState } from "react";
import axios from "axios";
import { type AbiItem, Web3 } from "web3";
import { Button } from "react-bootstrap";
import { useShallow } from "zustand/react/shallow";

import { ArbitrumContractCreateDto } from "../ProjectInfo";
import { LoaderWrapper } from "../common/loader";
import { useStore } from "../../zustand";
import { COMPILER_API_ENDPOINT } from "../../const/endpoint";
import { log } from "../../utils/logger";

interface DeployProps {}
export const Deploy = ({}: DeployProps) => {
  const {
    client,
    provider,
    network,
    account,
    project,
    upload,
    compileLoading,
    timestamp,
    transactionData,
    deployLoading,
    setLoading,
    setErrorMsg,
    activateLoading,
    activated,
    activatedReady,
    setAbi,
    address,
    setAddress,
    contractAddresses,
    setContractAddresses,
  } = useStore(
    useShallow((state) => ({
      client: state.global.client,
      provider: state.account.provider.data,
      network: state.account.network.data,
      account: state.account.address.data,
      project: state.project.project.data,
      upload: state.project.upload.data,
      compileLoading: state.compile.loading,
      timestamp: state.compile.timestamp,
      transactionData: state.deploy.transactionData.data,
      deployLoading: state.deploy.loading,
      setLoading: state.deploy.setLoading,
      setErrorMsg: state.deploy.setErrorMsg,
      activateLoading: state.activate.loading,
      activated: state.activate.activated,
      activatedReady: state.activate.ready,
      setAbi: state.contract.setAbi,
      address: state.contract.address,
      setAddress: state.contract.setAddress,
      contractAddresses: state.contract.contractAddresses,
      setContractAddresses: state.contract.setContractAddresses,
    }))
  );
  const isLoading = compileLoading || deployLoading || activateLoading;

  const handleDeployOnClick = async () => {
    if (!client || !provider || !account || !network) return;
    const web3 = new Web3(provider);

    if (isLoading) {
      client.terminal.log({ value: "Server is working...", type: "log" });
      return;
    }
    if (transactionData === "") {
      client.terminal.log({ type: "error", value: `No deployment tx data` });
      return;
    }
    setLoading(true);

    console.log({
      from: account,
      data: transactionData,
    });
    let hash;
    try {
      hash = await provider.request<string>({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            data: transactionData,
          },
        ],
      });
    } catch (e) {
      setLoading(false);
      setErrorMsg("Failed to deploy contract");
      return;
    }
    if (!hash) {
      setLoading(false);
      return;
    }

    let txReceipt = await getReceiptRecursively(hash);
    if (!txReceipt) {
      setLoading(false);
      client.terminal.log({
        type: "error",
        value: `Failed to get deployment tx receipt for hash=${hash}`,
      });
      return;
    }

    setAddress(txReceipt.contractAddress || "");

    if (txReceipt.contractAddress && txReceipt.status) {
      const abiStr = await client?.fileManager.readFile("browser/" + project + "/output/abi.json");
      const abiItems = JSON.parse(abiStr) as AbiItem[];

      const contract = new web3.eth.Contract(abiItems, txReceipt.contractAddress);
      let name = "";
      try {
        name = await contract.methods.name().call();
      } catch (error) {
      } finally {
        setAbi(txReceipt.contractAddress, {
          name: name || "",
          address: txReceipt.contractAddress,
          abi: abiItems,
        });
      }

      let deploymentTimeStamp = 0;
      if (txReceipt.blockNumber) {
        const block = await web3.eth.getBlock(txReceipt.blockNumber);
        if (block) {
          deploymentTimeStamp = Number(block.timestamp) * 1000;
        }
      }

      const arbitrumContractCreateDto: ArbitrumContractCreateDto = {
        chainId: network,
        account: account,
        address: txReceipt.contractAddress,
        compileTimestamp: Number(timestamp),
        deployTimestamp: deploymentTimeStamp || 0,
        txHash: hash,
        isSrcUploaded: upload,
        status: txReceipt.status ? "true" : "false",
        cliVersion: null, // todo
      };
      log.info("arbitrumContractCreateDto", arbitrumContractCreateDto);
      try {
        const res = await axios.post(COMPILER_API_ENDPOINT + "/arbitrum/contracts", arbitrumContractCreateDto);
        log.info(`put arbitrum/contracts api res`, res);
      } catch (e) {
        log.error(`put arbitrum/contracts api error`);
        console.error(e);
      }

      if (activated || !activatedReady) {
        setContractAddresses([...contractAddresses, txReceipt.contractAddress]);
      }
    }
    client.terminal.log({
      type: "info",
      value: "====================== deployment tx receipt ======================",
    });
    client.terminal.log({
      type: "info",
      value: JSON.stringify(txReceipt, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2),
    });
    setLoading(false);
  };

  const getReceiptRecursively = async (
    hash: string
  ): Promise<ReturnType<typeof web3.eth.getTransactionReceipt> | null> => {
    if (!provider) return null;
    const web3 = new Web3(provider);

    const getTransactionReceipt = async (hash: string) => {
      try {
        const txReceipt = await web3.eth.getTransactionReceipt(hash);
        return txReceipt;
      } catch (error) {
        return null;
      }
    };
    let txReceipt = await getTransactionReceipt(hash);

    return new Promise((resolve, reject) => {
      let MAX_RETRY = 3;
      const interval = setInterval(async () => {
        if (!txReceipt && MAX_RETRY > 0) {
          txReceipt = await getTransactionReceipt(hash);
          MAX_RETRY--;
        } else {
          clearInterval(interval);
          resolve(txReceipt);
        }
      }, 2_000);
    });
  };

  return (
    <div>
      <Button
        variant="primary"
        disabled={isLoading}
        onClick={handleDeployOnClick}
        className="px-[1.25rem] py-[0.75rem] w-full relative flex justify-center items-center bg-metamask-active border-0 rounded-sm"
      >
        {/* <FaSyncAlt className={`mr-2 ${deployLoading ? "animate-spin" : undefined}`} /> */}
        <span>Deploy</span>
        <LoaderWrapper loading={isLoading} />
      </Button>
      {address && <small>{address}</small>}
    </div>
  );
};
