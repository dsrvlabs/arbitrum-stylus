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
import { StatusAlert } from "./StatusAlert";

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

interface InterfaceProps {
  client: Client<Api, Readonly<IRemixApi>>;
}

export const Main: FunctionComponent<InterfaceProps> = ({ client }) => {
  const [status, setStatus] = useState<StatusType>({
    metamask: { ...initButtonStatus },
    compile: initButtonStatus,
    deploy: initButtonStatus,
    activate: initButtonStatus,
  });
  const [alert, setAlert] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoType>(null);

  return (
    <div className="flex flex-col gap-3 h-[100vh]">
      <Header client={client} />
      <StatusAlert alert={alert} setAlert={setAlert} />
      <div className="flex-1">
        <ConnectMetmask status={status} setStatus={setStatus} info={info} setInfo={setInfo} setAlert={setAlert} />
        {info ? (
          <ProjectInfo
            client={client}
            info={info}
            setInfo={setInfo}
            status={status}
            setStatus={setStatus}
            setAlert={setAlert}
          />
        ) : (
          <NetworkWarn />
        )}
      </div>
      <DocumentationButton />
      <MakeAIssueButton />
    </div>
  );
};
