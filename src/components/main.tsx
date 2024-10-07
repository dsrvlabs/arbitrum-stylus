import { useShallow } from "zustand/react/shallow";

import { DocumentationButton } from "./DocumentationButton";
import { MakeAIssueButton } from "./MakeAIssueButton";
import { Header } from "./header";
import { ConnectMetmask } from "./connect-metamask";
import { NetworkWarn } from "./NetworkWarn";

import { useStore } from "../zustand";
import { ARBITRUM_NETWORK } from "../const/network";
import { Project } from "./project";
import { StatusAlerts } from "./status-alerts";
import { Interaction } from "./interaction";
import { Contracts } from "./contracts";

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
        {isValidNetwork ? (
          <>
            <Project />
            <Interaction />
            <Contracts />
          </>
        ) : (
          <NetworkWarn />
        )}
      </div>
      <DocumentationButton />
      <MakeAIssueButton />
    </div>
  );
};
