import { useState, type Dispatch, type SetStateAction } from "react";
import { Alert, Button } from "react-bootstrap";
import web3 from "web3";
import type { Client } from "@remixproject/plugin";
import type { Api } from "@remixproject/plugin-utils";
import type { IRemixApi } from "@remixproject/plugin-api";

import metamask from "../assets/metamask.png";
import AlertCloseButton from "./AlertCloseButton";
import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../const/network";
import { InfoType, StatusType } from "./Main";

interface RpcError extends Error {
  code: number;
  message: string;
}
const isRPCError = (error: any): error is RpcError => {
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
};

interface ConnectMetmaskProps {
  client: Client<Api, Readonly<IRemixApi>>;
  status: StatusType;
  setStatus: Dispatch<SetStateAction<StatusType>>;
  setInfo: Dispatch<SetStateAction<InfoType>>;
}
export const ConnectMetmask = ({ client, status, setInfo, setStatus }: ConnectMetmaskProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { ethereum } = window;

  const getAccount = async () => {
    try {
      const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length === 0) {
        setStatus((prev) => {
          if (prev) return { ...prev, button: false, error: "No account found." };
          return { button: false, error: "No account found." };
        });
        return null;
      }
      return accounts[0];
    } catch (error) {
      let message = "Failed to get account. Please try again later.";
      if (isRPCError(error)) {
        message = error.message;
      }
      setStatus((prev) => {
        if (prev) return { ...prev, button: false, error: message };
        return { button: false, error: message };
      });
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
      setStatus((prev) => {
        if (prev) return { ...prev, button: false, error: message };
        return { button: false, error: message };
      });
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
      setStatus((prev) => {
        if (prev) return { ...prev, button: false, error: message };
        return { button: false, error: message };
      });
      return null;
    }
  };

  const connectMetamask = async () => {
    const currentChainId = await getChainId();
    if (!currentChainId) return;
    let network = currentChainId;
    if (!ARBITRUM_NETWORK.find((network) => network.chainId === currentChainId)) {
      await switchNetwork();
      network = ARBITRUM_ONE.chainId;
    }
    const account = await getAccount();
    if (!account) return;
    const balance = await getBalance(account);
    if (!balance) return;

    setInfo((prev) => {
      if (prev) return { ...prev, account, balance, network };
      return { account, balance, network };
    });
    setStatus((prev) => {
      if (prev) return { ...prev, button: true, error: "" };
      return { button: true, error: "" };
    });
  };

  const switchNetwork = async (chainId: string = ARBITRUM_ONE.chainId) => {
    const updateStatue = (errorMessage: string) => {
      setStatus((prev) =>
        prev ? { ...prev, button: false, error: errorMessage } : { button: false, error: errorMessage }
      );
    };

    const targetNetwork = ARBITRUM_NETWORK.find((network) => network.chainId === chainId);
    if (!targetNetwork) {
      updateStatue("Invalid chain ID. Please provide a valid chain ID.");
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
            updateStatue(message);
          }
        } else {
          updateStatue(message);
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        className={`px-[1.25rem] py-[0.75rem] w-full flex justify-center items-center bg-[${
          status?.button ? "#007aa6" : "#2a2c3f"
        }] border-0 rounded-sm`}
        onClick={async () => {
          if (!ethereum || !ethereum.isMetaMask) {
            setStatus((prev) => {
              if (prev)
                return {
                  ...prev,
                  button: false,
                  error: "MetaMask is not installed. Please install MetaMask to continue.",
                };
              return { button: false, error: "MetaMask is not installed. Please install MetaMask to continue." };
            });
            return;
          }
          await connectMetamask();
        }}
      >
        <img className="w-[25px] mr-[10px]" src={metamask} alt="metamask" />
        <b>Connect to MetaMask</b>
      </Button>
      {status && (
        <Alert variant="danger" hidden={status.error === ""}>
          <AlertCloseButton
            onClick={() => {
              setStatus((prev) => {
                if (prev) return { ...prev, error: "" };
                return { error: "", button: false };
              });
            }}
          />
          <p>{status.error}</p>
        </Alert>
      )}
    </div>
  );
};
