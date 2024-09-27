import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "react-bootstrap";
import { useShallow } from "zustand/react/shallow";
import web3 from "web3";
import type { Client } from "@remixproject/plugin";
import type { Api } from "@remixproject/plugin-utils";
import type { IRemixApi } from "@remixproject/plugin-api";

import metamask from "../assets/metamask.png";
import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../const/network";
import { InfoType, initButtonStatus, StatusType } from "./Main";
import { useStore } from "../zustand";
import { LoaderWrapper } from "./common/loader";

interface RpcError extends Error {
  code: number;
  message: string;
}
const isRPCError = (error: any): error is RpcError => {
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
};

interface ConnectMetmaskProps {}
export const ConnectMetmask = ({}: ConnectMetmaskProps) => {
  console.log("connect metamask rerender");
  const { account, project } = useStore(useShallow((state) => ({ account: state.account, project: state.project })));
  const isLoading =
    account.provider.loading || account.network.loading || account.address.loading || account.balance.loading;
  const isActive =
    account.provider.data &&
    ARBITRUM_NETWORK.some((item) => item.chainId === account.network.data) &&
    account.address.data &&
    account.balance.data;

  const handleClickMetamask = async () => {
    if (!account.provider.data) {
      account.setErrorMsg("Metamask is not installed. Please install Metamask to continue.");
      return;
    }
    await switchNetwork(project.network.data.chainId);
    await account.fetchAddress();
    await account.fetchBalance();
  };

  /**
   * 1. user가 arbitrum chain에 연결되어 있다면 user의 현재 network 정보를 가져오고, project의 network를 user의 network로 변경
   * 2. user가 arbitrum chain에 연결되어 있지 않다면 project의 network 정보를 가져오고, 그 network로 연결
   * 3. project의 network값이 변경된다면 user의 network값도 변경
   */
  const accessPluginFirst = async () => {
    if (!account.provider.data) {
      return;
    }
    await account.fetchNetwork();
    const arbitrumNetwork = ARBITRUM_NETWORK.find((item) => item.chainId === account.network.data);
    if (arbitrumNetwork) {
      project.setNetwork(arbitrumNetwork);
      await account.fetchAddress();
      await account.fetchBalance();
    } else {
      await switchNetwork(project.network.data.chainId);
      await account.fetchAddress();
      await account.fetchBalance();
    }
  };

  const switchNetwork = async (chainId = ARBITRUM_ONE.chainId) => {
    const targetNetwork = ARBITRUM_NETWORK.find((network) => network.chainId === chainId);
    if (!targetNetwork) {
      account.setErrorMsg("Trying to switch to an invalid network.");
      return;
    }
    try {
      await account.provider.data?.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
    } catch (error) {
      let message = "Failed to switch network. Please try again.";
      if (isRPCError(error)) {
        message = error.message;
      }

      if (typeof error === "object" && error !== null && "code" in error) {
        if (error.code === 4902) {
          try {
            await account.provider.data?.request({ method: "wallet_addEthereumChain", params: [targetNetwork] });
            return;
          } catch (error) {
            message = "Failed to add network. Please try again.";
            if (isRPCError(error)) {
              message = error.message;
            }
          }
        }
      }
      account.setErrorMsg(message);
    } finally {
      await account.fetchNetwork();
    }
  };

  const traceSwitchAccount = async (accounts: unknown) => {
    if (Array.isArray(accounts) && accounts.length > 0) {
      await account.fetchAddress();
      await account.fetchBalance();
    }
  };
  const traceSwitchNetwork = async (chainId: unknown) => {
    if (typeof chainId === "string") {
      const targetNetwork = ARBITRUM_NETWORK.find((network) => network.chainId === chainId);
      if (!targetNetwork) return;
      project.setNetwork(targetNetwork);
      await account.fetchBalance();
    }
  };

  useEffect(() => {
    if (!account.provider.data) {
      account.setErrorMsg("Metamask is not installed. Please install Metamask to continue.");
      return;
    }
    accessPluginFirst();

    account.provider.data.on("accountsChanged", traceSwitchAccount);
    account.provider.data.on("chainChanged", traceSwitchNetwork);

    return () => {
      if (!account.provider.data) return;
      account.provider.data.removeListener("accountsChanged", traceSwitchAccount);
      account.provider.data.removeListener("chainChanged", traceSwitchNetwork);
    };
  }, []);

  return (
    <div className="mb-2 flex flex-col gap-2">
      <Button
        className={`px-[1.25rem] py-[0.75rem] w-full relative flex justify-center items-center ${
          isActive ? "bg-metamask-active" : "bg-metamask-default"
        } border-0 rounded-sm overflow-hidden`}
        disabled={isLoading}
        onClick={handleClickMetamask}
      >
        <img className="w-[25px] mr-[10px]" src={metamask} alt="metamask" />
        <b>Connect to MetaMask</b>
        <LoaderWrapper loading={isLoading} />
      </Button>
    </div>
  );
};
