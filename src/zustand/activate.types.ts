import { DataType } from "./global.types";

export interface ActivateState {
  activate: {
    ready: boolean;
    loading: boolean;
    errorMsg: string | null;
    activated: boolean;
    setActivated: (activated: boolean) => void;
    setReady: (ready: boolean) => void;
    setLoading: (loading: boolean) => void;
    setErrorMsg: (msg: string | null) => void;
    reset: () => void;
  };
}
