import { useEffect } from "react";
import { Button } from "react-bootstrap";
import { useShallow } from "zustand/react/shallow";

import { LoaderWrapper } from "./common/loader";
import { ARBITRUM_NETWORK, ARBITRUM_ONE } from "../const/network";
import { useStore } from "../zustand";
import metamask from "../assets/metamask.png";

interface RpcError extends Error {
  code: number;
  message: string;
}
const isRPCError = (error: any): error is RpcError => {
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
};

interface ConnectMetmaskProps {}
export const ConnectMetmask = ({}: ConnectMetmaskProps) => {
  const { provider, network, fetchNetwork, address, fetchAddress, balance, fetchBalance, project, setErrorMsg } =
    useStore(
      useShallow((state) => ({
        provider: state.account.provider,
        network: state.account.network,
        fetchNetwork: state.account.fetchNetwork,
        address: state.account.address,
        fetchAddress: state.account.fetchAddress,
        balance: state.account.balance,
        fetchBalance: state.account.fetchBalance,
        project: state.project,
        setErrorMsg: state.account.setErrorMsg,
      }))
    );
  const isLoading = provider.loading || network.loading || address.loading || balance.loading;
  const isActive =
    provider.data && ARBITRUM_NETWORK.some((item) => item.chainId === network.data) && address.data && balance.data;

  /**
   * 1. user가 arbitrum chain에 연결되어 있다면 user의 현재 network 정보를 가져오고, project의 network를 user의 network로 변경
   * 2. user가 arbitrum chain에 연결되어 있지 않다면 project의 network 정보를 가져오고, 그 network로 연결
   * 3. project의 network값이 변경된다면 user의 network값도 변경
   */
  const getAccountInfo = async () => {
    if (!provider.data) {
      setErrorMsg("Metamask is not installed. Please install Metamask to continue.");
      return;
    }
    //FIXME: 원래는 account.network.data를 인자값으로 사용해야 하나,
    // zustand에서 fetchNetwork를 통해 store 내부의 network.data 값을 변경하여도
    // 함수 내부에서 로직이 실행될 때 초기에 account.network.data를 정의할 때 가져온 값이 그대로 사용되는 문제가 있음
    // 즉, fetchNetwork로 인해 값이 변경되었음에도 초기값인 null값이 사용됨
    // 따라서 로직에서 변경된 network 값을 return을 통해 반환하여 사용하도록 수정함
    const networkFetched = await fetchNetwork();
    const arbitrumNetwork = ARBITRUM_NETWORK.find((item) => item.chainId === networkFetched);
    if (arbitrumNetwork) {
      project.setNetwork(arbitrumNetwork);
      await fetchAddress();
      await fetchBalance();
    } else {
      await switchNetwork(project.network.data.chainId);
      await fetchAddress();
      await fetchBalance();
    }
  };
  const switchNetwork = async (chainId = ARBITRUM_ONE.chainId) => {
    const targetNetwork = ARBITRUM_NETWORK.find((network) => network.chainId === chainId);
    if (!targetNetwork) {
      setErrorMsg("Trying to switch to an invalid network.");
      return;
    }
    try {
      await provider.data?.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
    } catch (error) {
      let message: string | null = "Failed to switch network. Please try again.";
      if (isRPCError(error)) {
        message = error.message;
        if (error.message.includes("already pending")) message = null;
      }

      if (typeof error === "object" && error !== null && "code" in error) {
        if (error.code === 4902) {
          try {
            await provider.data?.request({ method: "wallet_addEthereumChain", params: [targetNetwork] });
            message = null;
            return;
          } catch (error) {
            message = "Failed to add network. Please try again.";
            if (isRPCError(error)) {
              message = error.message;
            }
          }
        }
      }
      setErrorMsg(message);
    } finally {
      await fetchNetwork();
    }
  };
  const traceSwitchAccount = async (accounts: unknown) => {
    if (Array.isArray(accounts) && accounts.length > 0) {
      await fetchAddress();
      await fetchBalance();
    }
  };
  const traceSwitchNetwork = async (chainId: unknown) => {
    if (typeof chainId === "string") {
      const targetNetwork = ARBITRUM_NETWORK.find((network) => network.chainId === chainId);
      if (!targetNetwork) return;
      project.setNetwork(targetNetwork);
      await fetchBalance();
    }
  };

  useEffect(() => {
    if (!provider.data) {
      setErrorMsg("Metamask is not installed. Please install Metamask to continue.");
      return;
    }

    getAccountInfo();

    provider.data.on("accountsChanged", traceSwitchAccount);
    provider.data.on("chainChanged", traceSwitchNetwork);

    return () => {
      if (!provider.data) return;
      provider.data.removeListener("accountsChanged", traceSwitchAccount);
      provider.data.removeListener("chainChanged", traceSwitchNetwork);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <Button
        className={`px-[1.25rem] py-[0.75rem] w-full relative flex justify-center items-center ${
          isActive ? "bg-metamask-active" : "bg-metamask-default"
        } border-0 rounded-sm overflow-hidden`}
        disabled={isLoading}
        onClick={getAccountInfo}
      >
        <img className="w-[25px] mr-[10px]" src={metamask} alt="metamask" />
        <b>Connect to MetaMask</b>
        <LoaderWrapper loading={isLoading} />
      </Button>
    </div>
  );
};
