import { Button } from "react-bootstrap";

import { Header } from "./header";
import { ConnectMetmask } from "./connect-metamask";

import { Project } from "./project";
import { StatusAlerts } from "./status-alerts";
import { Interaction } from "./interaction";
import { Contracts } from "./contracts";
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
  return (
    <div className="flex flex-col gap-3 h-[100vh]">
      <Header />
      <StatusAlerts />
      <div className="flex flex-col flex-1 gap-4">
        <ConnectMetmask />
        <Project />
        <Interaction />
        <Contracts />
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
