import { DataType } from "./global.types";

export interface DeployState {
  deploy: {
    ready: boolean;
    loading: boolean;
    errorMsg: string | null;
    transactionData: DataType<string>;
    setTransactionData: (transactionData: string) => void;
    setReady: (ready: boolean) => void;
    setLoading: (loading: boolean) => void;
    setErrorMsg: (msg: string | null) => void;
    reset: () => void;
  };
}
