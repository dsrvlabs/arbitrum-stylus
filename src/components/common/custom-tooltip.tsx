import React, { Fragment, useState } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import type { OverlayDelay, OverlayTriggerRenderProps } from "react-bootstrap/esm/OverlayTrigger";

declare type AutoPlacement = "auto" | "auto-start" | "auto-end";
declare type VariationPlacement =
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "right-start"
  | "right-end"
  | "left-start"
  | "left-end";
declare const top: "top";
declare const bottom: "bottom";
declare const right: "right";
declare const left: "left";
declare type BasePlacement = typeof top | typeof bottom | typeof right | typeof left;
export declare type Placement = AutoPlacement | BasePlacement | VariationPlacement;

export type CustomTooltipType = {
  children:
    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
    | ((props: OverlayTriggerRenderProps) => React.ReactNode);
  placement?: Placement;
  tooltipId?: string;
  tooltipClasses?: string;
  tooltipText: string | JSX.Element;
  tooltipTextClasses?: string;
  delay?: OverlayDelay;
  hoverable?: boolean;
};

export const CustomTooltip = ({
  children,
  placement,
  tooltipId,
  tooltipClasses,
  tooltipText,
  tooltipTextClasses,
  delay,
  hoverable = false,
}: CustomTooltipType) => {
  const [show, setShow] = useState(false);

  const handleMouseEnter = () => setShow(true);
  const handleMouseLeave = () => setShow(false);

  if (typeof tooltipText !== "string") {
    tooltipText = React.cloneElement(tooltipText, {
      className: " bg-secondary text-wrap p-1 px-2 ",
    });
  }

  return (
    <Fragment>
      <OverlayTrigger
        show={show}
        placement={placement}
        trigger={hoverable ? ["hover", "focus"] : ["click", "focus"]}
        overlay={
          <Popover
            id={`popover-positioned-${placement}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Popover.Body
              id={!tooltipId ? `${tooltipText}Tooltip` : tooltipId}
              className={"text-wrap p-0 bg-secondary" + tooltipClasses}
            >
              {typeof tooltipText === "string" ? (
                <span className={"text-wrap p-1 px-2 bg-secondary " + { tooltipTextClasses }}>{tooltipText}</span>
              ) : (
                tooltipText
              )}
            </Popover.Body>
          </Popover>
        }
        delay={delay}
        onToggle={(nextShow) => setShow(nextShow)} // toggle 이벤트 핸들링
      >
        {children}
      </OverlayTrigger>
    </Fragment>
  );
};
