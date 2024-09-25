import React, { Fragment } from "react";
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
};

export const CustomTooltip = ({
  children,
  placement,
  tooltipId,
  tooltipClasses,
  tooltipText,
  tooltipTextClasses,
  delay,
}: CustomTooltipType) => {
  if (typeof tooltipText !== "string") {
    tooltipText = React.cloneElement(tooltipText, {
      className: " bg-secondary text-wrap p-1 px-2 ",
    });
  }

  return (
    <Fragment>
      <OverlayTrigger
        placement={placement}
        overlay={
          <Popover id={`popover-positioned-${placement}`}>
            <Popover.Body
              id={!tooltipId ? `${tooltipText}Tooltip` : tooltipId}
              style={{ minWidth: "fit-content" }}
              className={"text-wrap p-1 px-2 bg-secondary w-100" + tooltipClasses}
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
      >
        {children}
      </OverlayTrigger>
    </Fragment>
  );
};
