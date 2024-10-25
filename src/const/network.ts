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

export const OPEN_CAMPUS_CODEX = {
  chainName: "Open Campus Codex",
  network: "OPEN_CAMPUS_CODEX",
  chainId: "0xa045c",
  rpcUrls: ["	https://rpc.open-campus-codex.gelato.digital"],
  blockExplorerUrls: ["https://opencampus-codex.blockscout.com"],
};

export const ARBITRUM_NETWORK = [ARBITRUM_ONE, ARBITRUM_SEPOLIA, OPEN_CAMPUS_CODEX];

export const MAX_SAFE_CHAIN_ID = 4503599627370476;
