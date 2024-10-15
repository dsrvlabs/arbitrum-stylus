import { STAGE } from "./stage";

const COMPILER_API_ENDPOINT_POOL = {
  local: "http://localhost:8000",
  dev: "https://dev.compiler.welldonestudio.io",
  prod: "https://verify.welldonestudio.io",
};
export const COMPILER_API_ENDPOINT = COMPILER_API_ENDPOINT_POOL[STAGE];

const ARBITRUM_COMPILER_CONSUMER_ENDPOINT_POOL = {
  local: "ws://localhost:8000",
  dev: "wss://dev.compiler.welldonestudio.io",
  prod: "wss://prod.near.compiler.welldonestudio.io",
};
export const ARBITRUM_COMPILER_CONSUMER_ENDPOINT = ARBITRUM_COMPILER_CONSUMER_ENDPOINT_POOL[STAGE];

const ARBITRUM_COMPILER_CONSUMER_API_ENDPOINT_POOL = {
  local: "http://localhost:8000",
  dev: "https://dev.compiler.welldonestudio.io",
  prod: "https://verify.welldonestudio.io",
};

export const ARBITRUM_COMPILER_CONSUMER_API_ENDPOINT = ARBITRUM_COMPILER_CONSUMER_API_ENDPOINT_POOL[STAGE];
