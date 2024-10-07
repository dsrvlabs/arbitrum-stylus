export interface CompileState {
  compile: {
    loading: boolean;
    errorMsg: string | null;
    projectFiles: any;
    timestamp: number;
    setProjectFiles: (projectFiles: any) => void;
    setTimestamp: (timestamp: number) => void;
    setErrorMsg: (msg: string | null) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
  };
}
