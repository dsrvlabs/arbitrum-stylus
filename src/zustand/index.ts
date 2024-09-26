import { create } from "zustand";
import { AccountState } from "./account.types";
import { createAccountStore } from "./account";
import { createCompileStore } from "./compile";
import { createProjectStore } from "./project";
import { ProjectState } from "./project.types";
import { CompileState } from "./compile.types";

export const useStore = create<AccountState & ProjectState>()((...a) => ({
  ...createAccountStore(...a),
  ...createProjectStore(...a),
  // ...createCompileStore(...a),
}));
