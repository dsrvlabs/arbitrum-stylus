import { STAGE } from "./stage";

const COMPILER_API_ENDPOINT_POOL = {
  local: "http://localhost:8000",
  // local: "https://cargo-test.veriwell.dev",
  // local: "https://arbitrum.compiler.welldonestudio.io",
  dev: "https://dev.compiler.welldonestudio.io",
  prod: "https://arbitrum.compiler.welldonestudio.io",
};
export const COMPILER_API_ENDPOINT = COMPILER_API_ENDPOINT_POOL[STAGE];

const COMPILER_WEBSOCKET_ENDPOINT_POOL = {
  local: "ws://localhost:8000",
  // local: "wss://arbitrum.compiler.welldonestudio.io",
  dev: "wss://dev.compiler.welldonestudio.io",
  prod: "wss://arbitrum.compiler.welldonestudio.io",
};
export const COMPILER_WEBSOCKET_ENDPOINT = COMPILER_WEBSOCKET_ENDPOINT_POOL[STAGE];
