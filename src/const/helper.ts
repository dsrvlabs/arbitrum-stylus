import { Annotation, HighlightPosition } from "@remixproject/plugin-api";
import { log } from "../utils/logger";

export interface PositionDetails {
  file: string;
  annotation: Annotation;
  highlightPosition: HighlightPosition;
  positionDetail: Record<string, number | number>;
}

export const getPositionDetails = (msg: string): PositionDetails => {
  const result = {} as Record<string, number | string>;

  // To handle some compiler warning without location like SPDX license warning etc
  // if (!msg.includes(':')) return { errLine: -1, errCol: -1, errFile: '' };

  if (msg.includes("-->")) msg = msg.split("-->")[1].trim();

  // extract line / column
  let pos = msg.match(/^(.*?):([0-9]*?):([0-9]*?)?/);
  result.errLine = pos ? parseInt(pos[2]) - 1 : -1;
  result.errCol = pos ? parseInt(pos[3]) : -1;

  // extract file
  pos = msg.match(/^(https:.*?|http:.*?|.*?):/);
  result.errFile = pos ? pos[1] : msg;
  log.debug(result, result);

  const annotation: Annotation = {
    row: Number(result.errLine),
    column: Number(result.errCol),
    text: msg,
    type: "error",
  };

  const highlightPosition: HighlightPosition = {
    start: {
      line: Number(result.errLine),
      column: Number(result.errCol),
    },
    end: {
      line: Number(result.errLine),
      column: Number(result.errCol),
    },
  };
  return {
    file: result.errFile,
    annotation,
    highlightPosition,
    positionDetail: {
      row: result.errLine,
      col: result.errCol,
    },
  };
};

export const isRealError = (pos: Annotation) => pos.row !== -1 && pos.column !== -1;

export const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = () => {
      let encoded = reader.result?.toString().replace(/^data:(.*,)?/, "") ?? "";
      if (encoded.length % 4 > 0) encoded += "=".repeat(4 - (encoded.length % 4));

      resolve(encoded);
    };

    reader.onerror = (error) => reject(error);
  });
};

export const stringify = (data: any) => JSON.stringify(data, null, 2);

export const shortenHexString = (address: string, first: number, last: number) => {
  return address === "" ? "" : `${address.slice(0, first)}...${address.slice(-last)}`;
};
