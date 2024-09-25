import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "react-bootstrap";
import web3 from "web3";
import type { Client } from "@remixproject/plugin";
import type { Api } from "@remixproject/plugin-utils";
import type { IRemixApi } from "@remixproject/plugin-api";

import metamask from "../assets/metamask.png";
import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../const/network";
import { InfoType, initButtonStatus, StatusType } from "./Main";

interface RpcError extends Error {
  code: number;
  message: string;
}
const isRPCError = (error: any): error is RpcError => {
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
};

interface ConnectMetmaskProps {
  status: StatusType;
  setStatus: Dispatch<SetStateAction<StatusType>>;
  info: InfoType;
  setInfo: Dispatch<SetStateAction<InfoType>>;
  setAlert: Dispatch<SetStateAction<string | null>>;
}
export const ConnectMetmask = ({ status, setStatus, info, setInfo, setAlert }: ConnectMetmaskProps) => {
  const { ethereum } = window;

  const getAccount = async () => {
    try {
      const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        setAlert("No account found.");
        setStatus((prev) => ({ ...prev, metamask: initButtonStatus }));
        return null;
      }
      return accounts[0];
    } catch (error) {
      let message = "Failed to get account. Please try again later.";
      if (isRPCError(error)) {
        message = error.message;
      }
      setStatus((prev) => ({ ...prev, metamask: initButtonStatus }));
      setAlert(message);
      return null;
    }
  };

  const getBalance = async (address: string) => {
    try {
      const balance: string = await ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });
      const formattedBalance = web3.utils.fromWei(balance, "ether");
      return parseFloat(formattedBalance).toFixed(4);
    } catch (error) {
      let message = "Failed to get balance. Please try again later.";
      if (isRPCError(error)) {
        message = error.message;
      }
      setStatus((prev) => ({ ...prev, metamask: initButtonStatus }));
      setAlert(message);
      return null;
    }
  };

  const getChainId = async () => {
    try {
      const chainId: string = await ethereum.request({ method: "eth_chainId" });
      return chainId;
    } catch (error) {
      let message = "Failed to get chain ID. Please try again later.";
      if (isRPCError(error)) {
        message = error.message;
      }
      setStatus((prev) => ({ ...prev, metamask: initButtonStatus }));
      setAlert(message);
      return null;
    }
  };

  const connectMetamask = async () => {
    const currentChainId = await getChainId();
    if (!currentChainId) return;
    const isValidNetwork = ARBITRUM_NETWORK.find((item) => item.chainId === currentChainId);
    let network = info?.network ? info.network : isValidNetwork ? currentChainId : ARBITRUM_ONE.chainId;
    if (currentChainId !== network) await switchNetwork(network);

    const account = await getAccount();
    if (!account) return;
    const balance = await getBalance(account);
    if (!balance) return;

    setInfo((prev) => {
      if (prev) return { ...prev, account, balance, network };
      return { account, balance, network };
    });
  };

  const switchNetwork = async (chainId: string = ARBITRUM_ONE.chainId) => {
    const targetNetwork = ARBITRUM_NETWORK.find((network) => network.chainId === chainId);
    if (!targetNetwork) {
      setAlert("Invalid chain ID. Please provide a valid chain ID.");
      return;
    }
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainId }],
      });
    } catch (error) {
      let message = "Failed to switch network. Please try again.";
      if (isRPCError(error)) {
        message = error.message;
      }

      if (typeof error === "object" && error !== null && "code" in error) {
        if (error.code === 4902) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [targetNetwork],
            });
          } catch (error) {
            let message = "Failed to switch network. Please try again.";
            if (isRPCError(error)) {
              message = error.message;
            }
            setAlert(message);
          }
        } else {
          setAlert(message);
        }
      }
    }
  };

  const switchAccount = async (account: string) => {
    const currentChainId = await getChainId();
    const isValidNetwork = ARBITRUM_NETWORK.find((item) => item.chainId === currentChainId);
    if (!isValidNetwork) {
      setInfo(null);
      return;
    }

    const balance = await getBalance(account);
    if (!balance) return;

    setInfo((prev) => {
      if (prev) return { ...prev, account, balance };
      return { account, balance, network: ARBITRUM_ONE.chainId };
    });
  };

  const switchChainId = async (chainId: string) => {
    const isValidNetwork = ARBITRUM_NETWORK.find((item) => item.chainId === chainId);
    if (!isValidNetwork) {
      setInfo(null);
      return;
    }

    const account = await getAccount();
    if (!account) return;
    const balance = await getBalance(account);
    if (!balance) return;

    setInfo((prev) => {
      if (prev) return { ...prev, account, balance, network: chainId };
      return { account, balance, network: chainId };
    });
  };

  useEffect(() => {
    if (!ethereum) return;
    ethereum.on("accountsChanged", async (accounts: string[]) => {
      console.log("accountsChanged", accounts);
      // FIXME: 추후 compile, deploy등 버튼도 통제해야 함
      switchAccount(accounts[0]);
    });
    ethereum.on("chainChanged", async (chainId: string) => {
      console.log("chainChanged", chainId);
      // FIXME: 추후 compile, deploy등 버튼도 통제해야 함
      switchChainId(chainId);
    });

    return () => {
      ethereum.removeAllListeners("accountsChanged");
      ethereum.removeAllListeners("chainChanged");
    };
  }, []);

  return (
    <div className="mb-2 flex flex-col gap-2">
      <Button
        className={`px-[1.25rem] py-[0.75rem] w-full flex justify-center items-center ${
          status.metamask.active ? "bg-metamask-active" : "bg-metamask-default"
        } border-0 rounded-sm`}
        disabled={status.metamask.disabled}
        onClick={async () => {
          if (!ethereum || !ethereum.isMetaMask) {
            setAlert("MetaMask is not installed. Please install MetaMask to continue.");
            setStatus((prev) => ({ ...prev, metamask: initButtonStatus }));
            return;
          } else {
            await connectMetamask();
            setStatus((prev) => ({ ...prev, metamask: { ...initButtonStatus, active: true } }));
          }
        }}
      >
        <img className="w-[25px] mr-[10px]" src={metamask} alt="metamask" />
        <b>Connect to MetaMask</b>
      </Button>
    </div>
  );
};
