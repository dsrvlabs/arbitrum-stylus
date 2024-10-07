import { useShallow } from "zustand/react/shallow";

import { Compile } from "./compile";
import { Deploy } from "./deploy";
import { Activate } from "./activate";
import { useStore } from "../../zustand";

export const Interaction = () => {
  const { address, deployReady, activateReady } = useStore(
    useShallow((state) => ({
      address: state.contract.address,
      deployReady: state.deploy.ready,
      activateReady: state.activate.ready,
    }))
  );
  return (
    <div className="flex flex-col gap-2">
      <Compile />
      {deployReady ? <Deploy /> : null}
      {activateReady && address ? <Activate /> : null}
    </div>
  );
};
