import { STAGE } from "./stage";
console.log("STAGE", STAGE);

const COMPILER_API_ENDPOINT_POOL = {
  local: "http://localhost:8000",
  dev: "https://dev.compiler.welldonestudio.io",
};
export const COMPILER_API_ENDPOINT = (os?: string) =>
  STAGE === "prod"
    ? os === "darwin"
      ? "https://mac-arm-compiler.welldonestudio.io"
      : "https://arbitrum.compiler.welldonestudio.io"
    : COMPILER_API_ENDPOINT_POOL[STAGE];

const COMPILER_WEBSOCKET_ENDPOINT_POOL = {
  local: "ws://localhost:8000",
  // local: "wss://arbitrum.compiler.welldonestudio.io",
  dev: "wss://dev.compiler.welldonestudio.io",
};
export const COMPILER_WEBSOCKET_ENDPOINT = (os?: string) =>
  STAGE === "prod"
    ? os === "darwin"
      ? "wss://mac-arm-compiler.welldonestudio.io"
      : "wss://arbitrum.compiler.welldonestudio.io"
    : COMPILER_WEBSOCKET_ENDPOINT_POOL[STAGE];
