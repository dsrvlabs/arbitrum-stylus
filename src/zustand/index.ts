import { create } from "zustand";
import { createGlobalStore } from "./global";
import { createAccountStore } from "./account";
import { createProjectStore } from "./project";
import type { GlobalState } from "./global.types";
import type { AccountState } from "./account.types";
import type { ProjectState } from "./project.types";

export const useStore = create<GlobalState & AccountState & ProjectState>()((...a) => ({
  ...createGlobalStore(...a),
  ...createAccountStore(...a),
  ...createProjectStore(...a),
}));
