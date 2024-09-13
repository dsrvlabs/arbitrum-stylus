import { type FunctionComponent, useState } from "react";
import type { Client } from "@remixproject/plugin";
import type { Api } from "@remixproject/plugin-utils";
import type { IRemixApi } from "@remixproject/plugin-api";

import { DocumentationButton } from "./DocumentationButton";
import { MakeAIssueButton } from "./MakeAIssueButton";
import { Header } from "./Header";
import { ConnectMetmask } from "./ConnectMetmask";
import { ProjectInfo } from "./ProjectInfo";
import { NetworkWarn } from "./NetworkWarn";

export type StatusType = {
  button: boolean;
  error: string;
} | null;

export type InfoType = {
  network: string;
  account: string;
  balance: string;
} | null;

interface InterfaceProps {
  client: Client<Api, Readonly<IRemixApi>>;
}

export const Main: FunctionComponent<InterfaceProps> = ({ client }) => {
  const [status, setStatus] = useState<StatusType>(null);
  const [info, setInfo] = useState<InfoType>(null);

  console.log(info);

  return (
    <div className="flex flex-col gap-3 h-[100vh]">
      <Header client={client} />
      <div className="flex-1">
        <ConnectMetmask client={client} status={status} setStatus={setStatus} setInfo={setInfo} />
        {info ? (
          <ProjectInfo client={client} info={info} setInfo={setInfo} status={status} setStatus={setStatus} />
        ) : (
          <NetworkWarn />
        )}
      </div>
      <DocumentationButton />
      <MakeAIssueButton />
      {/* {chain ? (
        <ChainConnectContainer client={client} chain={chain} setChain={setChain} />
      ) : (
        <div>
          <ChainSelectButtonContainer setChain={setChain} client={client} />
          
          <MakeAIssueButton />
        </div>
      )} */}
    </div>
  );
};
