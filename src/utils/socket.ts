import { Socket } from "socket.io-client";
import {
  COMPILER_ARBITRUM_COMPILE_COMPLETED_V1,
  COMPILER_ARBITRUM_COMPILE_ERROR_OCCURRED_V1,
  COMPILER_ARBITRUM_COMPILE_LOGGED_V1,
} from "wds-event";

export function cleanupSocketArbitrum(socketNeutron: Socket) {
  const events = [
    "connect",
    "disconnect",
    "connect_error",
    COMPILER_ARBITRUM_COMPILE_ERROR_OCCURRED_V1,
    COMPILER_ARBITRUM_COMPILE_LOGGED_V1,
    COMPILER_ARBITRUM_COMPILE_COMPLETED_V1,
  ];

  for (const event of events) {
    socketNeutron.off(event);
  }
}
