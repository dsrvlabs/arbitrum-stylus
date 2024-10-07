import { Alert } from "react-bootstrap";
import AlertCloseButton from "./AlertCloseButton";
import { useStore } from "../zustand";
import { useShallow } from "zustand/react/shallow";

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
