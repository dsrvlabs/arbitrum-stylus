import { create } from "zustand";
import { AccountState } from "./account.types";
import { createAccountStore } from "./account";
import { createProjectStore } from "./project";
import { ProjectState } from "./project.types";

export const useStore = create<AccountState & ProjectState>()((...a) => ({
  ...createAccountStore(...a),
  ...createProjectStore(...a),
  // ...createCompileStore(...a),
}));
