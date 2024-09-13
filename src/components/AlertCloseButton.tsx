import { HTMLAttributes } from "react";
import { Button } from "react-bootstrap";

import { IoMdClose } from "react-icons/io";

interface AlertCloseButtonProps extends HTMLAttributes<HTMLButtonElement> {
  className?: string;
  onClick: () => void;
  [key: string]: any;
}
function AlertCloseButton({ onClick, ...props }: AlertCloseButtonProps) {
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
}

export default AlertCloseButton;
