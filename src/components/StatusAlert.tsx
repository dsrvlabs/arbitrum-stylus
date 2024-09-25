import { Alert } from "react-bootstrap";
import AlertCloseButton from "./AlertCloseButton";

interface StatusAlertProps {
  alert: string | null;
  setAlert: React.Dispatch<React.SetStateAction<string | null>>;
}
export const StatusAlert = ({ alert, setAlert }: StatusAlertProps) => (
  <Alert variant="danger" hidden={!alert}>
    <AlertCloseButton onClick={() => setAlert(null)} />
    <p>{alert}</p>
  </Alert>
);
