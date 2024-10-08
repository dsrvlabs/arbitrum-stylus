import { Button } from "react-bootstrap";
import { useShallow } from "zustand/react/shallow";

import { Header } from "./header";
import { ConnectMetmask } from "./connect-metamask";

import { Project } from "./project";
import { StatusAlerts } from "./status-alerts";
import { Interaction } from "./interaction";
import { Contracts } from "./contracts";
import { useStore } from "../zustand";
import { ARBITRUM_NETWORK, ARBITRUM_ONE, ARBITRUM_SEPOLIA } from "../const/network";
import Github from "../assets/github-mark-light-64px.png";
import Welldone from "../assets/dsrv_wallet_icon.png";

export const initButtonStatus = {
  active: false,
  disabled: false,
  loading: false,
  error: false,
  ready: false,
};

type ButtonStatusType = {
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  ready?: boolean;
};

export type StatusType = {
  metamask: ButtonStatusType;
  compile: ButtonStatusType;
  deploy: ButtonStatusType;
  activate: ButtonStatusType;
};

export type InfoType = {
  network: string;
  account: string;
  balance: string;
} | null;

interface InterfaceProps {}
export const Main = ({}: InterfaceProps) => {
  const { account } = useStore(useShallow((state) => ({ account: state.account })));
  const isValidNetwork = ARBITRUM_NETWORK.some((item) => item.chainId === account.network.data);

  return (
    <div className="flex flex-col gap-3 h-[100vh]">
      <Header />
      <StatusAlerts />
      <div className="flex flex-col flex-1 gap-4">
        <ConnectMetmask />
        <Project />
        <Interaction />
        <Contracts />
        {/* {isValidNetwork ? (
          <>
            <Project />
            <Interaction />
            <Contracts />
          </>
        ) : (
          <small className="text-red-500 font-bold">
            {ARBITRUM_ONE.chainName} and {ARBITRUM_SEPOLIA.chainName} network is supported currently.
            <br />
            Please switch to the network below and reconnect your wallet.
            <br />
            <br />
            {ARBITRUM_NETWORK.map((item) => (
              <div key={item.chainId}>
                {item.chainName}
                <br />
                Chain ID: {item.chainId}
                <br />
                RPC URL: {item.blockExplorerUrls}
                <br />
                <br />
              </div>
            ))}
          </small>
        )} */}
      </div>
      <Button
        className="w-full flex justify-center items-center"
        variant="secondary"
        onClick={() => {
          window.open("https://docs.welldonestudio.io/code");
        }}
      >
        <img src={Welldone} style={{ width: "35px", marginRight: "20px" }} alt="Github logo" />
        <b>Documentation</b>
      </Button>
      <Button
        className="w-full flex justify-center items-center"
        onClick={() => {
          window.open("https://github.com/dsrvlabs/wds-code-remix/issues");
        }}
      >
        <img src={Github} style={{ width: "35px", marginRight: "20px" }} alt="Github logo" />
        <b>Make an issue</b>
      </Button>
    </div>
  );
};
