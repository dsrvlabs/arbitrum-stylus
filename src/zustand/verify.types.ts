export interface ArbitrumVerifyStatusDto {
  network: string;
  contractAddress: string;
}

export interface ArbitrumVerifyContractDto {
  network: string;
  contractAddress: string;
  cliVersion: string;
  srcFileId?: string;
}

export interface VerifyState {
  verify: {
    loading: boolean;
    errorMsg: string | null;
    verified: boolean | null;
    address: string | null;
    fetchVerify: (arbitrumVerifyContractDto: ArbitrumVerifyStatusDto) => Promise<void>;
    requestVerify: (arbitrumVerifyContractDto: ArbitrumVerifyContractDto) => void;
    reset: () => void;
  };
}
