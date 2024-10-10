export interface CompileState {
  compile: {
    fileName: string | null;
    timestamp: number | null;
    loading: boolean;
    errorMsg: string | null;
    setFileName: (fileName: string | null) => void;
    setTimestamp: (timestamp: number | null) => void;
    setErrorMsg: (msg: string | null) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
  };
}
