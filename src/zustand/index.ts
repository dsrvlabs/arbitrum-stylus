import { create } from "zustand";
import { createGlobalStore } from "./global";
import { createAccountStore } from "./account";
import { createProjectStore } from "./project";
import { createCompileStore } from "./compile";
import { createDeployStore } from "./deploy";
import { createActivateStore } from "./activate";
import { createContractStore } from "./contract";
import type { GlobalState } from "./global.types";
import type { AccountState } from "./account.types";
import type { ProjectState } from "./project.types";
import type { CompileState } from "./compile.types";
import type { DeployState } from "./deploy.types";
import type { ActivateState } from "./activate.types";
import type { ContractState } from "./contract.types";

export const useStore = create<
  GlobalState & AccountState & ProjectState & CompileState & DeployState & ActivateState & ContractState
>()((...a) => ({
  ...createGlobalStore(...a),
  ...createAccountStore(...a),
  ...createProjectStore(...a),
  ...createCompileStore(...a),
  ...createDeployStore(...a),
  ...createActivateStore(...a),
  ...createContractStore(...a),
}));
