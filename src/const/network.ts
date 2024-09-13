export const ARBITRUM_ONE = {
  chainName: "Arbitrum One",
  chainId: "0xa4b1",
  rpcUrls: ["https://arb1.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://arbiscan.io/"],
};

export const ARBITRUM_SEPOLIA = {
  chainName: "Arbitrum Sepolia (Testnet)",
  chainId: "0x66eee",
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia-rollup-explorer.arbitrum.io/"],
};

export const ARBITRUM_NETWORK = [ARBITRUM_ONE, ARBITRUM_SEPOLIA];
