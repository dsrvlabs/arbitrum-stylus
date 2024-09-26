export interface CompileState {
  projectFiles: any;
  timestamp: number;
  setProjectFiles: (projectFiles: any) => void;
  setTimeStamp: (timestamp: number) => void;
}
