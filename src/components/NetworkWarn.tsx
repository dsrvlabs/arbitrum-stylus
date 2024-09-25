import { ARBITRUM_ONE, ARBITRUM_SEPOLIA } from "../const/network";

export const NetworkWarn = () => (
  <small className="text-red-500 font-bold">
    {ARBITRUM_ONE.chainName} and {ARBITRUM_SEPOLIA.chainName} network is supported currently.
    <br />
    Please switch to the network below and reconnect your wallet.
    <br />
    <br />
    Arbitrum One
    <br />
    Chain ID: 42161
    <br />
    RPC URL: https://arb1.arbitrum.io/rpc
    <br />
    <br />
    Arbitrum Sepolia
    <br />
    Chain ID: 421614
    <br />
    RPC URL: https://sepolia-rollup.arbitrum.io/rpc
    <br />
  </small>
);
