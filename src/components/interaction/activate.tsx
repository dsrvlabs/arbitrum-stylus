import axios from "axios";
import { Web3 } from "web3";
import { useShallow } from "zustand/react/shallow";
import { Button } from "react-bootstrap";

import { LoaderWrapper } from "../common/loader";
import { useStore } from "../../zustand";
import { COMPILER_API_ENDPOINT } from "../../const/endpoint";
import { log } from "../../utils/logger";

const ACTIVATION_TO_ADDR = "0x0000000000000000000000000000000000000071";

interface ArbitrumContractUpdateDto {
  chainId: string;
  address: string;
  activationHash: string;
  activationTimestamp: number;
}

interface ActivateProps {}
export const Activate = ({}: ActivateProps) => {
  const {
    client,
    provider,
    network,
    account,
    compileLoading,
    deployLoading,
    setLoading,
    activateLoading,
    activated,
    setActivated,
    gasFee,
    abi,
    address,
    contractAddresses,
    setContractAddresses,
  } = useStore(
    useShallow((state) => ({
      client: state.global.client,
      provider: state.account.provider.data,
      network: state.account.network.data,
      account: state.account.address.data,
      compileLoading: state.compile.loading,
      deployLoading: state.deploy.loading,
      activateLoading: state.activate.loading,
      activated: state.activate.activated,
      setLoading: state.activate.setLoading,
      setActivated: state.activate.setActivated,
      gasFee: state.contract.gasFee,
      abi: state.contract.abi,
      address: state.contract.address,
      contractAddresses: state.contract.contractAddresses,
      setContractAddresses: state.contract.setContractAddresses,
    }))
  );
  const isLoading = compileLoading || deployLoading || activateLoading;

  const handleActivateOnClick = async () => {
    if (!provider || !address || !client || !network || !account) return;
    setLoading(true);

    const abiItems = abi.get(address);
    if (!abiItems) {
      setLoading(false);
      return;
    }

    let tx = "";
    try {
      const res = await axios.get(COMPILER_API_ENDPOINT + `/arbitrum/activation-tx?contractAddr=${address}`);
      tx = res.data?.tx;
      if (!tx) {
        await client.terminal.log({
          type: "info",
          value: `Failed to get activation tx for contract ${address}`,
        });
        setLoading(false);
        return;
      }
    } catch (e) {
      setLoading(false);
      return;
    }

    const web3 = new Web3(provider);
    let hash = "";
    try {
      hash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: ACTIVATION_TO_ADDR,
            data: tx,
            value: gasFee ?? "0x0",
          },
        ],
      });
    } catch (e) {
      setLoading(false);
      return;
    }

    // const activation_tx = await web3.eth.getTransaction(activation_hash);
    // client.terminal.log({
    //   type: "info",
    //   value: "========================= activation tx ===========================",
    // });
    // client.terminal.log({ type: "info", value: JSON.stringify(activation_tx, null, 2) });

    let txReceipt = await getTransactionReceipt(hash);
    if (!txReceipt) {
      client.terminal.log({
        type: "error",
        value: `Failed to get activation tx receipt for hash=${hash}`,
      });
      return;
    }

    if (txReceipt.status) {
      setActivated(true);
      // const contract = new web3.eth.Contract(abiItems.abi, address);
      // let name = "";
      // try {
      //   name = await contract.methods.name().call();
      // } catch (error) {
      //   console.error("Error interacting with contract:", error);
      // }
      setContractAddresses([...contractAddresses, address]);

      let activationTimestamp = 0;
      if (txReceipt.blockNumber) {
        const block = await web3.eth.getBlock(txReceipt.blockNumber);
        if (block) {
          activationTimestamp = Number(block.timestamp) * 1000;
        }
      }

      const arbitrumContractUpdateDto: ArbitrumContractUpdateDto = {
        chainId: network,
        address: account,
        activationHash: hash,
        activationTimestamp: activationTimestamp || 0,
      };
      log.info("arbitrumContractUpdateDto", arbitrumContractUpdateDto);
      try {
        const res = await axios.put(COMPILER_API_ENDPOINT + "/arbitrum/contracts", arbitrumContractUpdateDto);
        log.info(`put arbitrum/contracts api res`, res);
      } catch (e) {
        log.error(`put arbitrum/contracts api error`);
        console.error(e);
      }
    }

    client.terminal.log({
      type: "info",
      value: "====================== activation tx receipt ======================",
    });
    client.terminal.log({
      type: "info",
      value: JSON.stringify(txReceipt, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2),
    });
    setLoading(false);
  };

  const getTransactionReceipt = async (
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
        onClick={handleActivateOnClick}
        disabled={activated || isLoading}
        className="px-[1.25rem] py-[0.75rem] w-full relative flex justify-center items-center bg-metamask-active border-0 rounded-sm"
      >
        <span>Activate</span>
        <LoaderWrapper loading={isLoading} />
      </Button>
    </div>
  );
};
