import type { Client } from "@remixproject/plugin";
import type { Api } from "@remixproject/plugin-utils";
import type { IRemixApi } from "@remixproject/plugin-api";

export interface GlobalState {
  global: {
    client: Client<Api, Readonly<IRemixApi>> | null;
    setClient: (client: Client<Api, Readonly<IRemixApi>> | null) => void;
  };
}

export interface DataType<T> {
  loading: boolean;
  error: boolean;
  errorMsg?: string;
  active?: boolean;
  disabled?: boolean;
  ready?: boolean;
  data: T | null;
}

export type NonNullableDataType<T> = Omit<DataType<T>, "data"> & { data: NonNullable<T> };
