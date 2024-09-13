import { Button } from "react-bootstrap";
import Welldone from "../assets/dsrv_wallet_icon.png";
import { FunctionComponent } from "react";

export const DocumentationButton: FunctionComponent = () => {
  return (
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
  );
};
