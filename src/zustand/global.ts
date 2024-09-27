import type { StateCreator } from "zustand";
import type { GlobalState } from "./global.types";

export const createGlobalStore: StateCreator<GlobalState> = (set) => ({
  global: {
    client: null,
    setClient: (client) => set((state) => ({ global: { ...state.global, client } })),
  },
});
