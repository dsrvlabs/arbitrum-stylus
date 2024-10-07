import type { HTMLAttributes } from "react";
import { Alert, Button } from "react-bootstrap";
import { IoMdClose } from "react-icons/io";
import { useShallow } from "zustand/react/shallow";

import { useStore } from "../zustand";

interface StatusAlertsProps {}
export const StatusAlerts = ({}: StatusAlertsProps) => {
  const { accountErr, setAccountErr, projectErr, setProjectErr } = useStore(
    useShallow((state) => ({
      accountErr: state.account.errorMsg,
      setAccountErr: state.account.setErrorMsg,
      projectErr: state.project.errorMsg,
      setProjectErr: state.project.setErrorMsg,
    }))
  );
  return (
    <div>
      {accountErr && (
        <Alert variant="danger" hidden={!accountErr}>
          <AlertCloseButton onClick={() => setAccountErr(null)} />
          <p>{accountErr}</p>
        </Alert>
      )}
      {projectErr && (
        <Alert variant="danger" hidden={!projectErr}>
          <AlertCloseButton onClick={() => setProjectErr(null)} />
          <p>{projectErr}</p>
        </Alert>
      )}
    </div>
  );
};

interface AlertCloseButtonProps extends HTMLAttributes<HTMLButtonElement> {
  className?: string;
  onClick: () => void;
  [key: string]: any;
}
const AlertCloseButton = ({ onClick, ...props }: AlertCloseButtonProps) => {
  return (
    <Button
      onClick={onClick}
      style={{
        background: "none",
        color: "inherit",
        border: "none",
        padding: 0,
        cursor: "pointer",
        font: "inherit",
        outline: "inherit",
      }}
      {...props}
    >
      <IoMdClose
        style={{
          width: "18px",
          height: "18px",
        }}
      />
    </Button>
  );
};
