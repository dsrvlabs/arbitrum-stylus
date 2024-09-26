export interface DataType<T> {
  loading: boolean;
  error: boolean;
  errorMsg?: string;
  active?: boolean;
  disabled?: boolean;
  ready?: boolean;
  data: T | null;
}
