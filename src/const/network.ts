export const ARBITRUM_ONE = {
  chainName: "Arbitrum One",
  network: "ARBITRUM_ONE",
  chainId: "0xa4b1",
  rpcUrls: ["https://arb1.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://arbiscan.io"],
};

export const ARBITRUM_SEPOLIA = {
  chainName: "Arbitrum Sepolia (Testnet)",
  network: "ARBITRUM_SEPOLIA",
  chainId: "0x66eee",
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io"],
};

export const GELATO_NETWORK = {
  chainName: "Gelato Network",
  network: "GELATO_NETWORK",
  chainId: "0x1",
  rpcUrls: ["https://rpc.gelato.network"],
  blockExplorerUrls: ["https://etherscan.io"],
};

export const ARBITRUM_NETWORK = [ARBITRUM_ONE, ARBITRUM_SEPOLIA];

export const MAX_SAFE_CHAIN_ID = 4503599627370476;
