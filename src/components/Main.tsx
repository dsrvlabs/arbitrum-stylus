import { type FunctionComponent, useState } from "react";
import type { Client } from "@remixproject/plugin";
import type { Api } from "@remixproject/plugin-utils";
import type { IRemixApi } from "@remixproject/plugin-api";
import { useShallow } from "zustand/react/shallow";

import { DocumentationButton } from "./DocumentationButton";
import { MakeAIssueButton } from "./MakeAIssueButton";
import { Header } from "./Header";
import { ConnectMetmask } from "./ConnectMetmask";
import { NetworkWarn } from "./NetworkWarn";

import { useStore } from "../zustand";
import { ARBITRUM_NETWORK } from "../const/network";
import { Project } from "./project";

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

export const Main: FunctionComponent<InterfaceProps> = ({}) => {
  console.log("Main rerender");
  const { account } = useStore(useShallow((state) => ({ account: state.account })));
  const isValidNetwork = ARBITRUM_NETWORK.some((item) => item.chainId === account.network.data);
  return (
    <div className="flex flex-col gap-3 h-[100vh]">
      <Header />
      {/* <StatusAlert alert={alert} setAlert={setAlert} /> */}
      <div className="flex-1">
        <ConnectMetmask />
        {isValidNetwork ? <Project /> : <NetworkWarn />}
      </div>
      <DocumentationButton />
      <MakeAIssueButton />
    </div>
  );
};
