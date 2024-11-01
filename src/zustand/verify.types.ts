import type { ArbitrumVerifyContractDto } from "../components/interaction/deploy";

export interface VerifyState {
  verify: {
    loading: boolean;
    errorMsg: string | null;
    verify: string | null;
    fetchVerify: (arbitrumVerifyContractDto: ArbitrumVerifyContractDto) => Promise<void>;
  };
}
